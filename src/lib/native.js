/**
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
 * `auth.storage` option expects, so it drops straight in (see src/lib/supabase.js).
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
