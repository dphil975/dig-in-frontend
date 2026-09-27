import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import {
  detectRegionFromDevice, detectRegionFromZip, regionMeta, loadPassport,
  stampRegion, dishesCookedFromRegion, localSpotsForRegion,
} from '../../../lib/foodPassport';
import { cityFoodDataFor } from '../../../data/cityFoodData';
import { partnersForRegion } from '../../../data/travelPartners';
import './FoodPassport.css';

/* City Food Passport — travel to a new region, unlock a real stamp. Region
   detection chains the app's existing geolocation + ZIP lookups (never a new
   location pipeline); signature dishes are real curated content
   (cityFoodData.js); "local spots" are real stores from that region's actual
   store file; "what you've cooked from here" is your own real cook history.
   Travel-partner perks are an honestly empty slot (travelPartners.js) — no
   fabricated brand or referral code ships with this. */

function StampCard({ regionId, onOpen }) {
  const meta = regionMeta(regionId);
  const data = cityFoodDataFor(regionId);
  return (
    <button type="button" className="fp-stamp" onClick={() => onOpen(regionId)}>
      <span className="fp-stamp-emoji">{data?.emoji || '📍'}</span>
      <span className="fp-stamp-label">{meta?.label || regionId}</span>
    </button>
  );
}

function RegionDetail({ regionId, onClose }) {
  const meta = regionMeta(regionId);
  const data = cityFoodDataFor(regionId);
  const navigate = useNavigate();
  const [spots, setSpots] = useState(null);
  const cooked = useMemo(() => dishesCookedFromRegion(regionId), [regionId]);
  const partners = useMemo(() => partnersForRegion(regionId), [regionId]);

  useEffect(() => {
    let alive = true;
    localSpotsForRegion(regionId).then(list => { if (alive) setSpots(list); });
    return () => { alive = false; };
  }, [regionId]);

  return (
    <div className="fp-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fp-detail" role="dialog" aria-label={`${meta?.label || regionId} passport stamp`}>
        <button className="fp-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="fp-detail-head">
          <span className="fp-detail-emoji">{data?.emoji || '📍'}</span>
          <h2 className="fp-detail-title">{meta?.label || regionId}</h2>
        </div>

        {!data ? (
          <p className="fp-hint">
            You've been stamped here, but Nova hasn't written this region's food story yet —
            check back soon.
          </p>
        ) : (
          <>
            <section className="fp-section">
              <h3 className="fp-section-title">Known For</h3>
              <div className="fp-dish-chips">
                {data.signatureDishes.map((d, i) => <span key={i} className="fp-dish-chip">{d}</span>)}
              </div>
            </section>

            <section className="fp-section">
              <h3 className="fp-section-title">Local Spots to Try</h3>
              {spots === null ? (
                <p className="fp-hint">Loading real stores near this region…</p>
              ) : spots.length === 0 ? (
                <p className="fp-hint">No stores of this type are in our data for this region yet.</p>
              ) : (
                <ul className="fp-spot-list">
                  {spots.map((s, i) => (
                    <li key={i} className="fp-spot">
                      <span className="fp-spot-name">{s.name}</span>
                      <span className="fp-spot-meta">{s.type}{s.neighborhood ? ` · ${s.neighborhood}` : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="fp-mini-btn" onClick={() => navigate('/')}>
                Open the Food Map →
              </button>
            </section>

            <section className="fp-section">
              <h3 className="fp-section-title">What You've Cooked From Here</h3>
              {cooked.length === 0 ? (
                <p className="fp-hint">
                  Nothing yet — you haven't cooked a {data.cuisineTags[0]} dish since arriving.
                </p>
              ) : (
                <ul className="fp-cooked-list">
                  {cooked.slice(0, 5).map((r, i) => <li key={i}>{r.name}</li>)}
                </ul>
              )}
              <button type="button" className="fp-mini-btn" onClick={() => navigate('/recipes')}>
                Find a recipe like this →
              </button>
            </section>

            <section className="fp-section">
              <h3 className="fp-section-title">Travel Partner Perks</h3>
              {partners.length === 0 ? (
                <p className="fp-hint fp-partner-hint">
                  No partner offers here yet — this is where a travel or credit-card
                  partnership would show a real perk for this region.
                </p>
              ) : (
                <ul className="fp-partner-list">
                  {partners.map(p => (
                    <li key={p.id}>
                      <a href={p.url} target="_blank" rel="noreferrer">{p.name}</a> — {p.blurb}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function FoodPassport() {
  const [passport, setPassport] = useState(() => loadPassport());
  const [zipInput, setZipInput] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [status, setStatus] = useState('');
  const [openRegion, setOpenRegion] = useState(null);
  const [justStamped, setJustStamped] = useState(null);

  function applyDetected(regionId) {
    if (!regionId) {
      setStatus("Couldn't place that — try a ZIP code instead.");
      return;
    }
    const result = stampRegion(regionId);
    setPassport(loadPassport());
    if (result.isNew) {
      setJustStamped(regionId);
      setStatus('');
    } else {
      setStatus(`Already stamped — you've been to ${regionMeta(regionId)?.label || regionId} before.`);
    }
  }

  async function useMyLocation() {
    setDetecting(true);
    setStatus('');
    const regionId = await detectRegionFromDevice();
    setDetecting(false);
    applyDetected(regionId);
  }

  function submitZip(e) {
    e.preventDefault();
    applyDetected(detectRegionFromZip(zipInput));
  }

  const stamps = passport.stamps || [];

  return (
    <div className="fp-page">
      <Nav />
      <div className="fp-wrap">
        <header className="fp-head">
          <p className="fp-eyebrow">🛂 CITY FOOD PASSPORT</p>
          <h1 className="fp-title">Every place you eat from, stamped.</h1>
          <p className="fp-sub">
            New region, new stamp — signature dishes, real local stores, and what you've
            actually cooked from there.
          </p>
        </header>

        <div className="fp-detect">
          <button type="button" className="fp-detect-btn" onClick={useMyLocation} disabled={detecting}>
            {detecting ? 'Finding you…' : '📍 Use my location'}
          </button>
          <form className="fp-zip-form" onSubmit={submitZip}>
            <input
              className="fp-zip-input"
              placeholder="or enter a ZIP code"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              maxLength={5}
              inputMode="numeric"
            />
            <button type="submit" className="fp-mini-btn">Stamp it</button>
          </form>
        </div>
        {status && <p className="fp-status">{status}</p>}
        {justStamped && (
          <div className="fp-just-stamped">
            <span>{cityFoodDataFor(justStamped)?.emoji || '📍'}</span>
            <span>New stamp: <strong>{regionMeta(justStamped)?.label}</strong> — +40 coins</span>
            <button type="button" className="fp-mini-btn" onClick={() => { setOpenRegion(justStamped); setJustStamped(null); }}>
              See it →
            </button>
          </div>
        )}

        <h2 className="fp-book-title">Your Passport ({stamps.length})</h2>
        {stamps.length === 0 ? (
          <p className="fp-hint">No stamps yet — use your location or enter a ZIP above to get your first one.</p>
        ) : (
          <div className="fp-book-grid">
            {stamps.map(s => (
              <StampCard key={s.regionId} regionId={s.regionId} onOpen={setOpenRegion} />
            ))}
          </div>
        )}
      </div>

      {openRegion && <RegionDetail regionId={openRegion} onClose={() => setOpenRegion(null)} />}
    </div>
  );
}
