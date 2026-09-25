import { getCurrentPosition, hasGeolocation } from './native';
import { haversineKm } from './commutePlanner';

const CHECKIN_RADIUS_M = 150;
const MAX_ACCURACY_M = 300; // a fix this noisy can't reliably confirm "at the store"

/**
 * Require a real GPS fix within CHECKIN_RADIUS_M of the store. No silent
 * fallback — if location can't be confirmed, the check-in is rejected with a
 * specific reason instead of being awarded anyway.
 */
export async function verifyCheckinLocation(storeLat, storeLng) {
  if (typeof storeLat !== 'number' || typeof storeLng !== 'number') {
    return { ok: false, reason: 'no-store-coords' };
  }
  if (!hasGeolocation()) {
    return { ok: false, reason: 'no-geo' };
  }
  let pos;
  try {
    pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  } catch (err) {
    return { ok: false, reason: err?.code === 1 ? 'denied' : 'timeout' };
  }
  if (pos.accuracy != null && pos.accuracy > MAX_ACCURACY_M) {
    return { ok: false, reason: 'low-accuracy', accuracy: Math.round(pos.accuracy) };
  }
  const distKm = haversineKm(pos.lat, pos.lng, storeLat, storeLng);
  const distM = distKm * 1000;
  if (distM > CHECKIN_RADIUS_M) {
    return { ok: false, reason: 'too-far', distM: Math.round(distM) };
  }
  return { ok: true, distM: Math.round(distM) };
}

export function checkinRejectionMessage(result, storeName) {
  switch (result?.reason) {
    case 'too-far': return `You need to be at ${storeName} to check in (you're ${result.distM}m away).`;
    case 'low-accuracy': return `GPS signal too weak to confirm you're there (accuracy ${result.accuracy}m) — step outside or try again.`;
    case 'denied': return 'Location access is required to check in — enable it in your browser/device settings.';
    case 'no-geo': return "This device/browser doesn't support location, so check-in can't be verified here.";
    case 'timeout': return 'Location timed out — move to an open area and try again.';
    case 'no-store-coords': return "This store doesn't have map coordinates on file, so check-in can't be verified.";
    default: return "Couldn't verify your location — try again.";
  }
}
