/* ════════════════════════════════════════════════════════════
   Merged module — originally three files in src/lib/:
     · native.js          (platform seam — device capabilities)
     · seo.js              (shared recipe-copy / SEO helpers)
     · authValidation.js   (username + password validation)
   ════════════════════════════════════════════════════════════ */

import { containsBannedWord } from '../social/bannedWords';

// Local copy of recipeRecommender's totalTimeOf: importing the recommender here
// pulled the region data, wellness and occasions engines into every page load.
function totalTimeOf(r) {
  return r.totalTime || r.total_time
    || ((r.prepTime || 0) + (r.cookTime || 0))
    || r.time || 0;
}

/* ── from native.js ────────────────────────────────────────────
 * Platform seam — the single place the web app talks to device capabilities.
 *
 * This repo ships as a **web app** and does NOT install `@capacitor/*`, so we
 * never import a plugin statically (Vite could not resolve a missing module and
 * the build would fail). Instead we look for the Capacitor runtime that the
 * native shell injects at `window.Capacitor` and use its registered plugins
 * when they exist, transparently falling back to browser APIs on the web.
 *
 * In the separate native repo, bundling the matching plugins registers them on
 * `window.Capacitor.Plugins`, and these helpers upgrade to native with no code
 * change here:
 *
 *   getCurrentPosition() → @capacitor/geolocation
 *   capturePhoto()       → @capacitor/camera
 *   (storage)            → check-in history stays on IndexedDB / localStorage
 *                          (works inside the native webview); swap to
 *                          @capacitor/preferences here if ever needed.
 *   (push)               → add a pushNotifications() helper here when wired.
 *
 * Keep all device-capability access flowing through this file so the native
 * migration is a change in ONE place, not scattered across the app.
 */

function capacitor() {
  return (typeof globalThis !== 'undefined' && globalThis.Capacitor) || null;
}

/** True only inside a Capacitor native shell (iOS/Android). */
export function isNativePlatform() {
  const c = capacitor();
  return !!(c && typeof c.isNativePlatform === 'function' && c.isNativePlatform());
}

/** A registered native plugin, or null on web (so callers fall back). */
function nativePlugin(name) {
  const c = capacitor();
  return (isNativePlatform() && c && c.Plugins && c.Plugins[name]) || null;
}

/* ── Geolocation → @capacitor/geolocation ─────────────────────────── */

/** Is location available at all (native plugin or browser)? */
export function hasGeolocation() {
  return !!nativePlugin('Geolocation')
    || (typeof navigator !== 'undefined' && !!navigator.geolocation);
}

/**
 * Get the current position once. Resolves to a normalized
 * `{ lat, lng, accuracy }`; rejects with the underlying error (the web error
 * keeps its `.code`, so callers can still distinguish "denied" vs "timeout").
 */
export async function getCurrentPosition(options = {}) {
  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 0 } = options;

  const Geolocation = nativePlugin('Geolocation');
  if (Geolocation) {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy, timeout, maximumAge });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
  }

  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      reject,
      { enableHighAccuracy, timeout, maximumAge },
    );
  });
}

/** Reverse-geocode {lat,lng} to a US ZIP via Nominatim (free, keyless — same
 * service CommuteRoute already uses for its own reverse lookups). Returns
 * null on any failure instead of throwing, since this is always used as an
 * optional "use my location" convenience with a manual field as fallback. */
