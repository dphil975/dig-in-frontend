/* ════════════════════════════════════════════════════════════
   Merged module — originally three files in src/lib/:
     · supabase.js     (Supabase client)
     · syncService.js  (localStorage ⇄ backend sync)
     · analytics.js    (PostHog event tracking)
   ════════════════════════════════════════════════════════════ */

import { createClient } from '@supabase/supabase-js';
import { secureStorage } from './native';

/* ── from supabase.js ──────────────────────────────────────────*/

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase env vars not set. Auth will not work. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
}

// The auth session (access + refresh tokens) is stored through the platform
// seam: OS-backed secure storage on a device, localStorage on the web. Same
// behavior as before on web; hardened automatically inside a Capacitor shell.
//
// createClient() throws synchronously if supabaseUrl is empty, which would
// crash the whole module graph on import (blank screen, nothing rendered) in
// local dev where .env is left blank. Only construct a real client when
// configured; consumers (useAuth) check isSupabaseConfigured before touching
// `supabase` so a null client here is never dereferenced.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: secureStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/* ── from syncService.js ───────────────────────────────────────
 * Dig In Sync Service
 *
 * Strategy: localStorage is the source of truth for instant UX.
 * Supabase (via the Node backend) is the durable, cross-device store.
 *
 * On app load / login  → pullAndMerge()
 *   Fetches remote profile, badges, saved recipes.
 *   Merges into localStorage: coins take the higher value; arrays union by key.
 *
 * On each write        → push*() (fire-and-forget, never throws)
 *   Writes to localStorage first, then POSTs to backend silently.
 */

const API = '/api/users';

function ff(path, opts = {}) {
  return fetch(path, { signal: AbortSignal.timeout(6000), ...opts }).catch(() => null);
}

/* getUserId() used to fabricate its own random UUID per browser, completely
   independent of whether the user was signed in — so two devices logged into
   the SAME real Supabase account (AuthGate already requires sign-in whenever
   Supabase is configured) got two different ids and never saw each other's
   data. This resolves the REAL authenticated user id instead, so cross-device
   sync actually works for a signed-in account. The random-UUID scheme is kept
   only as the local-dev fallback (no .env / Supabase unconfigured), matching
   AuthGate's own bypass. */
let _cachedUserId = null;

function devFallbackId() {
  let id = localStorage.getItem('dig_in_user_id');
  if (!id) {
    id = 'u_' + crypto.randomUUID();
    localStorage.setItem('dig_in_user_id', id);
  }
  return id;
}

if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange((_event, session) => {
    _cachedUserId = session?.user?.id || null;
  });
}

export async function getUserId() {
  if (!isSupabaseConfigured) return devFallbackId();
  if (_cachedUserId) return _cachedUserId;
  const { data } = await supabase.auth.getUser();
  _cachedUserId = data?.user?.id || null;
  return _cachedUserId;
}

/* ── Pull & merge ─────────────────────────────────────────────────────────── */

export async function pullAndMerge() {
  const userId = await getUserId();
  const qs     = `user_id=${encodeURIComponent(userId)}`;

  let profile, badges, savedRecipes;
  try {
    [profile, badges, savedRecipes] = await Promise.all([
      ff(`${API}/profile?${qs}`).then(r => r?.json().catch(() => null)),
      ff(`${API}/badges?${qs}`).then(r => r?.json().catch(() => [])),
      ff(`${API}/saved-recipes?${qs}`).then(r => r?.json().catch(() => [])),
    ]);
  } catch {
    return; // network unavailable — stay with localStorage
  }

  // Coins: take the higher value so offline-earned coins are never lost
  if (profile?.coins != null) {
    const local  = parseInt(localStorage.getItem('dig_in_coins') || '0', 10);
    const merged = Math.max(local, profile.coins);
    localStorage.setItem('dig_in_coins', String(merged));
    if (profile.coins < merged) pushProfile({ coins: merged }); // sync winner back
  }

  // Home borough: remote fills in missing local value
  if (profile?.home_borough && !localStorage.getItem('dig_in_home_borough')) {
    localStorage.setItem('dig_in_home_borough', profile.home_borough);
  }

  // Checkin state: remote fills in if local is empty
  if (profile?.checkin_state && !localStorage.getItem('dig_in_checkin')) {
    try {
      localStorage.setItem('dig_in_checkin', JSON.stringify(profile.checkin_state));
    } catch { /* quota */ }
  }

  // Badges: union by badge_id — never lose locally earned badges
  if (Array.isArray(badges) && badges.length) {
    const local   = JSON.parse(localStorage.getItem('dig_in_badges') || '[]');
    const localIds = new Set(local.map(b => b.id || b.badge_id));
    const newOnes = badges
      .filter(b => !localIds.has(b.badge_id))
      .map(b => ({ id: b.badge_id, label: b.label, icon: b.icon, earnedAt: b.earned_at }));
    if (newOnes.length) {
      try {
        localStorage.setItem('dig_in_badges', JSON.stringify([...local, ...newOnes]));
      } catch { /* quota */ }
    }
  }

  // Saved recipes: union by id/name
  if (Array.isArray(savedRecipes) && savedRecipes.length) {
    const local   = JSON.parse(localStorage.getItem('dig_in_saved') || '[]');
    const localKeys = new Set(local.map(r => r.id || r.name));
    const newOnes   = savedRecipes.filter(r => !localKeys.has(r.id || r.name));
    if (newOnes.length) {
      try {
        localStorage.setItem('dig_in_saved', JSON.stringify([...local, ...newOnes]));
      } catch { /* quota */ }
    }
  }
}

/* ── Push helpers (fire-and-forget) ──────────────────────────────────────── */

export async function pushProfile(fields = {}) {
  const body = { user_id: await getUserId(), ...fields };
  ff(`${API}/profile`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}

export async function pushBadge({ id, label, icon, earnedAt }) {
  ff(`${API}/badges`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ user_id: await getUserId(), badge_id: id, label, icon, earned_at: earnedAt || Date.now() }),
  });
}

export async function pushCheckin({ id, name, borough, coinsEarned }) {
  ff(`${API}/checkins`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      user_id:      await getUserId(),
      store_id:     String(id || name),
      store_name:   name         || '',
      borough:      borough      || '',
      coins_earned: coinsEarned  ?? 0,
    }),
  });
}

export async function pushSavedRecipe(recipe) {
  ff(`${API}/saved-recipes`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ user_id: await getUserId(), recipe }),
  });
}

export async function pushUnsavedRecipe(recipe) {
  const recipe_id = recipe?.id || recipe?.name;
  if (!recipe_id) return;
  ff(`${API}/saved-recipes`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ user_id: await getUserId(), recipe_id }),
  });
}

export function pushCheckinState(state) {
  pushProfile({ checkin_state: state });
}

/* ── analytics ─────────────────────────────────────────────────
   track() lives in ./analytics (PostHog, loaded lazily). It used to be
   duplicated here, which bundled PostHog into the very first page load. */
export { track } from './analytics';
