/**
 * Vercel serverless function -- comprehensive FDA food recall API.
 *
 * All actions return 200 with JSON (even on upstream failure) so the client
 * degrades quietly. The `action` query param selects the mode:
 *
 *   GET /api/recalls                               default feed, most-urgent first
 *   GET /api/recalls?action=feed&limit=15&skip=0    paginated feed with filters
 *   GET /api/recalls?action=search&q=romaine        full-text search
 *   GET /api/recalls?action=alerts                  high-severity last-7-days only
 *   GET /api/recalls?action=stats                   aggregate breakdown
 *   GET /api/recalls?action=match&items=spinach,eggs pantry-match (comma-separated)
 *   GET /api/recalls?action=detail&id=rss-20261010-0 single recall by id
 *   GET /api/recalls?action=digest                  human-readable summary
 *
 * Shared filters (feed, search, alerts):
 *   severity   high | medium | low          (comma-separated for multiple)
 *   category   produce | meat | dairy | …   (comma-separated)
 *   state      CA | NY | nationwide | …     (comma-separated)
 *   allergen   milk | peanuts | soy | …     (comma-separated)
 *   since      YYYYMMDD                     recalls on or after this date
 *   until      YYYYMMDD                     recalls on or before this date
 *   firm       partial firm name match
 *   sources    all | rss | openfda
 *   sort       urgency | date | severity | category | firm
 *   force      1 = bypass edge cache
 */

import {
  fetchFdaRecalls,
  urgencyScore,
  daysAgo,
  extractAllergens,
  categorize,
} from './_fdaRecalls.mjs';

// ── Helpers ──────────────────────────────────────────────────────────────────

function clampInt(val, fallback, min, max) {
  const n = parseInt(val, 10);
  return Math.min(Math.max(Number.isFinite(n) ? n : fallback, min), max);
}

function csvSet(val) {
  if (!val) return null;
  const items = String(val).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return items.length ? new Set(items) : null;
}

function json(res, status, body) {
  res.status(status).end(JSON.stringify(body));
}

function setCommonHeaders(res, q) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, If-None-Match');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (q.force === '1') {
    res.setHeader('Cache-Control', 'no-cache, no-store');
  } else {
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=14400');
  }
}

// Simple hash for ETag -- fast, not cryptographic
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

// ── Shared filter pipeline ───────────────────────────────────────────────────

function applyFilters(recalls, q) {
  let filtered = recalls;

  const severities = csvSet(q.severity);
  if (severities) {
    filtered = filtered.filter(r => severities.has(r.severity));
  }

  const categories = csvSet(q.category);
  if (categories) {
    filtered = filtered.filter(r => categories.has(r.category));
  }

  const states = csvSet(q.state);
  if (states) {
    filtered = filtered.filter(r => {
      const dist = (r.distributionStates || []).map(s => s.toLowerCase());
      const home = (r.state || '').toLowerCase();
      return dist.some(s => states.has(s)) || dist.includes('nationwide') || states.has(home);
    });
  }

  const allergens = csvSet(q.allergen);
  if (allergens) {
    filtered = filtered.filter(r =>
      (r.allergens || []).some(a => allergens.has(a)),
    );
  }

  if (q.since) {
    filtered = filtered.filter(r => (r.date || '') >= q.since);
  }
  if (q.until) {
    filtered = filtered.filter(r => (r.date || '') <= q.until);
  }

  if (q.firm) {
    const firmQ = q.firm.toLowerCase();
    filtered = filtered.filter(r =>
      (r.firm || '').toLowerCase().includes(firmQ) ||
      (r.description || '').toLowerCase().includes(firmQ),
    );
  }

  return filtered;
}

function applySorting(recalls, sortMode) {
  const mode = sortMode || 'urgency';
  const rank = { high: 0, medium: 1, low: 2 };

  return [...recalls].sort((a, b) => {
    switch (mode) {
      case 'date':
        return (b.date || '').localeCompare(a.date || '');
      case 'severity':
        return (rank[a.severity] ?? 1) - (rank[b.severity] ?? 1)
          || (b.date || '').localeCompare(a.date || '');
      case 'category':
        return (a.category || '').localeCompare(b.category || '')
          || (b.date || '').localeCompare(a.date || '');
      case 'firm':
        return (a.firm || 'zzz').localeCompare(b.firm || 'zzz')
          || (b.date || '').localeCompare(a.date || '');
      default: // urgency
        return (b.urgency || 0) - (a.urgency || 0)
          || (b.date || '').localeCompare(a.date || '');
    }
  });
}

