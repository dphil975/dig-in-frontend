import { useState, useMemo, useEffect } from 'react';
import Nav from '../../../components/shell/Nav';
import { getCookingStats, getCookHistory, cookStreak } from '../../../services/saveService';
import { listJudgedFeed } from '../../../lib/journalApi';
import { getUserId } from '../../../lib/syncService';
import DishFlipCard from '../../../components/recipe/DishFlipCard';
import './Leaderboard.css';

// ALL_USERS (a hand-written cast of invented cooks with invented scores)
// was removed: ranking real people against fictional competitors is the
// fastest way to lose them. The ranked boards stay empty until real
// players fill them; the Dishes tab is real and works today.

const SCORER = {
  overall:    u => u.rest + u.cook + u.exp,
  restaurant: u => u.rest,
  home_cook:  u => u.cook,
  explorer:   u => u.exp,
};

const SCORE_SUFFIX = {
  overall: 'pts',
  restaurant: 'rest pts',
  home_cook: 'cook pts',
  explorer: 'exp pts',
};

const RANK_CLASS = { 1: 'gold', 2: 'silver', 3: 'bronze' };

const TABS = [
  { type: 'overall',    label: 'Overall' },
  { type: 'restaurant', label: 'Restaurant' },
  { type: 'home_cook',  label: 'Home Cook' },
  { type: 'explorer',   label: 'Explorer' },
  { type: 'dishes',     label: 'Dish Submissions' },
];

// Dish Submissions is real data (node/routes/journal.js's judged feed), unlike
// the other four tabs' illustrative ALL_USERS pool — sorted by rating count
// first (more community engagement = more validated), average as the
// tiebreak, same simple/explainable-heuristic style as the rest of the app.
function useDishSubmissions(active) {
  const [entries, setEntries] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (!active || entries !== null) return;
    listJudgedFeed().then(setEntries);
    getUserId().then(setUserId);
  }, [active, entries]);

  const sorted = useMemo(() => {
    if (!entries) return [];
    return [...entries].sort((a, b) => (b.ratingCount - a.ratingCount) || (b.ratingAvg - a.ratingAvg));
  }, [entries]);

  function markRated(id, res) {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, ratingAvg: res.ratingAvg, ratingCount: res.ratingCount } : e)));
  }

  return { entries: sorted, loading: entries === null, userId, markRated };
}

// Real per-user home-cook signal — totalCooked/streak/badges are all durable
// (cook_log + user_badges, via the /api/vault/cook + syncService wiring), so
// this is a real score, not a seed. restaurantScore/explorerScore have no
// equivalent real local signal yet, so they stay the page's existing
// placeholder values — see the honesty note rendered below.
/* The four header cards, from real local data only. Every number here is
   something this person actually did — no community aggregate is shown until
   there is a community to aggregate. */
function useYourStats() {
  return useMemo(() => {
    const stats = getCookingStats();
    const history = getCookHistory();
    let badges = 0;
    try { badges = (JSON.parse(localStorage.getItem('dig_in_badges') || '[]') || []).length; } catch { /* ignore */ }
    const countries = new Set(
      history.map((h) => String(h.cuisine || '').toLowerCase()).filter(Boolean),
    ).size;
    return {
      totalCooked: stats.totalCooked || 0,
      streak: cookStreak(history) || 0,
      badges,
      countries,
    };
  }, []);
}

