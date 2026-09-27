import { useState } from 'react';

/* Settings → Location — where you cook. The home borough earns bonus coins for
   exploring other neighborhoods; the ZIP code drives local stores, weather and
   the "near you" parts of the feed. Both live in localStorage, same keys the
   rest of the app already reads. */

const BOROUGH_LABELS = {
  'manhattan':    'Manhattan',
  'brooklyn':     'Brooklyn',
  'queens':       'Queens',
  'bronx':        'The Bronx',
  'staten-island':'Staten Island',
};

function read(key) { try { return localStorage.getItem(key) || ''; } catch { return ''; } }

export default function Location() {
  const [borough, setBorough] = useState(() => read('dig_in_home_borough'));
  const [zip, setZip] = useState(() => read('dig_in_zip'));
  const [zipMsg, setZipMsg] = useState('');

  function selectBorough(val) {
    try { localStorage.setItem('dig_in_home_borough', val); } catch { /* quota */ }
    setBorough(val);
  }

  function saveZip(e) {
    e.preventDefault();
    const z = zip.trim();
    if (!/^\d{5}$/.test(z)) { setZipMsg('Enter a 5-digit ZIP code.'); return; }
    try { localStorage.setItem('dig_in_zip', z); } catch { /* quota */ }
    setZipMsg('Saved.');
  }

  function clearZip() {
    try { localStorage.removeItem('dig_in_zip'); } catch { /* ignore */ }
    setZip('');
    setZipMsg('Cleared.');
  }

  return (
    <div className="app-container">
      <div className="profile-page">
        <section className="profile-section">
          <h3 className="section-title">HOME BOROUGH</h3>
          <p className="profile-hint">Set your home borough to earn bonus coins when you explore other neighborhoods.</p>
          <div className="borough-picker">
            {Object.entries(BOROUGH_LABELS).map(([val, label]) => (
              <button
                key={val}
                className={`borough-btn${borough === val ? ' active' : ''}`}
                data-borough={val}
                onClick={() => selectBorough(val)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="borough-current">
            {borough
              ? `Currently set to: ${BOROUGH_LABELS[borough] || borough}`
              : 'Not set yet — pick yours above.'}
          </p>
        </section>

        <section className="profile-section">
          <h3 className="section-title">ZIP CODE</h3>
          <p className="profile-hint">Used for local stores, the weather, and what's in season near you. Stays on this device.</p>
          <form className="pset-zip" onSubmit={saveZip}>
            <input
              className="pset-input"
              inputMode="numeric"
              maxLength={5}
              placeholder="10001"
              value={zip}
              onChange={(e) => { setZip(e.target.value.replace(/\D/g, '')); setZipMsg(''); }}
              aria-label="ZIP code"
            />
            <button type="submit" className="borough-btn active">Save</button>
            {read('dig_in_zip') && <button type="button" className="borough-btn" onClick={clearZip}>Clear</button>}
          </form>
          {zipMsg && <p className="borough-current">{zipMsg}</p>}
        </section>
      </div>
    </div>
  );
}
