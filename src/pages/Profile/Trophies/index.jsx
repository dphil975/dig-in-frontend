import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { getPixelCards } from '../../../services/photoMissionEngine';
import { getMemories } from '../../../lib/memoryVault';
import { loadPassport } from '../../../lib/foodPassport';
import { getWins } from '../../../lib/happinessEngine';
import NovaSprite from '../../../components/nova/NovaSprite';
import ProfilePane from '../ProfilePane';
import Badges from '../Badges';
import FoodPassport from '../FoodPassport';
import MemoryVault from '../MemoryVault';
import YourRead from '../YourRead';

/* Profile → Trophies — everything you've earned, in one place:
   Trophies (the wins that used to sit in Nova's Trophy Case), Badges, the City
   Food Passport, Keepsakes (Nova's Memory Vault), the Pixel Photo Diary and your
   store check-ins. Each old address (/badges, /passport, /memories, /your-read)
   still opens its full page, under this tab, from the pill row. (Saved recipes
   are the Collection tab.) */

const VIEWS = [
  { id: 'overview', label: 'Overview',  to: '/trophies' },
  { id: 'badges',   label: 'Badges',    to: '/badges' },
  { id: 'passport', label: 'Passport',  to: '/passport' },
  { id: 'keepsakes', label: 'Keepsakes', to: '/memories' },
  { id: 'read',     label: 'Your Read', to: '/your-read' },
];
const VIEW_BY_PATH = { '/badges': 'badges', '/passport': 'passport', '/memories': 'keepsakes', '/your-read': 'read' };

const ALL_BADGES = [
  { id:'first-checkin', label:'First Check-In', icon:'1ST', hint:'Check in to your first store' },
  { id:'explorer',      label:'Explorer',       icon:'EXP', hint:'Visit 3 unique stores' },
  { id:'city-crawler',  label:'City Crawler',   icon:'PRO', hint:'Visit 10 unique stores' },
];

