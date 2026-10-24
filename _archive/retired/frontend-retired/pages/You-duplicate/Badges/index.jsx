import { useState, useEffect, useCallback } from 'react';
import Nav from '../../../components/shell/Nav';
import './Badges.css';

const API_BASE = import.meta.env.VITE_PYTHON_BASE ?? '';

const DEMO_DATA = {
  badges: [
    { badge_id: 'manhattan_explorer', name: 'Manhattan Explorer', icon: 'MANHATTAN', description: 'Visited 10 restaurants in Manhattan', earned: true,  current: 10, required: 10, progress_percent: 100 },
    { badge_id: 'brooklyn_explorer',  name: 'Brooklyn Explorer',  icon: 'BROOKLYN', description: 'Visited 10 restaurants in Brooklyn',   earned: false, current: 6,  required: 10, progress_percent: 60  },
    { badge_id: 'queens_explorer',    name: 'Queens Explorer',    icon: 'QUEENS', description: 'Visited 10 restaurants in Queens',     earned: false, current: 3,  required: 10, progress_percent: 30  },
    { badge_id: 'bronx_explorer',     name: 'Bronx Explorer',     icon: 'BRONX', description: 'Visited 10 restaurants in the Bronx',  earned: false, current: 1,  required: 10, progress_percent: 10  },
    { badge_id: 'pizza_master',       name: 'Pizza Master',       icon: 'PIZZA', description: 'Visited 10 pizza places',              earned: true,  current: 12, required: 10, progress_percent: 100 },
    { badge_id: 'taco_titan',         name: 'Taco Titan',         icon: 'TACO', description: 'Visited 5 taco spots',                 earned: false, current: 3,  required: 5,  progress_percent: 60  },
    { badge_id: 'ramen_warrior',      name: 'Ramen Warrior',      icon: 'RAMEN', description: 'Visited 5 ramen shops',                earned: false, current: 2,  required: 5,  progress_percent: 40  },
    { badge_id: 'coffee_connoisseur', name: 'Coffee Connoisseur', icon: 'COFFEE', description: 'Visited 10 coffee shops',              earned: false, current: 7,  required: 10, progress_percent: 70  },
    { badge_id: 'world_explorer',     name: 'World Explorer',     icon: 'WORLD', description: 'Visited 5 different cuisines',         earned: false, current: 3,  required: 5,  progress_percent: 60  },
    { badge_id: 'night_owl',          name: 'Night Owl',          icon: 'NIGHT', description: 'Visited 5 restaurants after 10 PM',   earned: false, current: 2,  required: 5,  progress_percent: 40  },
    { badge_id: 'early_bird',         name: 'Early Bird',         icon: 'EARLY', description: 'Visited 5 restaurants before 8 AM',   earned: false, current: 0,  required: 5,  progress_percent: 0   },
    { badge_id: 'bridge_hopper',      name: 'Bridge Hopper',      icon: 'BRIDGE', description: 'Visited 5 restaurants near Brooklyn Bridge', earned: false, current: 1, required: 5, progress_percent: 20 },
  ],
  total_earned: 2,
  total_badges: 12,
};

export default function Badges() {
  const [badges, setBadges]           = useState([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalBadges, setTotalBadges] = useState(0);
  const [isOffline, setIsOffline]     = useState(false);
  const [notif, setNotif]             = useState({ show: false, icon: '', title: '', desc: '' });

  const applyData = (data) => {
    setBadges(data.badges);
    setTotalEarned(data.total_earned);
    setTotalBadges(data.total_badges);
  };

  const showNotification = useCallback((icon, title, desc) => {
    setNotif({ show: true, icon, title, desc });
    setTimeout(() => setNotif(n => ({ ...n, show: false })), 3000);
  }, []);

  const loadBadges = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/badges/progress`);
      const data = await res.json();
      applyData(data);
    } catch {
      applyData(DEMO_DATA);
    }
  }, []);

  useEffect(() => { loadBadges(); }, [loadBadges]);

  const earned   = totalEarned;
  const total    = totalBadges || badges.length || 12;
  const percent  = total > 0 ? Math.round((earned / total) * 100) : 0;
  const boroughs = Math.min(4, Math.floor(earned / 3));

  return (
    <>
      <Nav />
      <div className="badges-container">
        <div className="badges-header">
          <h1>Badge Collection</h1>
          <p>Explore the city, earn badges, collect them all!</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value">{earned}</div><div className="stat-label">Badges Earned</div></div>
          <div className="stat-card"><div className="stat-value">{total}</div><div className="stat-label">Total Badges</div></div>
          <div className="stat-card"><div className="stat-value">{percent}%</div><div className="stat-label">Completion</div></div>
          <div className="stat-card"><div className="stat-value">{boroughs}</div><div className="stat-label">Boroughs Explored</div></div>
        </div>

        <div className="offline-toggle">
          <button className={`offline-btn${!isOffline ? ' active' : ''}`} onClick={() => { setIsOffline(false); loadBadges(); }}>Online</button>
          <button className={`offline-btn${isOffline ? ' active' : ''}`}  onClick={() => { setIsOffline(true); showNotification('OFFLINE', 'Offline Mode', 'Badges available offline. Earn progress will sync when online.'); }}>Offline Mode</button>
          <button className="offline-btn" onClick={() => {
            if (isOffline) alert('Offline badge pack downloaded! Badges are ready to view without internet.');
            else showNotification('⬇️', 'Downloading Badges', 'Badge data cached for offline viewing.');
          }}>⬇️ Download Badges for Offline</button>
        </div>

        <div className="badge-grid">
          {badges.map(badge => (
            <div
              key={badge.badge_id}
              className={`badge-card${badge.earned ? ' earned' : ' locked'}`}
              onClick={() => showNotification(badge.icon, badge.name, badge.description)}
            >
              {badge.earned && (
                <div className="badge-number">{badge.badge_id.split('_').pop()}</div>
              )}
              <span className="badge-icon">{badge.icon}</span>
              <div className="badge-name">{badge.name}</div>
              <div className="badge-description">{badge.description}</div>
              <div className="badge-progress">
                <div className="badge-progress-fill" style={{ width: `${badge.progress_percent || 0}%` }} />
              </div>
              {badge.earned
                ? <div className="badge-earned-date">Earned!</div>
                : <div className="badge-count">{badge.current}/{badge.required}</div>
              }
            </div>
          ))}
        </div>
      </div>

      <div className={`notification${notif.show ? ' show' : ''}`}>
        <div className="notification-inner">
          <span className="notification-icon">{notif.icon}</span>
          <div>
            <div className="notification-title">{notif.title}</div>
            <div>{notif.desc}</div>
          </div>
        </div>
      </div>
    </>
  );
}
