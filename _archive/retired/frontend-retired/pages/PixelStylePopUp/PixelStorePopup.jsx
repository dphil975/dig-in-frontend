import { useState } from 'react';
import { Navigation, Phone, Globe, ExternalLink, MapPin, Clock } from 'lucide-react';
import { getCurrentPosition, hasGeolocation } from '../../lib/native';
import './PixelStorePopup.css';

/* ── GPS check-in ─────────────────────────────────────────────── */
const CHECKIN_RADIUS_KM    = 0.32;   // ~0.2 mi
const CHECKIN_MAX_ACCURACY = 250;    // metres

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function verifyCheckin(storeLat, storeLng) {
  return new Promise(resolve => {
    if (typeof storeLat !== 'number' || typeof storeLng !== 'number')
      return resolve({ ok: false, reason: 'no-store-coords' });
    if (!hasGeolocation())
      return resolve({ ok: false, reason: 'no-geo' });

    getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 })
      .then(({ lat: latitude, lng: longitude, accuracy }) => {
        if (accuracy > CHECKIN_MAX_ACCURACY)
          return resolve({ ok: false, reason: 'low-accuracy', accuracy: Math.round(accuracy) });
        const distKm = haversineKm(latitude, longitude, storeLat, storeLng);
        if (distKm > CHECKIN_RADIUS_KM)
          return resolve({ ok: false, reason: 'too-far', distM: Math.round(distKm * 1000) });
        resolve({ ok: true });
      })
      .catch(err => resolve({ ok: false, reason: err?.code === 1 ? 'denied' : 'timeout' }));
  });
}

const CK_ERRORS = {
  'too-far':         e => [`Not at the store yet`,       `Must be within 0.2 mi (${e?.distM ?? '?'}m away)`],
  'low-accuracy':    e => [`GPS signal too weak`,         `Accuracy ${e?.accuracy}m — step outside or disable VPN`],
  'denied':          ()  => [`Location access required`,  `Enable location in browser settings`],
  'no-store-coords': ()  => [`Store location missing`,    `Tap directions and check in on arrival`],
  'no-geo':          ()  => [`GPS not supported`,         `Your browser doesn't support location`],
  'timeout':         ()  => [`Location timed out`,        `Move to an open area and try again`],
};

/* ── Store type config ────────────────────────────────────────── */
const TYPE_CONFIG = {
  grocery:      { label: 'Grocery',      color: '#96B36B' },   // matcha green
  corner_store: { label: 'Corner Store', color: '#E0A32E' },   // warm amber
  bodega:       { label: 'Bodega',       color: '#FF6D8B' },   // pink
  specialty:    { label: 'Specialty',    color: '#E0A32E' },   // crimson
  supermarket:  { label: 'Supermarket',  color: '#96B36B' },   // matcha green
};

/* ── Star rating ──────────────────────────────────────────────── */
function StarRating({ rating }) {
  if (!rating) return null;
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.25 && rating - full < 0.75;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="psp-stars">
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}
      <span className="psp-rating-num">{Number(rating).toFixed(1)}</span>
    </span>
  );
}

