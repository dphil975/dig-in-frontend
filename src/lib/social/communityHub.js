/* ============================================================================
   Merged module: src/lib/social/communityHub.js
   Combines the original src/lib/communityHub.js, src/lib/circlesApi.js, and
   src/lib/podcastApi.js. The old top-level files now re-export from here —
   see those files.

   Import path fix: circlesApi.js's `import { supabase } from './supabase'`
   became `from '../supabase'` since this file now lives one directory deeper
   (src/lib/social/ instead of src/lib/).
   ============================================================================ */

import { supabase } from '../supabase';

/* ── From communityHub.js ────────────────────────────────────────────────────

   communityHub.js — the real per-tag community: a stable address, not a
   transient filter.

   "Community hubs: No hub module. Tags exist and are the foundation." They
   were: every post already carries real structured tags (structuredTags.js),
   Home already supports a union tag search, and Community's "Your
   Communities" section already calls the hashtags you follow your
   communities — but tapping one only ever dropped you into Home with a
   `?tag=` that got scrubbed from the URL on the next render. No stable link,
   no page identity, nothing to build "related communities" or a time filter
   on top of. This is that foundation, poured properly: a page identity for
   one tag (real post counts, a follow toggle reusing the SAME
   dig_in_followed_tags list every other tag surface already reads/writes), a
   time window, and a related-communities signal computed from real
   co-occurrence — never a curated or guessed list.

   Deliberately does NOT re-implement tag search — buildFeed.searchByTags
   already does that correctly (union match, real dishes ranked first). This
   file adds the two things a single tag's results were still missing. */

export const TIME_WINDOWS = [
  { id: '24h',   label: '24 hours' },
  { id: 'week',  label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'year',  label: 'This year' },
];
const DAYS_FOR = { '24h': 1, week: 7, month: 30, year: 365 };
export const DEFAULT_WINDOW = 'week';

/**
 * Best-effort real timestamp for a post. Write-ups always carry one
 * (publishedAt, set at publish time — see userPosts.js). A judged dish/
 * viral/chain post's real created-at field isn't confirmed to exist on every
 * shape the journal backend returns (that's a separate repo — same caveat
 * nurture.js and rankRollout.js already document for this exact API), so
 * several common field names are checked defensively. Returns null — never a
 * guessed date — when nothing usable is found.
 */
export function timestampOf(post) {
  if (typeof post?.publishedAt === 'number') return post.publishedAt;
  const e = post?.entry;
  if (e) {
    for (const key of ['createdAt', 'submittedAt', 'loggedAt', 'ratedAt']) {
      const v = e[key];
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const t = Date.parse(v);
        if (!Number.isNaN(t)) return t;
      }
    }
  }
  return null;
}

/**
 * Filter posts to a time window. A post with NO extractable timestamp
 * (recipe cards have no created-at at all; some journal shapes may not
 * either — see timestampOf) is KEPT in every window rather than hidden —
 * "unknown" is never treated as "old," the same honest default this app
 * uses everywhere a real signal is missing (recess.js's handoff, nurture.js's
 * resonance score, rankRollout's shadow stage).
 */
export function filterByWindow(posts, windowId = DEFAULT_WINDOW, now = Date.now()) {
  const days = DAYS_FOR[windowId] || DAYS_FOR[DEFAULT_WINDOW];
  const cutoff = now - days * 86_400_000;
  return posts.filter((p) => {
    const t = timestampOf(p);
    return t == null || t >= cutoff;
  });
}

/**
 * Every OTHER tag that appears on the same posts as `tag`, counted by how
 * often — the real, computable "related communities" signal. No curated
 * list, no editorial guess: literally what people tag together in practice.
 * `posts` should be the tag's own full result set (every post already known
 * to carry `tag`), so this only needs to scan for what rides along with it.
 */
