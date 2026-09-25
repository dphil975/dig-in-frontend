import { useState, useEffect, useRef, useMemo } from 'react';
import Nav from '../../../../components/shell/Nav';
import {
  loadState, todayStr, getCoins, isBoostActive, boostRemainingMins,
  streakCoins, calcStreak, performCheckin, claimReward, logPhotoUpload,
  activateStreakProtection, getRestaurantStreak, buildCalendarCells,
} from '../../../../services/checkinService';
import { recordCheckin, getRecentRestaurants } from '../../../../services/behaviorTracker';
import { capturePhoto } from '../../../../lib/native';
import { getSavedRecipes } from '../../../../services/saveService';
import { isStreakMilestone } from '../../../../lib/novaReactions';
import NovaReaction from '../../../../components/nova/NovaReaction';

const CUISINE_OPTIONS = [
  'Italian','Japanese','Mexican','Indian','Thai','Chinese',
  'French','Korean','Vietnamese','Greek','Mediterranean',
  'Middle Eastern','American','Steakhouse','BBQ','Seafood',
];

function useCheckinState() {
  const s        = loadState();
  const today    = todayStr();
  const streak   = calcStreak(s.checkedDays || []);
  const rStreak  = getRestaurantStreak();

  let restDays = [];
  try { restDays = JSON.parse(localStorage.getItem('dig_in_restaurant_checkins') || '[]'); } catch {}
  const yesterday   = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastRestDate = restDays.sort().pop() || null;

  return {
    streak,
    longestStreak:     s.longestStreak || 0,
    totalDays:         (s.checkedDays || []).length,
    checkedInToday:    s.lastCheckin === today,
    coins:             getCoins(),
    boostActive:       isBoostActive(),
    boostMins:         boostRemainingMins(),
    photoStreak:       calcStreak(s.photoUploads || []),
    photoToday:        s.lastPhotoDate === today,
    rewardClaimed:     s.todayRewardClaimed || false,
    restaurantStreak:  rStreak,
    restaurantAtRisk:  rStreak > 0 && lastRestDate === yesterday && !s.restaurantStreakProtected,
    calendar:          buildCalendarCells(s.checkedDays || [], s.photoUploads || []),
  };
}

