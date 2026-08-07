/* archetypeApi.js — thin client for /api/archetype.

   Same shape and same authorization story as circlesApi.js: the caller's REAL
   Supabase access token goes with every request, so Postgres RLS decides
   access rather than a client-supplied user_id. A behavioral profile is
   personal data; it gets real authorization.

   Sync model: archetypeEngine.js is the source of truth in the moment (local,
   instant, works offline). This module just carries the distribution between
   devices. Every call fails soft — if the network is gone or the user is
   signed out, the local read still works and the feed still mixes. Nothing
   here is allowed to block a feed from rendering. */

import { supabase } from './supabase';
import { loadProfile, saveProfile } from './archetypeEngine';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function signedIn() {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data?.session?.access_token;
  } catch { return false; }
}

/* Pull the server copy and fold it into the local profile. Server wins on
   `pinned` and `muted` (those are the user's explicit choices, made on some
   device) — local wins on nothing, because scores merge additively below. */
export async function pullProfile() {
  if (!(await signedIn())) return loadProfile();
  try {
    const res = await fetch('/api/archetype', {
      headers: await authHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return loadProfile();
    const remote = await res.json();
    const local = loadProfile();

    const scores = { ...local.scores };
    for (const [id, v] of Object.entries(remote.scores || {})) {
      scores[id] = Math.max(scores[id] || 0, Number(v) || 0);
    }
    return saveProfile({
      ...local,
      scores,
      pinned: remote.pinned ?? local.pinned,
      muted: Array.isArray(remote.muted) && remote.muted.length ? remote.muted : local.muted,
    });
  } catch {
    return loadProfile();
  }
}

/* Push the local distribution up. Only scores / pinned / muted travel — the
   local `events` list (which action happened when) stays on the device. The
   server needs the read, not the browsing history. */
export async function pushProfile(profile = loadProfile()) {
  if (!(await signedIn())) return false;
  try {
    const res = await fetch('/api/archetype', {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify({
        scores: profile.scores || {},
        pinned: profile.pinned || null,
        muted: profile.muted || [],
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch { return false; }
}

/* Erase everywhere — server row and local cache. One call, no confirmation
   step in the API itself; the UI asks once and then this just works. */
export async function forgetProfile() {
  const cleared = saveProfile({
    scores: {}, events: [], pinned: null, muted: [], streak: null, seen: [], updatedAt: Date.now(),
  });
  if (!(await signedIn())) return cleared;
  try {
    await fetch('/api/archetype', {
      method: 'DELETE',
      headers: await authHeaders(),
      signal: AbortSignal.timeout(8000),
    });
  } catch { /* local is already cleared; that's the part that matters */ }
  return cleared;
}

/* Debounced background sync so callers can fire-and-forget after recording a
   signal without hammering the API on every interaction. */
let timer = null;
export function scheduleSync(delayMs = 15000) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; pushProfile().catch(() => {}); }, delayMs);
}