export function relatedTags(tag, posts, limit = 8) {
  const counts = new Map();
  for (const p of posts) {
    const tags = p?.tags || [];
    if (!tags.includes(tag)) continue;
    for (const t of tags) {
      if (t === tag) continue;
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([relatedTag, count]) => ({ tag: relatedTag, count }));
}

/** Real header stats: all-time count for this tag, plus how many of those
    fall in the currently-selected window — both true numbers, never a
    placeholder, recomputed live as the toggle changes. */
export function tagStats(posts, windowId = DEFAULT_WINDOW, now = Date.now()) {
  return { total: posts.length, inWindow: filterByWindow(posts, windowId, now).length };
}

/* ── From circlesApi.js ──────────────────────────────────────────────────────

   circlesApi.js — thin client for /api/circles.

   The one backend surface that authorizes by the caller's REAL Supabase
   access token (node/routes/circles.js verifies it server-side and forwards
   it to PostgREST so RLS's auth.uid() policies apply) rather than a
   client-supplied user_id — so every call here attaches the current
   session's token, not getUserId(). */

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function asJson(res) {
  try { return await res.json(); } catch { return null; }
}

export async function listCircles() {
  try {
    const res = await fetch('/api/circles', { headers: await authHeaders(), signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await asJson(res);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function createCircle({ name, description }) {
  const res = await fetch('/api/circles', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ name, description }),
    signal: AbortSignal.timeout(8000),
  });
  const data = await asJson(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to create circle.');
  return data;
}

export async function joinCircle(id) {
  try {
    const res = await fetch(`/api/circles/${id}/join`, {
      method: 'POST', headers: await authHeaders(), signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch { return false; }
}

export async function listMembers(id) {
  try {
    const res = await fetch(`/api/circles/${id}/members`, { headers: await authHeaders(), signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await asJson(res);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function listPosts(id) {
  try {
    const res = await fetch(`/api/circles/${id}/posts`, { headers: await authHeaders(), signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await asJson(res);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

/** Returns { ok, post } on success, or { ok: false, error, rung, held } — the
    Kindness Filter's warn/mute/ban responses carry the same copy the Nest's
    kindnessProtocol.js demo already shows, surfaced here for a real post.
    `sharePublic` (default false) lets the author opt this answer into the public
    weekly Issue; the server stores it defensively so posting works pre-migration. */
export async function createPost(id, { text, image, audio, sharePublic = false }) {
  const res = await fetch(`/api/circles/${id}/posts`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ text, image: image || '', audio: audio || '', share_public: !!sharePublic }),
    signal: AbortSignal.timeout(12000),
  });
  const data = await asJson(res);
  if (!res.ok) return { ok: false, error: data?.error || 'Failed to post.', rung: data?.rung, held: data?.held };
  return { ok: true, post: data };
}

/** This week's PUBLIC answers — the ones authors chose to share — for the
    weekly Issue. Anonymized (no user_id). Empty until migration 010 has run. */
export async function getPublicIssue() {
  try {
    const res = await fetch('/api/circles/public-issue', { headers: await authHeaders(), signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await asJson(res);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

/* ── From podcastApi.js ──────────────────────────────────────────────────────

   podcastApi.js — thin client for /api/podcast. Backend is real and already
   mounted (node/routes/podcast.js), but its POST /episodes endpoint has zero
   auth — anyone could publish an episode. So this client only wires up the
   read side (browsing); no public "submit an episode" UI ships alongside it.
   Same graceful-degrade-to-[]/null shape as every other API client in this
   app (circlesApi.js, journalApi.js, etc.). */

/** List published episodes, optionally filtered to one tag (the backend's
    own containment filter — see node/routes/podcast.js). */
export async function listEpisodes({ tag } = {}) {
  try {
    const qs = tag ? `?tag=${encodeURIComponent(tag)}` : '';
    const res = await fetch(`/api/podcast/episodes${qs}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await asJson(res);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function getEpisode(id) {
  try {
    const res = await fetch(`/api/podcast/episodes/${id}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await asJson(res);
  } catch { return null; }
}