export default function CheckIn({ embedded = false } = {}) {
  const [ck, setCk]               = useState(useCheckinState);
  const [toast, setToast]         = useState({ show: false, msg: '' });
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardDay, setRewardDay]   = useState(1);
  const [claimed, setClaimed]       = useState(false);
  const [claimMsg, setClaimMsg]     = useState('');
  const [adOpen, setAdOpen]         = useState(false);
  const [adPct, setAdPct]           = useState(0);
  const [adSecs, setAdSecs]         = useState(15);
  const [adDone, setAdDone]         = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [restName,     setRestName]     = useState('');
  const [restCuisine,  setRestCuisine]  = useState('');
  const [recentRests,  setRecentRests]  = useState(() => getRecentRestaurants());
  const [lastRest,     setLastRest]     = useState(null);   // most recent store/restaurant log, for Nova
  const adTimer   = useRef(null);
  const toastTimer = useRef(null);

  function refresh() { setCk(useCheckinState()); }

  function showToast(msg) {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  }

  function handleCheckin() {
    const result = performCheckin();
    if (!result) return;
    refresh();
    if (result.milestoneMsg) showToast(result.milestoneMsg);
    setRewardDay(result.streak);
    setClaimed(false);
    setClaimMsg('');
    setRewardOpen(true);
  }

  function handleClaim(type) {
    if (claimed) return;
    const result = claimReward(type);
    refresh();
    setClaimed(true);
    setClaimMsg(result.msg);
  }

  function closeReward() {
    if (!claimed) return;
    setRewardOpen(false);
  }

  // Camera/photo goes through the platform seam: native camera/gallery on a
  // device, file picker on the web. Returns a data URL (or null if cancelled).
  async function handlePhotoCapture() {
    const dataUrl = await capturePhoto();
    if (!dataUrl) return;
    const result = logPhotoUpload();
    if (!result) return;
    setPhotoPreview(dataUrl);
    showToast(`Photo streak +1! +${result.earned} coins earned`);
    refresh();
  }

  function openAdModal() {
    setAdOpen(true);
    setAdPct(0);
    setAdSecs(15);
    setAdDone(false);
    if (adTimer.current) clearInterval(adTimer.current);
    setTimeout(() => {
      let remaining = 15;
      adTimer.current = setInterval(() => {
        remaining--;
        setAdSecs(remaining);
        setAdPct(((15 - remaining) / 15) * 100);
        if (remaining <= 0) {
          clearInterval(adTimer.current);
          activateStreakProtection();
          setAdDone(true);
          refresh();
        }
      }, 1000);
    }, 500);
  }

  function closeAdModal() {
    if (!adDone) return;
    if (adTimer.current) clearInterval(adTimer.current);
    setAdOpen(false);
  }

  function handleRestLog() {
    if (!restName.trim() && !restCuisine) return;
    // Log today's date to the restaurant streak key (extends existing streak system)
    const today = new Date().toISOString().slice(0, 10);
    let days = [];
    try { days = JSON.parse(localStorage.getItem('dig_in_restaurant_checkins') || '[]'); } catch {}
    if (!days.includes(today)) {
      days.push(today);
      localStorage.setItem('dig_in_restaurant_checkins', JSON.stringify(days));
    }
    // Record cuisine to behavior tracker (feeds recipe slider recommendations)
    recordCheckin({
      id:      `rest_${Date.now()}`,
      name:    restName.trim() || restCuisine,
      type:    'restaurant',
      cuisine: restCuisine || null,
    });
    setRecentRests(getRecentRestaurants());
    setLastRest({ name: restName.trim() || restCuisine, cuisine: restCuisine || null });
    setRestName('');
    setRestCuisine('');
    showToast('Restaurant logged — recipe picks updating!');
    refresh();
  }

  // Context for Nova's check-in reaction: streak milestone celebrations, plus a
  // "recreate it at home" nudge when you log a cuisine you already have saved.
  const checkinCtx = useMemo(() => {
    let savedInCuisineCount = 0;
    if (lastRest?.cuisine) {
      try {
        const c = lastRest.cuisine.toLowerCase();
        savedInCuisineCount = getSavedRecipes()
          .filter(r => (r.cuisine || r.cuisine_type || '').toLowerCase().includes(c)).length;
      } catch { /* ignore */ }
    }
    return {
      streak: ck.streak,
      checkedInToday: ck.checkedInToday,
      hitMilestone: isStreakMilestone(ck.streak),
      restaurantName: lastRest?.name || null,
      restaurantCuisine: lastRest?.cuisine || null,
      savedInCuisineCount,
    };
  }, [ck.streak, ck.checkedInToday, lastRest]);

  const { streak, longestStreak, totalDays, checkedInToday, coins, boostActive, boostMins,
          photoStreak, photoToday, restaurantStreak, restaurantAtRisk, calendar } = ck;
  const { cells, title } = calendar;

  return (
    <div className="ck-page">
      {!embedded && <Nav />}

      <div className="ck-hero">
        <div className="ck-hero-left">
          <div className="ck-flame-wrap">
            <span className="ck-flame">{boostActive ? 'BOOST' : 'STREAK'}</span>
            <span className="ck-streak-num">{streak}</span>
          </div>
          <div className="ck-streak-label">DAY STREAK</div>
          <div className="ck-streak-sub">
            <span>LONGEST: <strong>{longestStreak}</strong></span>
            <span className="ck-dot">·</span>
            <span>TOTAL: <strong>{totalDays}</strong></span>
          </div>
        </div>
        <div className="ck-hero-right">
          <button
            className={`ck-daily-btn${checkedInToday ? ' done' : ''}`}
            disabled={checkedInToday}
            onClick={handleCheckin}
          >
            {checkedInToday ? 'CHECKED IN ✓' : 'CHECK IN TODAY'}
          </button>
          <div className="ck-daily-status">
            {boostActive ? `2× boost active (${boostMins} min left)` : checkedInToday ? 'Come back tomorrow!' : ''}
          </div>
        </div>
      </div>

      {/* Nova reacts to your check-in / store log */}
      <div style={{ padding: '0 16px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <NovaReaction surface="checkin" ctx={checkinCtx} />
      </div>

      <div className="ck-milestone-section">
        <div className="ck-milestone-label">STREAK MILESTONES</div>
        <div className="ck-milestone-track">
          <div className="ck-milestone-bar-fill" style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }} />
          {[7, 14, 21, 30].map(n => (
            <div
              key={n}
              className={`ck-milestone-node${streak >= n ? ' unlocked' : streak >= n - 3 ? ' near' : ''}`}
              data-day={n}
            >
              <div className="ck-node-circle">{n}</div>
              <div className="ck-node-reward">
                {n === 7 ? '+50' : n === 14 ? 'COIN BOOST' : n === 21 ? '+150' : 'SECRET RECIPE'}
              </div>
              <div className="ck-node-name">
                {n === 7 ? 'WEEK WARRIOR' : n === 14 ? 'FORTNIGHT FORCE' : n === 21 ? '3-WEEK LEGEND' : 'MONTHLY MASTER'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ck-main-grid">
        <div className="ck-panel ck-calendar-panel">
          <div className="ck-panel-title">{title}</div>
          <div className="ck-weekdays">
            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="ck-calendar-grid">
            {cells.map((cell, i) => {
              if (cell.empty) return <div key={i} className="ck-day ck-day-empty" />;
              let cls = 'ck-day';
              if (cell.isToday)     cls += ' ck-day-today';
              if (cell.isChecked)   cls += ' ck-day-checked';
              if (cell.isFuture)    cls += ' ck-day-future';
              if (cell.isMilestone && !cell.isFuture) cls += ' ck-day-milestone';
              return (
                <div key={cell.dateStr} className={cls}>
                  <span className="ck-day-num">{cell.day}</span>
                  {cell.hasPhoto && <span className="ck-day-photo">•</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="ck-right-col">
          <div className="ck-panel ck-photo-panel">
            <div className="ck-panel-title">MEAL PHOTO STREAK</div>
            <div className="ck-photo-streak-row">
              <span className="ck-photo-count">{photoStreak}</span>
              <span className="ck-photo-label">days</span>
            </div>
            <div className="ck-photo-status">
              {photoToday ? 'Meal photo uploaded today ✓' : 'No photo uploaded today'}
            </div>
            {!photoToday && (
              <button type="button" className="ck-upload-btn" onClick={handlePhotoCapture}>
                UPLOAD TODAY'S MEAL
              </button>
            )}
            {photoPreview && (
              <div className="ck-photo-preview-wrap">
                <img className="ck-photo-preview" src={photoPreview} alt="Today's meal" />
                <div className="ck-photo-preview-label">Today's meal ✓</div>
              </div>
            )}
          </div>

          <div className="ck-panel ck-restaurant-panel">
            <div className="ck-panel-title">RESTAURANT STREAK</div>
            <div className="ck-photo-streak-row">
              <span className="ck-photo-count">{restaurantStreak}</span>
              <span className="ck-photo-label">check-ins</span>
            </div>
            <div className="ck-photo-status">
              {restaurantStreak === 0
                ? 'Visit a store to start your streak'
                : restaurantAtRisk
                  ? `${restaurantStreak}-day streak — you haven't checked in today`
                  : `${restaurantStreak}-day streak`}
            </div>
            {restaurantAtRisk && (
              <div className="ck-protect-row">
                <div className="ck-protect-warning">Streak at risk!</div>
                <button className="ck-protect-btn" onClick={openAdModal}>WATCH AD TO PROTECT</button>
              </div>
            )}
          </div>

          {/* Restaurant visit logger — feeds recipe slider recommendations */}
          <div className="ck-panel ck-rest-log-panel">
            <div className="ck-panel-title">LOG A RESTAURANT VISIT</div>
            <p className="ck-rest-log-hint">
              The more you log, the smarter your recipe picks get.
            </p>

            <div className="ck-rest-log-form">
              <input
                type="text"
                className="ck-rest-input"
                placeholder="Restaurant name (optional)"
                value={restName}
                onChange={e => setRestName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRestLog()}
              />
              <select
                className="ck-rest-select"
                value={restCuisine}
                onChange={e => setRestCuisine(e.target.value)}
              >
                <option value="">Select cuisine…</option>
                {CUISINE_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                className="ck-rest-log-btn"
                onClick={handleRestLog}
                disabled={!restName.trim() && !restCuisine}
              >
                + LOG VISIT
              </button>
            </div>

            {recentRests.length > 0 && (
              <div className="ck-rest-history">
                <div className="ck-rest-history-label">Recent</div>
                {recentRests.map((r, i) => (
                  <div key={i} className="ck-rest-history-row">
                    <span className="ck-rest-history-name">{r.name || r.cuisine}</span>
                    {r.cuisine && (
                      <span className="ck-rest-history-tag">{r.cuisine}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reward Modal */}
      <div
        className={`ck-overlay${rewardOpen ? ' active' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) closeReward(); }}
      >
        <div className="ck-reward-modal">
          <div className="ck-reward-title">CHOOSE YOUR REWARD</div>
          <div className="ck-reward-sub">Day {rewardDay} — pick one bonus</div>
          <div className="ck-reward-cards" style={{ opacity: claimed ? '.4' : 1, pointerEvents: claimed ? 'none' : 'auto' }}>
            {[
              { type: 'coins',  icon: 'COINS', name: 'COINS',        desc: `+${streakCoins(rewardDay)} coins` },
              { type: 'boost',  icon: 'COIN', name: 'COIN BOOST',   desc: '2× coins for 1 hr' },
              { type: 'recipe', icon: 'SECRET', name: 'SECRET RECIPE', desc: 'Unlock exclusive dish' },
            ].map(({ type, icon, name, desc }) => (
              <div key={type} className="ck-reward-card" data-reward={type} onClick={() => handleClaim(type)}>
                <div className="ck-reward-icon">{icon}</div>
                <div className="ck-reward-name">{name}</div>
                <div className="ck-reward-desc">{desc}</div>
              </div>
            ))}
          </div>
          {claimed && (
            <div className="ck-reward-claim">
              <div className="ck-claim-msg">{claimMsg}</div>
              <button className="ck-claim-close" onClick={() => setRewardOpen(false)}>SWEET! CLOSE →</button>
            </div>
          )}
        </div>
      </div>

      {/* Ad / Streak Protection Modal */}
      <div
        className={`ck-overlay${adOpen ? ' active' : ''}`}
        onClick={e => { if (e.target === e.currentTarget && adDone) closeAdModal(); }}
      >
        <div className="ck-ad-modal">
          <div className="ck-ad-title">STREAK PROTECTION</div>
          <div className="ck-ad-screen">
            <div className="ck-ad-placeholder">
              <div className="ck-ad-placeholder-label">AD</div>
              <div className="ck-ad-placeholder-sub">PLAYING…</div>
            </div>
          </div>
          <div className="ck-ad-bar-wrap">
            <div className="ck-ad-bar" style={{ width: `${adPct}%` }} />
          </div>
          <div className="ck-ad-countdown">{`00:${String(adSecs).padStart(2, '0')}`}</div>
          <div className="ck-ad-status">
            {adDone ? 'Streak protected! Come back tomorrow.' : 'Your streak is being protected…'}
          </div>
          <button
            className={`ck-ad-skip${adDone ? ' protected' : ''}`}
            disabled={!adDone}
            onClick={closeAdModal}
          >
            {adDone ? 'AWESOME — CLOSE' : 'SKIP (watch to protect)'}
          </button>
        </div>
      </div>

      {/* Toast */}
      <div className={`ck-toast${toast.show ? ' visible' : ''}`}>{toast.msg}</div>
    </div>
  );
}
