/* journalApi.js — thin client for /api/journal.

   Unlike circlesApi.js, this route trusts a client-supplied user_id (anon-key
   convention, same trust tier as syncService.js's other pushes) rather than
   verifying a Supabase bearer token — that's the existing, deliberate choice
   in node/routes/journal.js itself, not something introduced here. Getting
   rated by strangers is real but low-stakes the same way a check-in is: the
   worst case is someone mis-scoping their own anonymous entry. */

import { getUserId } from '../syncService';

async function asJson(res) {
  try { return await res.json(); } catch { return null; }
}

/** The public "judge my cooking" feed — every judged dish submission. */
export async function listJudgedFeed() {
  try {
    const res = await fetch('/api/journal/judged', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await asJson(res);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

/** One entry plus its individual ratings (used to check "have I already rated this"). */
export async function getJournalEntry(id) {
  try {
    const res = await fetch(`/api/journal/${id}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await asJson(res);
  } catch { return null; }
}

/** Creates a journal entry. Pass visibility: 'judged' to put it on the public
    leaderboard feed (the private scrapbook path — src/lib/cookJournal.js —
    is separate and unaffected by this). */
export async function createJournalEntry({
  username, displayName, dish, finalPhoto, recipeId, recipeSnapshot,
  isFaithful, remixNote, visibility = 'judged', steps = [], episodeId = null,
}) {
  const userId = await getUserId();
  const res = await fetch('/api/journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId, username, displayName, dish, steps, finalPhoto, recipeId,
      recipeSnapshot, isFaithful, remixNote, visibility, episodeId,
    }),
    signal: AbortSignal.timeout(8000),
  });
  const data = await asJson(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to submit your dish.');
  return data;
}

/** Rates someone else's judged entry, 1-5 stars + an optional comment. The
    backend rejects rating your own entry and upserts one rating per rater. */
export async function rateJournalEntry(id, { stars, comment = '' }) {
  const raterId = await getUserId();
  const res = await fetch(`/api/journal/${id}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raterId, stars, comment }),
    signal: AbortSignal.timeout(8000),
  });
  const data = await asJson(res);
  if (!res.ok) return { ok: false, error: data?.error || 'Failed to submit your rating.' };
  return { ok: true, ...data };
}