// ── Action: feed (default) ───────────────────────────────────────────────────

async function actionFeed(q) {
  const limit = clampInt(q.limit, 15, 1, 50);
  const skip = clampInt(q.skip, 0, 0, 500);
  const sources = ['all', 'rss', 'openfda'].includes(q.sources) ? q.sources : 'all';

  const raw = await fetchFdaRecalls({ limit: 100, sources });
  const filtered = applyFilters(raw, q);
  const sorted = applySorting(filtered, q.sort);
  const page = sorted.slice(skip, skip + limit);

  return {
    recalls: page,
    pagination: {
      total: sorted.length,
      limit,
      skip,
      hasMore: skip + limit < sorted.length,
    },
    source: sources === 'all' ? 'merged' : sources,
    fetchedAt: Date.now(),
  };
}

// ── Action: search ───────────────────────────────────────────────────────────

async function actionSearch(q) {
  const query = (q.q || '').toLowerCase().trim();
  if (!query) {
    return { recalls: [], query: '', message: 'Provide a search term via ?q=' };
  }

  const limit = clampInt(q.limit, 20, 1, 50);
  const sources = ['all', 'rss', 'openfda'].includes(q.sources) ? q.sources : 'all';
  const raw = await fetchFdaRecalls({ limit: 100, sources });

  const terms = query.split(/\s+/).filter(Boolean);

  const scored = raw
    .map(r => {
      const hay = [
        r.description, r.reason, r.firm, r.category,
        (r.allergens || []).join(' '), (r.distributionStates || []).join(' '),
      ].filter(Boolean).join(' ').toLowerCase();

      let hits = 0;
      for (const t of terms) {
        if (hay.includes(t)) hits++;
      }
      return { recall: r, relevance: hits };
    })
    .filter(r => r.relevance > 0);

  scored.sort((a, b) => b.relevance - a.relevance || (b.recall.urgency || 0) - (a.recall.urgency || 0));

  let results = scored.map(s => s.recall);
  results = applyFilters(results, q);

  return {
    recalls: results.slice(0, limit),
    query,
    totalMatches: results.length,
    fetchedAt: Date.now(),
  };
}

// ── Action: alerts ───────────────────────────────────────────────────────────

async function actionAlerts(q) {
  const windowDays = clampInt(q.days, 7, 1, 30);
  const raw = await fetchFdaRecalls({ limit: 100, sources: 'all' });

  const alerts = raw.filter(r => {
    if (r.severity !== 'high') return false;
    const age = daysAgo(r.date);
    return age !== null && age <= windowDays;
  });

  const filtered = applyFilters(alerts, q);
  const sorted = applySorting(filtered, 'urgency');

  const allergenBreakdown = {};
  sorted.forEach(r => {
    (r.allergens || []).forEach(a => {
      allergenBreakdown[a] = (allergenBreakdown[a] || 0) + 1;
    });
  });

  return {
    recalls: sorted,
    window: `${windowDays} days`,
    count: sorted.length,
    allergenBreakdown,
    fetchedAt: Date.now(),
  };
}

// ── Action: stats ────────────────────────────────────────────────────────────

async function actionStats(q) {
  const sources = ['all', 'rss', 'openfda'].includes(q.sources) ? q.sources : 'all';
  const raw = await fetchFdaRecalls({ limit: 100, sources });

  const bySeverity = {};
  const byCategory = {};
  const bySource = {};
  const byAllergen = {};
  const byState = {};
  const byFirm = {};
  let highCount = 0;
  let last24h = 0;
  let last7d = 0;
  let last30d = 0;
  let withAllergens = 0;
  let withFirm = 0;
  let withLink = 0;

  raw.forEach(r => {
    bySeverity[r.severity || 'unknown'] = (bySeverity[r.severity || 'unknown'] || 0) + 1;
    byCategory[r.category || 'other'] = (byCategory[r.category || 'other'] || 0) + 1;
    bySource[r.source || 'unknown'] = (bySource[r.source || 'unknown'] || 0) + 1;

    if (r.severity === 'high') highCount++;
    if (r.allergens && r.allergens.length) {
      withAllergens++;
      r.allergens.forEach(a => { byAllergen[a] = (byAllergen[a] || 0) + 1; });
    }
    if (r.firm) {
      withFirm++;
      byFirm[r.firm] = (byFirm[r.firm] || 0) + 1;
    }
    if (r.link) withLink++;

    (r.distributionStates || []).forEach(s => {
      byState[s] = (byState[s] || 0) + 1;
    });

    const age = daysAgo(r.date);
    if (age !== null) {
      if (age <= 1) last24h++;
      if (age <= 7) last7d++;
      if (age <= 30) last30d++;
    }
  });

  const topFirms = Object.entries(byFirm)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([firm, count]) => ({ firm, count }));

  const topStates = Object.entries(byState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([state, count]) => ({ state, count }));

  return {
    total: raw.length,
    bySeverity,
    byCategory,
    bySource,
    byAllergen,
    topFirms,
    topStates,
    highSeverityCount: highCount,
    recency: { last24h, last7d, last30d },
    coverage: { withAllergens, withFirm, withLink },
    fetchedAt: Date.now(),
  };
}