/* ── Main component ───────────────────────────────────────────── */
export function PixelStorePopup({ store, onClose, onCheckin, visitCount = 0 }) {
  const [ckState,    setCkState]    = useState('idle');   // idle | verifying | done | error
  const [ckError,    setCkError]    = useState(null);
  const [localCount, setLocalCount] = useState(visitCount);
  const [showShare,  setShowShare]  = useState(false);

  if (!store) return null;

  const cfg    = TYPE_CONFIG[store.type] || TYPE_CONFIG.grocery;
  const deal   = store.products?.[0] ?? null;
  const mapsDir    = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
  const mapsSearch = `https://maps.google.com/?q=${encodeURIComponent(`${store.name || ''} ${store.address || ''}`)}`;
  const websiteHost = store.website
    ? (() => { try { return new URL(store.website).hostname.replace('www.', ''); } catch { return store.website; } })()
    : null;

  // Distance from saved user location
  let distLabel = null;
  try {
    const saved = JSON.parse(localStorage.getItem('userLocation') || 'null');
    if (saved?.lat && store.lat && store.lng) {
      const km = haversineKm(saved.lat, saved.lng, store.lat, store.lng);
      distLabel = km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
    }
  } catch {}

  /* ── Check-in handler ─────────────────────────────────────── */
  async function handleCheckinClick() {
    setCkState('verifying');
    setCkError(null);
    const result = await verifyCheckin(store.lat, store.lng);
    if (!result.ok) {
      setCkState('error');
      setCkError(result);
      setTimeout(() => setCkState('idle'), 7000);
      return;
    }
    onCheckin?.();
    setLocalCount(c => c + 1);
    setCkState('done');
    setShowShare(true);
  }

  const [errTitle, errSub] = ckError
    ? (CK_ERRORS[ckError.reason]?.(ckError) || ['Check-in failed', 'Try again'])
    : ['', ''];

  return (
    <div className="psp-wrap">

      {/* ── Close ── */}
      {onClose && (
        <button className="psp-close" onClick={onClose} aria-label="Close">✕</button>
      )}

      {/* ── Header — type + name + address ── */}
      <div className="psp-header" style={{ background: cfg.color }}>
        <div className="psp-header-top-row">
          <span className="psp-type-tag">{cfg.label}</span>
          {store.isOpen != null && (
            <span className={`psp-open-pill${store.isOpen ? ' psp-open' : ' psp-closed'}`}>
              {store.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
          )}
        </div>

        <div className="psp-store-name">{store.name || 'Unknown Store'}</div>

        {store.address && (
          <div className="psp-store-addr">
            <MapPin size={11} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 1 }} />
            {store.address}
          </div>
        )}

        <div className="psp-header-meta">
          {store.neighborhood && <span className="psp-neighborhood">{store.neighborhood}</span>}
          {store.rating > 0 && <StarRating rating={store.rating} />}
        </div>
      </div>

      {/* ── Hours + distance ── */}
      {(distLabel || store.hours) && (
        <div className="psp-meta-row">
          {distLabel && (
            <span className="psp-dist">
              <MapPin size={11} strokeWidth={2.5} /> {distLabel}
            </span>
          )}
          {store.hours && (
            <span className="psp-hours">
              <Clock size={11} strokeWidth={2.5} /> {store.hours}
            </span>
          )}
        </div>
      )}

      {/* ── Live deal banner ── */}
      {deal && (
        <div className="psp-deal-banner">
          {deal.icon && <span className="psp-deal-icon">{deal.icon}</span>}
          <div className="psp-deal-body">
            <div className="psp-deal-flag">DEAL TODAY</div>
            <div className="psp-deal-title">{deal.title}</div>
            {deal.description && <div className="psp-deal-desc">{deal.description}</div>}
          </div>
          {deal.price && <span className="psp-deal-badge">{deal.price}</span>}
        </div>
      )}

      {/* ── Chain-level deal hint (no specific deal, but chain is known for deals) ── */}
      {store.hasDeal && !deal && (
        <div className="psp-deal-hint">
          <span className="psp-deal-hint-icon">$</span>
          <span>
            Deals available at this chain —{' '}
            <a href="/explore?tab=deals" className="psp-deal-link">see current offers</a>
          </span>
        </div>
      )}

      {/* ── Contact ── */}
      {(store.phone || websiteHost) && (
        <div className="psp-contact-section">
          {store.phone && (
            <a className="psp-contact-row" href={`tel:${store.phone}`}>
              <Phone size={13} strokeWidth={2.5} />
              <span>{store.phone}</span>
            </a>
          )}
          {websiteHost && (
            <a
              className="psp-contact-row psp-website-row"
              href={store.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe size={13} strokeWidth={2.5} />
              <span>{websiteHost}</span>
              <ExternalLink size={11} strokeWidth={2.5} className="psp-ext-icon" />
            </a>
          )}
        </div>
      )}

      {/* ── Check-in ── */}
      <div className="psp-checkin-section">
        <div className="psp-visits-row">
          <span className="psp-visits-label">
            {localCount > 0 ? `${localCount} visit${localCount !== 1 ? 's' : ''}` : 'No visits yet'}
          </span>
          {store.checkin_count > 0 && (
            <span className="psp-community-visits">{store.checkin_count} community check-ins</span>
          )}
        </div>

        <div className="psp-checkin-row">
          {ckState === 'idle' && (
            <button className="psp-ck-btn" onClick={handleCheckinClick}>
              Check In
            </button>
          )}
          {ckState === 'verifying' && (
            <button className="psp-ck-btn psp-ck-verifying" disabled>Verifying…</button>
          )}
          {ckState === 'done' && (
            <button className="psp-ck-btn psp-ck-done" disabled>✓ Checked In</button>
          )}
          {ckState === 'error' && (
            <button className="psp-ck-btn psp-ck-err" onClick={handleCheckinClick}>Retry</button>
          )}

          <button
            className="psp-map-btn"
            onClick={() => window.open(mapsSearch, '_blank', 'noopener')}
          >
            Map
          </button>

          {showShare && (
            <button
              className="psp-share-btn"
              onClick={() =>
                navigator.share?.({
                  title: `Visited ${store.name}!`,
                  text: `Checked in at ${store.name} on Dig In`,
                }).catch(() => {})
              }
            >
              Share
            </button>
          )}
        </div>

        {ckState === 'error' && ckError && (
          <div className="psp-ck-error">
            <strong>{errTitle}</strong>
            <span>{errSub}</span>
          </div>
        )}
      </div>

      {/* ── Get Directions ── */}
      <button
        className="psp-directions-btn"
        onClick={() => window.open(mapsDir, '_blank', 'noopener')}
      >
        <Navigation size={14} strokeWidth={3} />
        GET DIRECTIONS
      </button>

    </div>
  );
}

export default PixelStorePopup;
