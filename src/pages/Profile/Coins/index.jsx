import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePane from '../ProfilePane';
import Leaderboard from '../Leaderboard';

/* Profile → Coins — what you've earned and what earns more: the coin count,
   today's quests, and (behind /leaderboard) how you rank citywide. */

function getQuests() {
  const today  = new Date().toISOString().slice(0, 10);
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem('dig_in_quests') || 'null'); } catch { /* ignore */ }
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

function Overview() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [homeBorough, setHomeBorough] = useState('');
  const [quests, setQuests] = useState(null);

  useEffect(() => {
    setCoins(parseInt(localStorage.getItem('dig_in_coins') || '0', 10));
    setHomeBorough(localStorage.getItem('dig_in_home_borough') || '');
    setQuests(getQuests());
  }, []);

  return (
    <ProfilePane>
      <section className="profile-stats">
        <div className="stat-card">
          <span className="stat-value">{coins}</span>
          <span className="stat-label">Coins</span>
        </div>
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
                  <span className="quest-progress">
                    Set your home borough in <button type="button" className="pcoins-link" onClick={() => navigate('/settings/location')}>Settings → Location</button> to unlock
                  </span>
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

      {/* Leaderboard — see how your check-ins, home cooking, and exploring
          stack up citywide, split by category. */}
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
    </ProfilePane>
  );
}

export default function Coins({ path }) {
  const navigate = useNavigate();
  const onBoard = path === '/leaderboard';

  return (
    <>
      <nav className="psub" aria-label="Coins">
        <button type="button" className={`psub-pill${!onBoard ? ' active' : ''}`}
          onClick={() => { if (onBoard) navigate('/coins', { replace: true }); }}>
          Coins &amp; quests
        </button>
        <button type="button" className={`psub-pill${onBoard ? ' active' : ''}`}
          onClick={() => { if (!onBoard) navigate('/leaderboard', { replace: true }); }}>
          Leaderboard
        </button>
      </nav>
      {onBoard ? <Leaderboard /> : <Overview />}
    </>
  );
}