// ── Action: match ────────────────────────────────────────────────────────────

async function actionMatch(q) {
  const itemsRaw = (q.items || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!itemsRaw.length) {
    return { matches: [], message: 'Provide pantry items via ?items=spinach,eggs,milk' };
  }

  const raw = await fetchFdaRecalls({ limit: 100, sources: 'all' });
  const matches = [];

  for (const item of itemsRaw) {
    const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`\\b${escaped}(e?s)?\\b`, 'i');
    const hits = raw.filter(r => {
      const hay = [r.description, r.reason, r.firm].filter(Boolean).join(' ');
      return rx.test(hay);
    });
    if (hits.length) {
      const sorted = applySorting(hits, 'urgency');
      const mostUrgent = sorted[0];
      matches.push({
        item,
        recallCount: hits.length,
        highestSeverity: sorted.some(r => r.severity === 'high') ? 'high'
          : sorted.some(r => r.severity === 'medium') ? 'medium' : 'low',
        mostUrgent: {
          description: mostUrgent.description,
          severity: mostUrgent.severity,
          date: mostUrgent.date,
          firm: mostUrgent.firm,
          link: mostUrgent.link,
          allergens: mostUrgent.allergens,
          category: mostUrgent.category,
        },
        allRecalls: sorted.map(r => ({
          id: r.id,
          description: r.description,
          severity: r.severity,
          date: r.date,
          firm: r.firm,
          link: r.link,
        })),
      });
    }
  }

  matches.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return (rank[a.highestSeverity] ?? 1) - (rank[b.highestSeverity] ?? 1)
      || b.recallCount - a.recallCount;
  });

  return {
    matches,
    itemsChecked: itemsRaw.length,
    itemsMatched: matches.length,
    itemsClear: itemsRaw.length - matches.length,
    fetchedAt: Date.now(),
  };
}

// ── Action: detail ───────────────────────────────────────────────────────────

async function actionDetail(q) {
  const id = (q.id || '').trim();
  if (!id) {
    return { recall: null, message: 'Provide a recall id via ?id=' };
  }

  const raw = await fetchFdaRecalls({ limit: 100, sources: 'all' });
  const recall = raw.find(r => r.id === id);

  if (!recall) {
    return { recall: null, message: `No recall found with id "${id}"` };
  }

  const age = daysAgo(recall.date);
  const related = raw
    .filter(r => r.id !== id && (
      (r.firm && r.firm === recall.firm) ||
      (r.category && r.category === recall.category && r.severity === recall.severity)
    ))
    .slice(0, 5)
    .map(r => ({ id: r.id, description: r.description, severity: r.severity, date: r.date }));

  return {
    recall: {
      ...recall,
      ageInDays: age,
      isRecent: age !== null && age <= 7,
      urgency: urgencyScore(recall),
    },
    related,
    fetchedAt: Date.now(),
  };
}

// ── Action: digest ───────────────────────────────────────────────────────────