export async function reverseGeocodeZip(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`, {
      headers: { Accept: 'application/json' },
    });
    const j = await r.json();
    return j?.address?.postcode || null;
  } catch {
    return null;
  }
}

/* ── Camera / photo → @capacitor/camera ───────────────────────────── */

/**
 * Capture or pick a photo. Resolves to a data-URL string, or `null` if the
 * user cancels. On native this opens the OS camera/gallery; on web it opens a
 * file picker. `source`: 'camera' | 'photos' | 'prompt' (default 'prompt').
 */
export async function capturePhoto({ source = 'prompt' } = {}) {
  const Camera = nativePlugin('Camera');
  if (Camera) {
    try {
      const src = source === 'camera' ? 'CAMERA' : source === 'photos' ? 'PHOTOS' : 'PROMPT';
      const photo = await Camera.getPhoto({ resultType: 'dataUrl', source: src, quality: 80 });
      return photo.dataUrl || null;
    } catch {
      return null; // user cancelled / denied
    }
  }
  return pickFileAsDataUrl();
}

/** Web fallback: open a file picker and read the chosen image as a data URL. */
function pickFileAsDataUrl() {
  return new Promise(resolve => {
    if (typeof document === 'undefined') { resolve(null); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result ?? null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

/* ── Secure storage → @capacitor/preferences (Keychain / EncryptedSharedPreferences) ──
 *
 * Sensitive tokens (e.g. the Supabase auth session) must NOT sit in the
 * WebView's localStorage on a device — it's readable on a jailbroken/rooted
 * phone and in backups. On native we route them through the Preferences plugin,
 * which stores in the OS-backed store (and can be swapped for a hardware-backed
 * Keychain / EncryptedSharedPreferences plugin behind this same interface). On
 * web we fall back to localStorage — unchanged from today.
 *
 * The shape (async getItem/setItem/removeItem) is exactly what Supabase's
 * `auth.storage` option expects, so it drops straight in (see
 * src/lib/platform/supabase.js).
 */
function preferencesPlugin() {
  const c = capacitor();
  return (isNativePlatform() && c && c.Plugins && c.Plugins.Preferences) || null;
}

export const secureStorage = {
  async getItem(key) {
    const Preferences = preferencesPlugin();
    if (Preferences) {
      const { value } = await Preferences.get({ key });
      return value ?? null;
    }
    try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; }
    catch { return null; }
  },
  async setItem(key, value) {
    const Preferences = preferencesPlugin();
    if (Preferences) { await Preferences.set({ key, value }); return; }
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); } catch {}
  },
  async removeItem(key) {
    const Preferences = preferencesPlugin();
    if (Preferences) { await Preferences.remove({ key }); return; }
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); } catch {}
  },
};

/* ── from seo.js ───────────────────────────────────────────────
   Shared recipe-copy helpers — used by the recipe grid, the slip-card modal,
   and anywhere else a short blurb needs to double as an SEO description. */

const SEO_MAX_LEN = 155; // standard meta-description budget before search engines truncate

/** Strips any trailing "(…)" from a recipe name so titles stay compact. */
export function cleanTitle(name) {
  return (name || '').replace(/\s*\([^)]*\)/g, '').trim() || (name || '');
}

/** Truncates at a word boundary (never mid-word) and marks the cut with an ellipsis. */
function truncateClean(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

/**
 * Each recipe's SEO-compliant blurb: the author's own description/notes when
 * present, otherwise one composed from region/difficulty/servings/time.
 * Either way this enforces the things a raw `description`/`notes` field
 * doesn't guarantee on its own:
 *   - length capped to ~155 chars (the window before search engines truncate
 *     a meta description), cut cleanly at a word boundary
 *   - stray HTML/markdown and repeated whitespace stripped
 *   - the dish name is always present, so near-identical authored blurbs
 *     ("A hearty weeknight dinner.") don't read as duplicate content
 *     across different recipes
 *   - ends with terminal punctuation
 */
export function seoDescription(recipe) {
  const name = cleanTitle(recipe?.name) || 'This dish';
  const region = recipe?._regionMeta?.label || recipe?.country || recipe?.cuisine || '';
  const diff = recipe?.difficulty ? String(recipe.difficulty).toLowerCase() : '';
  const t = totalTimeOf(recipe);

  const authored = (recipe?.seo || recipe?.description || recipe?.notes || '')
    .replace(/<[^>]+>/g, ' ')   // strip stray HTML/markdown tags
    .replace(/\s+/g, ' ')       // collapse newlines/repeated whitespace
    .trim();

  if (authored) {
    const withName = authored.toLowerCase().includes(name.toLowerCase())
      ? authored
      : `${name}: ${authored}`;
    const punctuated = /[.!?…]$/.test(withName) ? withName : `${withName}.`;
    return truncateClean(punctuated, SEO_MAX_LEN);
  }

  let lead = `${name} —`;
  if (diff && region) lead += ` a ${diff} ${region} dish`;
  else if (region)    lead += ` a dish from ${region}`;
  else if (diff)      lead += ` a ${diff} dish`;
  else                lead += ' a recipe worth trying';

  const tail = [];
  if (recipe?.servings) tail.push(`serves ${recipe.servings}`);
  if (t) tail.push(`ready in about ${t} min`);

  const full = tail.length ? `${lead}, ${tail.join(', ')}.` : `${lead}.`;
  return truncateClean(full, SEO_MAX_LEN);
}

/* ── from authValidation.js ────────────────────────────────────
 * Username + password validation for sign-up.
 *
 * Password policy (per product spec):
 *   • at least 9 characters
 *   • at least 1 letter
 *   • at least 1 number
 *   • at least 1 special from  ! @ # $ % ^ & *
 *   • no blocked language (profanity / slurs)
 *   • not weak/guessable, and not derived from the username
 *
 * Username policy:
 *   • 3–20 chars, letters/numbers/underscore
 *   • no blocked language (profanity / slurs)
 */

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const SPECIALS_RE = /[!@#$%^&*]/;

/** A small set of obviously-guessable passwords to reject outright. */
const COMMON_PASSWORDS = new Set([
  'password1!', 'password123', 'qwerty123!', 'letmein123', 'welcome123',
  'admin1234!', 'iloveyou1!', 'password!1', 'abc123456', 'passw0rd!',
]);

/** Returns an error string, or null if the username is valid. */
export function validateUsername(name) {
  const v = (name || '').trim();
  if (!v) return 'Username is required.';
  if (!USERNAME_RE.test(v)) return 'Use 3–20 letters, numbers, or underscores.';
  if (containsBannedWord(v)) return 'That username contains blocked language.';
  return null;
}

function isSequential(s) {
  if (s.length < 4) return false;
  let asc = true, desc = true;
  for (let i = 1; i < s.length; i++) {
    const d = s.charCodeAt(i) - s.charCodeAt(i - 1);
    if (d !== 1) asc = false;
    if (d !== -1) desc = false;
  }
  return asc || desc;
}

/** True if the password is low-entropy / predictable even when it meets the rules. */
function isWeakPassword(pw) {
  const low = pw.toLowerCase();
  if (COMMON_PASSWORDS.has(low)) return true;
  if (new Set(pw).size < 5) return true;          // too few distinct characters
  if (/(.)\1\1/.test(pw)) return true;            // 3+ of the same char in a row
  if (isSequential(low.replace(/[^a-z0-9]/g, ''))) return true; // 1234 / abcd runs
  return false;
}

/**
 * Per-rule booleans, for a live checklist in the UI.
 * `username` is optional; when given, we also verify the password isn't just the name.
 */
export function getPasswordChecks(pw, { username } = {}) {
  const p = pw || '';
  const name = (username || '').trim().toLowerCase();
  return {
    length:  p.length >= 9,
    letter:  /[A-Za-z]/.test(p),
    number:  /[0-9]/.test(p),
    special: SPECIALS_RE.test(p),
    clean:   p.length > 0 && !containsBannedWord(p),
    strong:  p.length > 0 && !isWeakPassword(p),
    noName:  !name || (p.length > 0 && !p.toLowerCase().includes(name)),
  };
}

/** Returns an error string, or null if the password satisfies every rule. */
export function validatePassword(pw, opts = {}) {
  const c = getPasswordChecks(pw, opts);
  if (!c.length)  return 'Password must be at least 9 characters.';
  if (!c.letter)  return 'Add at least one letter.';
  if (!c.number)  return 'Add at least one number.';
  if (!c.special) return 'Add one special character (!@#$%^&*).';
  if (!c.clean)   return 'Password contains blocked language.';
  if (!c.noName)  return 'Password can’t contain your username.';
  if (!c.strong)  return 'That password is too common or predictable — mix it up.';
  return null;
}

export const PASSWORD_RULES = [
  { key: 'length',  label: 'At least 9 characters' },
  { key: 'letter',  label: 'A letter' },
  { key: 'number',  label: 'A number' },
  { key: 'special', label: 'A special character (!@#$%^&*)' },
  { key: 'strong',  label: 'Not common or predictable' },
];