function useRealHomeCookScore() {
  return useMemo(() => {
    const stats = getCookingStats();
    const streak = cookStreak(getCookHistory());
    let badgeCount = 0;
    try { badgeCount = (JSON.parse(localStorage.getItem('dig_in_badges') || '[]') || []).length; } catch { /* ignore */ }
    return stats.totalCooked * 60 + streak * 20 + badgeCount * 50;
  }, []);
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('overall');
  const homeCookScore = useRealHomeCookScore();
  const yourStats = useYourStats();
  const isDishesTab = activeTab === 'dishes';
  const dishSubmissions = useDishSubmissions(isDishesTab);
  // "You" profile — restaurantScore/explorerScore are the page's existing
  // illustrative placeholders; homeCookScore is real (see above).
  // restaurantScore and explorerScore were hardcoded to 720 and 495 — which
  // meant a brand-new user with zero cooks was shown "your score: 1,215".
  // Flattering, and false. There is no real check-in or exploration signal
  // stored locally yet, so those read 0 until there is one. homeCookScore is
  // genuinely computed from cook history, streak, and badges.
  const YOU = { restaurantScore: 0, homeCookScore, explorerScore: 0 };

  /* The ranked boards are empty until real people fill them.
     ALL_USERS is a hand-written cast of invented cooks — mias.flavors,
     BoroughHopper and the rest — with invented scores. Ranking a real person
     against fictional competitors is the single fastest way to lose them:
     they compete, they eventually notice, and then they tell people. The
     "Dishes" tab is real (judged submissions from the backend), so that one
     works today; these four come back the moment there are enough real
     players to sort. */
  const sorted = useMemo(() => [], [activeTab, isDishesTab]);
  const boardIsEmpty = !isDishesTab && sorted.length === 0;

  // Podium visual order: 2nd | 1st | 3rd
  const podium = sorted.length >= 3
    ? [
        { pos: 'second', medal: '2ND', posClass: 'second', user: sorted[1] },
        { pos: 'first',  medal: '1ST', posClass: 'first',  user: sorted[0] },
        { pos: 'third',  medal: '3RD', posClass: 'third',  user: sorted[2] },
      ]
    : [];

  // Compute "Your rank" for the pinned row based on active tab
  const yourScore = activeTab === 'overall'   ? YOU.restaurantScore + YOU.homeCookScore + YOU.explorerScore
                  : activeTab === 'restaurant' ? YOU.restaurantScore
                  : activeTab === 'home_cook'  ? YOU.homeCookScore
                  :                              YOU.explorerScore;
  // No rank while the board is empty. Computing it against an empty pool would
  // return "#1", which is a flattering lie and worse than showing nothing.
  const yourRank = null;

  return (
    <>
      <Nav />

      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h1>Community Leaderboard</h1>
          <p>Earn points by exploring restaurants, cooking at home, and supporting local businesses</p>
        </div>

        <div className="leaderboard-stats">
          {/* Your real numbers. These four cards used to read 1,247 active
              members / 3,892 restaurant visits / 1,456 recipes / 8,234 badges
              — all invented, all stated as fact at the top of the page.
              Inflated metrics are a house of cards: the first person who asks
              how many users you actually have learns the number was
              decoration, and every other claim goes with it. Community totals
              come back here when there is a community to total. */}
          <div className="leaderboard-stat-card">
            <div className="stat-number">{yourStats.totalCooked}</div>
            <div className="stat-label">Dishes you&apos;ve cooked</div>
          </div>
          <div className="leaderboard-stat-card">
            <div className="stat-number">{yourStats.streak}</div>
            <div className="stat-label">Day streak</div>
          </div>
          <div className="leaderboard-stat-card">
            <div className="stat-number">{yourStats.badges}</div>
            <div className="stat-label">Badges earned</div>
          </div>
          <div className="leaderboard-stat-card">
            <div className="stat-number">{yourStats.countries}</div>
            <div className="stat-label">Countries cooked</div>
          </div>
        </div>

        <div className="leaderboard-tabs">
          {TABS.map(t => (
            <button
              key={t.type}
              className={`leaderboard-tab${activeTab === t.type ? ' active' : ''}`}
              onClick={() => setActiveTab(t.type)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isDishesTab ? (
          <>
            {dishSubmissions.loading ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '30px 0' }}>Loading submissions…</p>
            ) : dishSubmissions.entries.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '30px 0' }}>
                <p style={{ fontWeight: 700, marginBottom: 6 }}>No dishes submitted yet.</p>
                <p style={{ fontSize: 13 }}>
                  Cook something and hit "Submit to Leaderboard" after "I MADE THIS" — be the first.
                </p>
              </div>
            ) : (
              <div className="dish-submissions-grid">
                {dishSubmissions.entries.map(entry => (
                  <DishFlipCard
                    key={entry.id}
                    entry={entry}
                    currentUserId={dishSubmissions.userId}
                    onRated={dishSubmissions.markRated}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {podium.length > 0 && (
              <div className="weekly-podium">
                {podium.map(({ posClass, medal, user }) => (
                  <div className="podium-item" key={posClass}>
                    <div className={`position ${posClass}`}>{medal}</div>
                    <div className="podium-avatar">{user.avatar}</div>
                    <div className="podium-name">{user.username}</div>
                    <div className="podium-score">{user.score.toLocaleString()} {SCORE_SUFFIX[activeTab]}</div>
                    <div className="podium-badges">
                      {user.badges.map((b, i) => <span key={i} className="badge-icon">{b}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="leaderboard-card">
              {boardIsEmpty ? (
                <div className="leaderboard-empty">
                  <p className="lb-empty-head">Nobody&apos;s on this board yet.</p>
                  <p className="lb-empty-body">
                    Your score so far is <b>{yourScore.toLocaleString()}</b>. We&apos;re not going to
                    rank you against made-up people to make the page look busy — this fills in when
                    real cooks show up. The <b>Dishes</b> tab is live now if you want something real
                    to look at.
                  </p>
                </div>
              ) : (
                <div className="leaderboard-item your-rank">
                  <div className="rank">{yourRank ? `#${yourRank}` : '—'}</div>
                  <div className="avatar">YOU</div>
                  <div className="info">
                    <div className="username">You</div>
                  </div>
                  <div className="score">{yourScore.toLocaleString()}</div>
                </div>
              )}

              {sorted.map(u => (
                <div className="leaderboard-item" key={u.id}>
                  <div className={`rank${RANK_CLASS[u.rank] ? ' ' + RANK_CLASS[u.rank] : ''}`}>
                    #{u.rank}
                  </div>
                  <div className="avatar">{u.avatar}</div>
                  <div className="info">
                    <div className="username">{u.username}</div>
                    <div className="badges">
                      {u.badges.map((b, i) => <span key={i} className="badge-icon">{b}</span>)}
                    </div>
                  </div>
                  <div className="borough">{u.borough}</div>
                  <div className="score">{u.score.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ color: '#888', fontSize: '13px' }}>
            Top 10 each week earn premium badges and featured profiles
          </p>
          <p style={{ color: '#888', fontSize: '11px', marginTop: '6px' }}>
            {isDishesTab
              ? 'Dish Submissions is real — every card, rating, and photo here comes from an actual cook.'
              : 'Your Home Cook score is real, built from your own cook history, streak, and badges. Restaurant and Explorer read zero because nothing tracks them yet — we would rather show you a zero than a number we made up.'}
          </p>
        </div>
      </div>
    </>
  );
}