async function actionDigest(q) {
  const raw = await fetchFdaRecalls({ limit: 100, sources: 'all' });

  const high = raw.filter(r => r.severity === 'high');
  const recent = raw.filter(r => { const a = daysAgo(r.date); return a !== null && a <= 7; });
  const allergenRecalls = raw.filter(r => r.allergens && r.allergens.length);

  const categories = {};
  raw.forEach(r => { categories[r.category || 'other'] = (categories[r.category || 'other'] || 0) + 1; });
  const topCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const allAllergens = {};
  allergenRecalls.forEach(r => {
    (r.allergens || []).forEach(a => { allAllergens[a] = (allAllergens[a] || 0) + 1; });
  });
  const topAllergens = Object.entries(allAllergens).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const lines = [];

  if (high.length) {
    lines.push(`${high.length} high-severity recall${high.length !== 1 ? 's' : ''} active right now.`);
    high.slice(0, 3).forEach(r => {
      const who = r.firm ? `${r.firm}: ` : '';
      const age = daysAgo(r.date);
      const when = age !== null && age <= 1 ? 'today' : age !== null ? `${age} days ago` : '';
      lines.push(`  -- ${who}${(r.description || '').slice(0, 120)}${when ? ` (${when})` : ''}`);
    });
  } else {
    lines.push('No high-severity recalls active right now.');
  }

  if (recent.length) {
    lines.push(`${recent.length} recall${recent.length !== 1 ? 's' : ''} in the last 7 days.`);
  }

  if (topCategories.length) {
    const catLine = topCategories.map(([c, n]) => `${c} (${n})`).join(', ');
    lines.push(`Most affected categories: ${catLine}.`);
  }

  if (topAllergens.length) {
    const allergenLine = topAllergens.map(([a, n]) => `${a} (${n})`).join(', ');
    lines.push(`Allergen alerts: ${allergenLine}.`);
  }

  lines.push(`${raw.length} total active recalls tracked across FDA RSS and openFDA.`);

  return {
    digest: lines.join('\n'),
    summary: {
      total: raw.length,
      highSeverity: high.length,
      lastSevenDays: recent.length,
      allergenRelated: allergenRecalls.length,
      topCategories: topCategories.map(([cat, count]) => ({ category: cat, count })),
      topAllergens: topAllergens.map(([allergen, count]) => ({ allergen, count })),
    },
    headlines: high.slice(0, 5).map(r => ({
      description: r.description,
      firm: r.firm,
      severity: r.severity,
      date: r.date,
      link: r.link,
      category: r.category,
      allergens: r.allergens,
    })),
    fetchedAt: Date.now(),
  };
}

// ── Action: categories ───────────────────────────────────────────────────────

async function actionCategories() {
  const raw = await fetchFdaRecalls({ limit: 100, sources: 'all' });

  const cats = {};
  raw.forEach(r => {
    const c = r.category || 'other';
    if (!cats[c]) cats[c] = { count: 0, highSeverity: 0, recentCount: 0 };
    cats[c].count++;
    if (r.severity === 'high') cats[c].highSeverity++;
    const age = daysAgo(r.date);
    if (age !== null && age <= 7) cats[c].recentCount++;
  });

  const list = Object.entries(cats)
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.count - a.count);

  return { categories: list, total: raw.length, fetchedAt: Date.now() };
}

// ── Action: allergens ────────────────────────────────────────────────────────

async function actionAllergens(q) {
  const raw = await fetchFdaRecalls({ limit: 100, sources: 'all' });

  const allergenMap = {};
  raw.forEach(r => {
    (r.allergens || []).forEach(a => {
      if (!allergenMap[a]) allergenMap[a] = { count: 0, recalls: [] };
      allergenMap[a].count++;
      if (allergenMap[a].recalls.length < 5) {
        allergenMap[a].recalls.push({
          id: r.id,
          description: r.description,
          firm: r.firm,
          date: r.date,
          severity: r.severity,
          link: r.link,
        });
      }
    });
  });

  const list = Object.entries(allergenMap)
    .map(([allergen, data]) => ({ allergen, ...data }))
    .sort((a, b) => b.count - a.count);

  const target = (q.allergen || '').toLowerCase();
  if (target) {
    const match = list.find(a => a.allergen === target);
    return {
      allergen: target,
      ...(match || { count: 0, recalls: [] }),
      fetchedAt: Date.now(),
    };
  }

  return { allergens: list, fetchedAt: Date.now() };
}

// ── Action: states ───────────────────────────────────────────────────────────

