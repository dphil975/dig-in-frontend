import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPixelCards } from '../../../services/photoMissionEngine';
import { getBoards, getBoardRecipes } from '../../../services/boardsService';
import { getSavedRecipes } from '../../../services/saveService';
import Nav from '../../../components/shell/Nav';
import CookedRecipes from '../../../components/you/CookedRecipes';
import CookJournal from '../../../components/you/CookJournal';
import FlavorQuizModal from '../../../components/you/FlavorQuizModal';
import { isSwipeLearningEnabled, setSwipeLearningEnabled } from '../../../lib/flavorProfile';
import NovaSprite from '../../../components/nova/NovaSprite';
import SkinPicker from '../../../components/you/SkinPicker';
import { getMemories } from '../../../lib/memoryVault';
import { loadPassport } from '../../../lib/foodPassport';
import { moodInsight } from '../../../lib/moodColor';
import { useAuth } from '../../../hooks/useAuth';
import Allergies from '../Health/Allergies';
import Wellness from '../Health/Wellness';
import NovaNudgeSettings from '../../../components/nova/NovaNudgeSettings';
import { LIFE_MODES, activeLifeMode, setLifeMode, clearLifeMode } from '../../../lib/feedContext';

const BOROUGH_LABELS = {
  'manhattan':    'Manhattan',
  'brooklyn':     'Brooklyn',
  'queens':       'Queens',
  'bronx':        'The Bronx',
  'staten-island':'Staten Island',
};

const ALL_BADGES = [
  { id:'first-checkin', label:'First Check-In', icon:'1ST', hint:'Check in to your first store' },
  { id:'explorer',      label:'Explorer',       icon:'EXP', hint:'Visit 3 unique stores' },
  { id:'city-crawler',  label:'City Crawler',   icon:'PRO', hint:'Visit 10 unique stores' },
];

function getQuests() {
  const today  = new Date().toISOString().slice(0, 10);
  const stored = JSON.parse(localStorage.getItem('dig_in_quests') || 'null');
  if (!stored || stored.date !== today) {
    return {
      date: today,
      tasks: {
        'visit-store':     { label:'Visit 1 store today',              reward:75,  progress:0, goal:1, completed:false },
        'explore-borough': { label:'Explore outside your home borough', reward:100, progress:0, goal:1, completed:false },
      }
    };
  }
  return stored;
}

