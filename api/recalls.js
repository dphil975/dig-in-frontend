/**
 * Vercel serverless function — current FDA food recalls for the Fresh tab's
 * Recall Watch.
 *
 * GET /api/recalls?limit=12
 *   → { recalls: [{ description, reason, classification, severity, date, firm,
 *                   state, link, source }], source, fetchedAt }
 *
 * Fetches the FDA's CURRENT recall press-release RSS server-side — the browser
 * can't (fda.gov sends no CORS header), and the openFDA endpoint the client
 * falls back to lags by weeks. Edge-cached for an hour (the feed only updates a
 * few times a week), so this barely ever actually hits the FDA. Always returns
 * 200 with a (possibly empty) array so the client degrades quietly.
 */

import { fetchFdaRecalls } from './_fdaRecalls.mjs';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const raw = parseInt((req.query && req.query.limit) || '12', 10);
  const limit = Math.min(Math.max(Number.isFinite(raw) ? raw : 12, 1), 25);

  try {
    const recalls = await fetchFdaRecalls({ limit });
    res.status(200).end(JSON.stringify({ recalls, source: 'fda-rss', fetchedAt: Date.now() }));
  } catch (err) {
    console.error('[recalls]', err && err.message);
    res.status(200).end(JSON.stringify({ recalls: [], source: 'error', error: 'fda_unavailable' }));
  }
}