function Overview() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [wins, setWins] = useState([]);
  const [pixelCards, setPixelCards] = useState([]);
  const [stampCount, setStampCount] = useState(0);
  const [memories, setMemories] = useState([]);
  const [storeStats, setStoreStats] = useState({ total: 0, unique: 0 });

  useEffect(() => {
    try { setBadges(JSON.parse(localStorage.getItem('dig_in_badges') || '[]')); } catch { /* ignore */ }
    setWins(getWins());
    setPixelCards(getPixelCards());
    setStampCount((loadPassport().stamps || []).length);
    setMemories(getMemories());
    try {
      const checkins = JSON.parse(localStorage.getItem('dig_in_checkins') || '{}');
      setStoreStats({
        total: Object.values(checkins).reduce((sum, n) => sum + n, 0),
        unique: Object.keys(checkins).length,
      });
    } catch { /* ignore */ }
  }, []);

  const badgeIds = badges.map(b => b.id);
  const lockedList = ALL_BADGES.filter(b => !badgeIds.includes(b.id));
  const latest = memories[0];

  return (
    <ProfilePane>
      {/* Trophies — merged in from Nova's old Trophy Case */}
      <section className="profile-section">
        <h3 className="section-title">TROPHIES</h3>
        {wins.length ? (
          <ul className="pcol-wins">
            {wins.slice(0, 12).map(w => (
              <li key={w.id}><Trophy size={14} /> <span>{w.title}</span></li>
            ))}
          </ul>
        ) : (
          <p className="profile-hint">Your wins land here — every one a record you can scroll when you doubt yourself.</p>
        )}
      </section>

      {/* Badges */}
      <section className="profile-section">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <h3 className="section-title" style={{ margin:0 }}>BADGES</h3>
          <button
            onClick={() => navigate('/badges')}
            style={{ fontFamily:"'Press Start 2P',monospace", fontSize:9, padding:'10px 13px', borderRadius:8,
                     border:'2px solid #33302A', background:'#6E8259', color:'#33302A', cursor:'pointer',
                     boxShadow:'2px 2px 0 rgba(0,0,0,.3)' }}
          >
            VIEW ALL BADGES →
          </button>
        </div>
        <div className="badge-grid">
          {badges.length
            ? badges.map(b => (
                <div key={b.id} className="badge-card earned">
                  <span className="badge-card-icon">{b.icon}</span>
                  <span className="badge-card-label">{b.label}</span>
                </div>
              ))
            : <p className="profile-hint">No badges yet — start checking in!</p>}
        </div>
        <div className="badge-locked-grid">
          {lockedList.map(b => (
            <div key={b.id} className="badge-card locked">
              <span className="badge-card-icon">{b.icon}</span>
              <span className="badge-card-label">{b.label}</span>
              <span className="badge-card-hint">{b.hint}</span>
            </div>
          ))}
        </div>
      </section>

      {/* City Food Passport — a real stamp per region you've actually been in
          (device location or ZIP), never a fabricated visit. */}
      <section className="profile-section">
        <h3 className="section-title">CITY FOOD PASSPORT</h3>
        <button
          onClick={() => navigate('/passport')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, width: '100%',
            textAlign: 'left', cursor: 'pointer',
            background: 'linear-gradient(135deg, #fff8e6, #f7f1e3)',
            border: '1px solid rgba(45,27,19,.25)', borderRadius: 14, padding: 14,
          }}
        >
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: '#6E8259', fontSize: 18,
          }}>
            🛂
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 800, color: '#33302A', marginBottom: 4 }}>
              {stampCount} region{stampCount === 1 ? '' : 's'} stamped
            </span>
            <span style={{ display: 'block', fontSize: 13, color: '#7a6a58' }}>
              New city, new stamp — signature dishes, real local stores, and what you've cooked from there.
            </span>
          </span>
          <span style={{ color: '#6E8259', fontWeight: 700 }}>→</span>
        </button>
      </section>

      {/* Keepsakes — Nova's Memory Vault */}
      <section className="profile-section">
        <h3 className="section-title">KEEPSAKES</h3>
        <button
          onClick={() => navigate('/memories')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, width: '100%',
            textAlign: 'left', cursor: 'pointer',
            background: 'linear-gradient(135deg, #fff4f8, #f6f5fc)',
            border: '1px solid rgba(232,106,160,.35)', borderRadius: 14, padding: 14,
          }}
        >
          <NovaSprite look="pink" h={42} title="Nova" />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 800, color: '#33302A', marginBottom: 4 }}>
              {memories.length ? `${memories.length} keepsake${memories.length !== 1 ? 's' : ''} saved` : 'Start your Memory Vault'}
            </span>
            <span style={{ display: 'block', fontSize: 13, color: '#7a6a58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {latest ? latest.text : 'Cook a dish — Nova saves the moment here.'}
            </span>
          </span>
          <span style={{ color: '#96B36B', fontWeight: 700 }}>♥ →</span>
        </button>
      </section>

      {/* Store check-ins */}
      <section className="profile-section">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <h3 className="section-title" style={{ margin:0 }}>STORE CHECK-INS</h3>
          <button type="button" className="borough-btn" onClick={() => navigate('/checkin')}>Check in at a store →</button>
        </div>
        <p className="profile-hint">
          {storeStats.total} check-in{storeStats.total === 1 ? '' : 's'} across {storeStats.unique} store{storeStats.unique === 1 ? '' : 's'}.
        </p>
      </section>

      {/* Pixel Photo Diary */}
      <section className="profile-section">
        <h3 className="section-title">PIXEL PHOTO DIARY</h3>
        <p className="profile-hint">
          Complete store photo missions to earn pixel collectibles. Each one is saved here as a diary entry.
        </p>
        {pixelCards.length === 0 ? (
          <p className="profile-hint" style={{ marginTop: 8 }}>
            No photos yet — open any store on the map and complete a Photo Mission!
          </p>
        ) : (
          <div className="pixel-diary-grid">
            {pixelCards.map(card => {
              const d = new Date(card.date);
              const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div key={card.id} className="pixel-diary-card">
                  {card.pixelDataUrl ? (
                    <img src={card.pixelDataUrl} alt={card.missionLabel} className="pixel-diary-img" />
                  ) : (
                    <div className="pixel-diary-img pixel-diary-img-placeholder">
                      {card.missionEmoji || 'PHOTO'}
                    </div>
                  )}
                  <div className="pixel-diary-info">
                    <div className="pixel-diary-emoji-label">{card.missionLabel}</div>
                    <div className="pixel-diary-store">{card.storeName}</div>
                    <div className="pixel-diary-meta">
                      <span className="pixel-diary-date">{dateStr}</span>
                      <span className="pixel-diary-coins">+{card.coins}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </ProfilePane>
  );
}

export default function Trophies({ path }) {
  const navigate = useNavigate();
  const view = VIEW_BY_PATH[path] || 'overview';

  return (
    <>
      <nav className="psub" aria-label="Trophies">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`psub-pill${view === v.id ? ' active' : ''}`}
            onClick={() => { if (view !== v.id) navigate(v.to, { replace: true }); }}
          >
            {v.label}
          </button>
        ))}
      </nav>
      {view === 'overview' && <Overview />}
      {view === 'badges' && <Badges />}
      {view === 'passport' && <FoodPassport />}
      {view === 'keepsakes' && <MemoryVault />}
      {view === 'read' && <YourRead embedded />}
    </>
  );
}