export default function Profile() {
  const [coins, setCoins]             = useState(0);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [uniqueStores, setUniqueStores]   = useState(0);
  const [badges, setBadges]           = useState([]);
  const [dishesMade, setDishesMade]   = useState(0);
  const [homeBorough, setHomeBorough] = useState('');
  const [quests, setQuests]           = useState(null);
  const [pixelCards, setPixelCards]   = useState([]);
  const [boards, setBoards]           = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [showFlavorQuiz, setShowFlavorQuiz] = useState(false);
  const [swipeLearning, setSwipeLearningState] = useState(isSwipeLearningEnabled);
  const [passportStampCount, setPassportStampCount] = useState(0);
  const [lifeMode, setLifeModeState] = useState(() => activeLifeMode());
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const accountName = user?.user_metadata?.username || user?.email || user?.phone || 'your account';

  useEffect(() => {
    const _coins    = parseInt(localStorage.getItem('dig_in_coins') || '0', 10);
    const checkins  = JSON.parse(localStorage.getItem('dig_in_checkins') || '{}');
    const _badges   = JSON.parse(localStorage.getItem('dig_in_badges')   || '[]');
    const _home     = localStorage.getItem('dig_in_home_borough') || '';
    const _made     = parseInt(localStorage.getItem('dig_in_made_count') || '0', 10);

    setCoins(_coins);
    setTotalCheckins(Object.values(checkins).reduce((sum, n) => sum + n, 0));
    setUniqueStores(Object.keys(checkins).length);
    setBadges(_badges);
    setHomeBorough(_home);
    setDishesMade(_made);
    setQuests(getQuests());
    setPixelCards(getPixelCards());
    setBoards(getBoards());
    setSavedRecipes(getSavedRecipes());
    setPassportStampCount((loadPassport().stamps || []).length);
  }, []);

  function selectBorough(val) {
    localStorage.setItem('dig_in_home_borough', val);
    setHomeBorough(val);
  }

  // Same control the left SideRail offers, kept here too — this is meant to
  // be a real settings hub, not a fly-out menu's only copy of the truth.
  function chooseLifeMode(id) {
    if (lifeMode?.id === id) { clearLifeMode(); } else if (id) { setLifeMode(id); }
    setLifeModeState(activeLifeMode());
    try { window.dispatchEvent(new Event('dig_in_lifemode')); } catch { /* ignore */ }
  }

  function toggleSwipeLearning() {
    const next = !swipeLearning;
    setSwipeLearningEnabled(next);
    setSwipeLearningState(next);
  }

  const badgeIds   = badges.map(b => b.id);
  const lockedList = ALL_BADGES.filter(b => !badgeIds.includes(b.id));

  return (
    <>
      <Nav />
      <div className="app-container">

        <div className="game-header">
          <div className="title-screen">
            <a href="/" className="title-link"><h1>DIG-IN</h1></a>
          </div>
          <p className="tagline">PIXEL RECIPE GENERATOR</p>
        </div>

        <div className="profile-page">

          {/* How the app looks and reads — skins, the countable-money view,
              and the contrast/motion/text controls. Lives on Profile because
              it's a setting about YOU, not about any one page. */}
          <SkinPicker />

          {/* Stats row */}
          <section className="profile-stats">
            <div className="stat-card">
              <span className="stat-value">{coins}</span>
              <span className="stat-label">Coins</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{totalCheckins}</span>
              <span className="stat-label">Check-ins</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{uniqueStores}</span>
              <span className="stat-label">Stores Visited</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{badges.length}</span>
              <span className="stat-label">Badges</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{dishesMade}</span>
              <span className="stat-label">Dishes Made</span>
            </div>
          </section>

          {/* Saved recipes & boards */}
          <section className="profile-section">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <h3 className="section-title" style={{ margin:0 }}>SAVED RECIPES &amp; BOARDS</h3>
              <button
                onClick={() => navigate('/boards')}
                style={{ fontFamily:"'Press Start 2P',monospace", fontSize:9, padding:'10px 13px', borderRadius:8,
                         border:'2px solid #33302A', background:'#6E8259', color:'#33302A', cursor:'pointer',
                         boxShadow:'2px 2px 0 rgba(0,0,0,.3)' }}
              >
                MANAGE BOARDS →
              </button>
            </div>
            <p className="profile-hint">
              {savedRecipes.length} saved recipe{savedRecipes.length !== 1 ? 's' : ''} · {boards.length} board{boards.length !== 1 ? 's' : ''} — they stay here for you.
            </p>

            {boards.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
                {boards.map(b => (
                  <button key={b.id} onClick={() => navigate('/boards')}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:20,
                             background:'#2a2140', border:'1px solid #554080', color:'#ece8f7', cursor:'pointer', fontSize:13 }}>
                    <span>{b.emoji}</span>
                    <span>{b.title}</span>
                    <span style={{ color:'#6E8259', fontSize:12 }}>{getBoardRecipes(b).length}</span>
                  </button>
                ))}
              </div>
            )}

            {savedRecipes.length === 0 ? (
              <p className="profile-hint" style={{ marginTop: 8 }}>
                No saved recipes yet — tap the heart on any recipe card to start a collection.
              </p>
            ) : (
              <div style={{ display:'flex', gap:10, overflowX:'auto', marginTop:12, paddingBottom:6 }}>
                {savedRecipes.slice(0, 12).map((r, i) => (
                  <button
                    key={r.id || r.name || i}
                    onClick={() => { try { sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(r)); sessionStorage.removeItem('dig_in_full_recipe_adapt'); } catch {} navigate('/recipe'); }}
                    title={r.name}
                    style={{ flex:'0 0 auto', width:96, textAlign:'left', cursor:'pointer', padding:0,
                             background:'#221a33', border:'2px solid #D8CAB4', borderRadius:10, overflow:'hidden', color:'#ece8f7' }}
                  >
                    <div style={{ height:64, background:'#33302A', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Press Start 2P', monospace", fontSize:9, color:'#999' }}>
                      {r.image ? <img src={r.image} alt={r.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (r.name || 'DISH').split(/\s+/)[0].toUpperCase()}
                    </div>
                    <div style={{ padding:'6px 8px', fontSize:11, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {(r.name || '').replace(/\s*\([^)]*\)/g, '')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Home borough */}
          {/* Season of life — the same control the SideRail flyout offers,
              kept here too so it's a real, findable setting, not a menu's
              only copy of the truth. Changing it here updates the feed the
              same way (dig_in_lifemode event, read by Home). */}
          <section className="profile-section">
            <h3 className="section-title">SEASON OF LIFE</h3>
            <p className="profile-hint">Tell the feed what's going on — it reshapes recipes, tags, and pace around it for a while, then asks again.</p>
            <div className="borough-picker">
              {Object.values(LIFE_MODES).map((m) => (
                <button
                  key={m.id}
                  className={`borough-btn${lifeMode?.id === m.id ? ' active' : ''}`}
                  onClick={() => chooseLifeMode(m.id)}
                  title={m.blurb}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
            <p className="borough-current">
              {lifeMode
                ? <>Currently: <b>{lifeMode.emoji} {lifeMode.label}</b>{lifeMode.daysLeft != null ? ` · ${lifeMode.daysLeft} days left` : ''} — tap it again to clear.</>
                : 'Not set — pick one above if it fits right now.'}
            </p>
          </section>

          <section className="profile-section">
            <h3 className="section-title">HOME BOROUGH</h3>
            <p className="profile-hint">Set your home borough to earn bonus coins when you explore other neighborhoods.</p>
            <div className="borough-picker">
              {Object.entries(BOROUGH_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  className={`borough-btn${homeBorough === val ? ' active' : ''}`}
                  data-borough={val}
                  onClick={() => selectBorough(val)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="borough-current">
              {homeBorough
                ? `Currently set to: ${BOROUGH_LABELS[homeBorough] || homeBorough}`
                : 'Not set yet — pick yours above.'}
            </p>
          </section>

          {/* Daily Quests */}
          <section className="quest-panel profile-section">
            <h3 className="section-title">DAILY QUESTS</h3>
            <div className="quest-list">
              {quests && Object.entries(quests.tasks).map(([id, task]) => {
                if (id === 'explore-borough' && !homeBorough) {
                  return (
                    <div key={id} className="quest-card quest-locked">
                      <div className="quest-top">
                        <span className="quest-label">{task.label}</span>
                        <span className="quest-reward">+{task.reward} coins</span>
                      </div>
                      <span className="quest-progress">Set home borough below to unlock</span>
                    </div>
                  );
                }
                const pct = Math.round((task.progress / task.goal) * 100);
                return (
                  <div key={id} className={`quest-card${task.completed ? ' quest-done' : ''}`}>
                    <div className="quest-top">
                      <span className="quest-label">{task.label}</span>
                      <span className="quest-reward">{task.completed ? 'Done' : `+${task.reward} coins`}</span>
                    </div>
                    <div className="quest-bar">
                      <div className="quest-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="quest-progress">
                      {task.completed ? 'Complete!' : `${task.progress} / ${task.goal}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Badges + Leaderboard — the app's gamification/retention pair live
              together here (not in the main nav) so progress and rank stay
              part of your identity page instead of adding another top-level
              destination. */}
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
                : <p className="profile-hint">No badges yet — start checking in!</p>
              }
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

          {/* Leaderboard — see how your check-ins, home cooking, and
              exploring stack up citywide, split by category. */}
          <section className="profile-section">
            <h3 className="section-title">LEADERBOARD</h3>
            <button
              onClick={() => navigate('/leaderboard')}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                textAlign: 'left', cursor: 'pointer',
                background: 'linear-gradient(135deg, #fff8e6, #f6f5fc)',
                border: '1px solid rgba(110, 130, 89,.4)', borderRadius: 14, padding: 14,
              }}
            >
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: '#6E8259', fontFamily: "'Press Start 2P',monospace", fontSize: 14,
              }}>
                #
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 800, color: '#33302A', marginBottom: 4 }}>
                  See where you rank citywide
                </span>
                <span style={{ display: 'block', fontSize: 13, color: '#7a6a58' }}>
                  Restaurant explorer, home cook, or neighborhood explorer — three boards, one you.
                </span>
              </span>
              <span style={{ color: '#6E8259', fontWeight: 700 }}>→</span>
            </button>
          </section>

          {/* City Food Passport — a real stamp per region you've actually
              been in (device location or ZIP), never a fabricated visit. */}
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
                  {passportStampCount} region{passportStampCount === 1 ? '' : 's'} stamped
                </span>
                <span style={{ display: 'block', fontSize: 13, color: '#7a6a58' }}>
                  New city, new stamp — signature dishes, real local stores, and what you've cooked from there.
                </span>
              </span>
              <span style={{ color: '#6E8259', fontWeight: 700 }}>→</span>
            </button>
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
                        <img
                          src={card.pixelDataUrl}
                          alt={card.missionLabel}
                          className="pixel-diary-img"
                        />
                      ) : (
                        <div className="pixel-diary-img pixel-diary-img-placeholder">
                          {card.missionEmoji || 'PHOTO'}
                        </div>
                      )}
                      <div className="pixel-diary-info">
                        <div className="pixel-diary-emoji-label">
                          {card.missionLabel}
                        </div>
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

          {/* Cooked recipe history — My Cookbook card style + paginated "view more" */}
          <section className="profile-section">
            <h3 className="section-title">COOKED RECIPES</h3>
            <CookedRecipes />
          </section>

          {/* Cook Journal — private scrapbook of every "I MADE THIS," share
              a specific dish into a real Circle on your own terms. */}
          <section className="profile-section">
            <h3 className="section-title">COOK JOURNAL</h3>
            <CookJournal />
          </section>

          {/* Mood patterns — what color mood check-ins reveal vs. what you actually cook */}
          {(() => {
            const insight = moodInsight();
            return (
              <section className="profile-section">
                <h3 className="section-title">MOOD PATTERNS</h3>
                {insight ? (
                  <p className="profile-hint" style={{ marginTop: 8 }}>
                    <span
                      style={{
                        display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                        background: insight.color.swatch, marginRight: 8, verticalAlign: 'middle',
                        border: '1px solid rgba(0,0,0,.3)',
                      }}
                    />
                    {insight.text}
                  </p>
                ) : (
                  <p className="profile-hint">
                    Pick a color mood a few times from the "What are you in the mood for?" prompt — I'll start noticing your patterns here.
                  </p>
                )}
              </section>
            );
          })()}

          {/* Nova's Memory Vault — keepsakes from cooking together */}
          {(() => {
            const memories = getMemories();
            const latest = memories[0];
            return (
              <section className="profile-section">
                <h3 className="section-title">NOVA'S MEMORY VAULT</h3>
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
            );
          })()}

          {/* Settings — health filters (silently shape every recipe grid,
              no reason to make declaring an allergy its own destination) and
              Nova Nudges preferences (a real settings button, not a page to
              browse to). /allergies and /wellness still resolve as their own
              routes for AllergyPanel/WellnessPanel's existing cross-links on
              RecipeFull — this is just a second, more natural way in. */}
          <section className="profile-section">
            <h3 className="section-title">SETTINGS</h3>

            <div style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#33302A', margin: '0 0 8px' }}>Allergies & Sensitivities</h4>
              <Allergies embedded />
            </div>

            <div style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#33302A', margin: '0 0 8px' }}>Wellness Goals</h4>
              <Wellness embedded />
            </div>

            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#33302A', margin: '0 0 8px' }}>Nova Nudges</h4>
              <NovaNudgeSettings />
            </div>
          </section>

          {/* Account */}
          <section className="profile-section">
            <h3 className="section-title">ACCOUNT</h3>
            <p className="profile-hint">Signed in as <strong>{accountName}</strong>.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
              <button className="borough-btn" onClick={() => setShowFlavorQuiz(true)}>
                Retake Taste Quiz
              </button>
              <button
                className="borough-btn"
                onClick={() => { logout().catch(() => {}); }}
              >
                Log out
              </button>
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,.08)' }}>
              <label
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={swipeLearning}
                  onChange={toggleSwipeLearning}
                  style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                />
                <span>
                  <strong>Let the Discover swipe game update my flavor profile</strong>
                  <p className="profile-hint" style={{ margin: '4px 0 0' }}>
                    Every swipe in the Tinder-style Discover feed (recalibrate via the "Not vibing with
                    your picks?" button on the home page, or the Discover button on Recipe Cards) nudges
                    what gets recommended to you — liking something pulls recommendations toward it,
                    skipping fast pulls away. Turn this off to swipe and pick recipes without changing
                    your learned taste profile.
                  </p>
                </span>
              </label>
            </div>
          </section>

        </div>
      </div>

      {showFlavorQuiz && (
        <FlavorQuizModal
          onComplete={() => setShowFlavorQuiz(false)}
          onSkip={() => setShowFlavorQuiz(false)}
        />
      )}
    </>
  );
}