async function actionStates(q) {
  const raw = await fetchFdaRecalls({ limit: 100, sources: 'all' });

  const stateMap = {};
  raw.forEach(r => {
    (r.distributionStates || []).forEach(s => {
      if (!stateMap[s]) stateMap[s] = { count: 0, highSeverity: 0 };
      stateMap[s].count++;
      if (r.severity === 'high') stateMap[s].highSeverity++;
    });
  });

  const list = Object.entries(stateMap)
    .map(([state, data]) => ({ state, ...data }))
    .sort((a, b) => b.count - a.count);

  const target = (q.state || '').toUpperCase();
  if (target) {
    const stateRecalls = raw.filter(r =>
      (r.distributionStates || []).includes(target) ||
      (r.distributionStates || []).includes('nationwide'),
    );
    return {
      state: target,
      recalls: applySorting(stateRecalls, 'urgency').slice(0, 25),
      count: stateRecalls.length,
      fetchedAt: Date.now(),
    };
  }

  return { states: list, fetchedAt: Date.now() };
}

// ── Action: firms ────────────────────────────────────────────────────────────

async function actionFirms(q) {
  const raw = await fetchFdaRecalls({ limit: 100, sources: 'all' });

  const firmMap = {};
  raw.forEach(r => {
    const firm = r.firm || 'Unknown';
    if (!firmMap[firm]) firmMap[firm] = { count: 0, recalls: [], severities: {} };
    firmMap[firm].count++;
    firmMap[firm].severities[r.severity || 'medium'] = (firmMap[firm].severities[r.severity || 'medium'] || 0) + 1;
    if (firmMap[firm].recalls.length < 5) {
      firmMap[firm].recalls.push({
        id: r.id,
        description: r.description,
        severity: r.severity,
        date: r.date,
        category: r.category,
      });
    }
  });

  const list = Object.entries(firmMap)
    .filter(([f]) => f !== 'Unknown')
    .map(([firm, data]) => ({ firm, ...data }))
    .sort((a, b) => b.count - a.count);

  const target = (q.firm || '').toLowerCase();
  if (target) {
    const matches = list.filter(f => f.firm.toLowerCase().includes(target));
    return { firms: matches, query: target, fetchedAt: Date.now() };
  }

  return { firms: list.slice(0, 25), total: list.length, fetchedAt: Date.now() };
}

// ── Action: timeline ─────────────────────────────────────────────────────────

async function actionTimeline() {
  const raw = await fetchFdaRecalls({ limit: 100, sources: 'all' });

  const byDate = {};
  raw.forEach(r => {
    if (!r.date) return;
    const day = r.date.length === 8
      ? `${r.date.slice(0, 4)}-${r.date.slice(4, 6)}-${r.date.slice(6, 8)}`
      : r.date;
    if (!byDate[day]) byDate[day] = { date: day, total: 0, high: 0, medium: 0, low: 0, recalls: [] };
    byDate[day].total++;
    byDate[day][r.severity || 'medium']++;
    if (byDate[day].recalls.length < 3) {
      byDate[day].recalls.push({
        id: r.id,
        description: (r.description || '').slice(0, 100),
        severity: r.severity,
        firm: r.firm,
        category: r.category,
      });
    }
  });

  const timeline = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));

  return { timeline, days: timeline.length, fetchedAt: Date.now() };
}

// ── Router ───────────────────────────────────────────────────────────────────

const ACTIONS = {
  feed: actionFeed,
  search: actionSearch,
  alerts: actionAlerts,
  stats: actionStats,
  match: actionMatch,
  detail: actionDetail,
  digest: actionDigest,
  categories: actionCategories,
  allergens: actionAllergens,
  states: actionStates,
  firms: actionFirms,
  timeline: actionTimeline,
};

export default async function handler(req, res) {
  const q = req.query || {};
  setCommonHeaders(res, q);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return json(res, 204, {});
  }

  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed. Use GET.' });
  }

  const action = (q.action || 'feed').toLowerCase();
  const handler = ACTIONS[action];

  if (!handler) {
    return json(res, 400, {
      error: `Unknown action "${action}"`,
      available: Object.keys(ACTIONS),
    });
  }

  try {
    const result = await handler(q);

    // ETag for conditional responses
    const body = JSON.stringify(result);
    const etag = `"recalls-${simpleHash(body)}"`;
    res.setHeader('ETag', etag);

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    res.status(200).end(body);
  } catch (err) {
    console.error(`[recalls:${action}]`, err && err.message);
    json(res, 200, {
      recalls: [],
      error: 'fda_unavailable',
      action,
      fetchedAt: Date.now(),
    });
  }
}
