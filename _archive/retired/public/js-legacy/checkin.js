/* ── Dig In Daily Check-In System ───────────────────────────── */

const CK_KEY   = 'dig_in_checkin';
const COIN_KEY = 'dig_in_coins';

const SECRET_RECIPES = [
  'Bodega Grilled Cheese Special',
  'Midnight Dumpling Soup',
  'Corner Store Congee',
  'NYC Egg Cream Float',
  'Rooftop BBQ Wings',
  'Fire Escape Kimchi Fried Rice',
  'Deli Counter Chopped Cheese',
];

/* ── Persistence ──────────────────────────────────────────────── */
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(CK_KEY)) || {};
  } catch (_) { return {}; }
}

function saveState(s) {
  localStorage.setItem(CK_KEY, JSON.stringify(s));
}

function getCoins() {
  return parseInt(localStorage.getItem(COIN_KEY) || '0', 10);
}

function addCoins(n) {
  const boost  = isBoostActive() ? 2 : 1;
  const earned = n * boost;
  const next   = getCoins() + earned;
  localStorage.setItem(COIN_KEY, String(next));
  const el = document.getElementById('coinCount');
  if (el) el.textContent = String(next);
  return earned;
}

/* ── Date helpers ─────────────────────────────────────────────── */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const ms = Math.abs(new Date(b) - new Date(a));
  return Math.round(ms / 86400000);
}

/* ── Streak calculation ───────────────────────────────────────── */
function calcStreak(checkedDays) {
  if (!checkedDays || !checkedDays.length) return 0;
  const sorted = [...new Set(checkedDays)].sort().reverse();
  const today  = todayStr();
  let count    = 0;
  let cursor   = sorted[0] === today ? today : null;
  if (!cursor) {
    // Last check-in was yesterday — streak still live
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    cursor = sorted[0] === yesterday ? yesterday : null;
  }
  if (!cursor) return 0;
  for (const d of sorted) {
    if (d === cursor) {
      count++;
      const prev = new Date(new Date(cursor) - 86400000).toISOString().slice(0, 10);
      cursor = prev;
    } else {
      break;
    }
  }
  return count;
}

/* ── XP / Coin boost ──────────────────────────────────────────── */
function isBoostActive() {
  const s     = loadState();
  const expiry = s.boostExpiry || 0;
  return Date.now() < expiry;
}

function boostRemainingMins() {
  const s = loadState();
  const ms = (s.boostExpiry || 0) - Date.now();
  return ms > 0 ? Math.ceil(ms / 60000) : 0;
}

/* ── Coin reward scale by streak ──────────────────────────────── */
function streakCoins(streak) {
  if (streak >= 30) return 100;
  if (streak >= 14) return 60;
  if (streak >= 7)  return 40;
  return 25;
}

/* ── Main check-in ────────────────────────────────────────────── */
function performCheckin() {
  const s     = loadState();
  const today = todayStr();

  if (s.lastCheckin === today) return; // Already done

  const days = s.checkedDays || [];
  days.push(today);
  s.checkedDays    = [...new Set(days)];
  s.lastCheckin    = today;
  s.todayRewardClaimed = false;
  s.todayRewardType    = null;

  const streak = calcStreak(s.checkedDays);
  s.currentStreak = streak;
  s.longestStreak = Math.max(streak, s.longestStreak || 0);

  saveState(s);

  // Milestone auto-rewards
  if ([7, 14, 21, 30].includes(streak)) {
    autoMilestoneReward(streak, s);
  }

  refreshUI();
  showRewardModal(streak);
}

function autoMilestoneReward(streak, s) {
  if (streak === 7)  { addCoins(50);  showToast('+50 coins — WEEK WARRIOR!'); }
  if (streak === 14) {
    s.boostExpiry = Date.now() + 86400000; // 24-hour boost
    saveState(s);
    showToast('COIN BOOST active for 24 hours!');
  }
  if (streak === 21) { addCoins(150); showToast('+150 coins — 3-WEEK LEGEND!'); }
  if (streak === 30) {
    const recipe = SECRET_RECIPES[Math.floor(Math.random() * SECRET_RECIPES.length)];
    s.unlockedRecipes = [...(s.unlockedRecipes || []), recipe];
    saveState(s);
    showToast(`Secret recipe unlocked: ${recipe}!`);
  }
}

/* ── Reward modal ─────────────────────────────────────────────── */
function showRewardModal(streak) {
  document.getElementById('ckRewardDay').textContent    = streak;
  document.getElementById('ckCoinRewardAmt').textContent = `+${streakCoins(streak)} coins`;
  document.getElementById('ckRewardClaim').style.display = 'none';
  document.querySelectorAll('.ck-reward-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('ckRewardOverlay').classList.add('active');
}

function claimReward(type, streakEl) {
  const s      = loadState();
  const streak = s.currentStreak || 1;
  let msg      = '';

  if (type === 'coins') {
    const earned = addCoins(streakCoins(streak));
    msg = `+${earned} coins added to your wallet!`;
  } else if (type === 'boost') {
    s.boostExpiry = Date.now() + 3600000; // 1 hour
    saveState(s);
    msg = 'COIN BOOST active — 2× coins for the next hour!';
  } else if (type === 'recipe') {
    const recipe = SECRET_RECIPES[Math.floor(Math.random() * SECRET_RECIPES.length)];
    s.unlockedRecipes = [...(s.unlockedRecipes || []), recipe];
    s.todayRewardClaimed = true;
    s.todayRewardType    = type;
    saveState(s);
    msg = `Unlocked: "${recipe}" — check your cookbook!`;
  }

  s.todayRewardClaimed = true;
  s.todayRewardType    = type;
  saveState(s);

  document.getElementById('ckClaimMsg').textContent      = msg;
  document.getElementById('ckRewardClaim').style.display = 'block';
  document.getElementById('ckRewardCards').style.opacity = '.4';
  document.getElementById('ckRewardCards').style.pointerEvents = 'none';
  refreshUI();
}

/* ── Photo upload ─────────────────────────────────────────────── */
function handlePhotoUpload(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const s     = loadState();
  const today = todayStr();

  if (s.lastPhotoDate === today) return; // Already uploaded

  const photos = s.photoUploads || [];
  photos.push(today);
  s.photoUploads   = [...new Set(photos)];
  s.lastPhotoDate  = today;
  s.photoStreak    = calcStreak(s.photoUploads);
  saveState(s);

  const earned = addCoins(15);
  showToast(`Photo streak +1! +${earned} coins earned`);

  // Show preview
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('ckPhotoPreview').src = e.target.result;
    document.getElementById('ckPhotoPreviewWrap').style.display = 'block';
    document.getElementById('ckPhotoStatus').textContent = 'Meal photo uploaded today ✓';
    document.getElementById('ckUploadLabel').style.display = 'none';
  };
  reader.readAsDataURL(file);

  refreshUI();
}

/* ── Ad / streak protection ───────────────────────────────────── */
let adTimer = null;

function startAdCountdown() {
  const btn  = document.getElementById('ckAdSkip');
  const bar  = document.getElementById('ckAdBar');
  const cd   = document.getElementById('ckAdCountdown');
  const status = document.getElementById('ckAdStatus');

  btn.disabled    = true;
  let remaining   = 15;
  bar.style.width = '0%';

  adTimer = setInterval(() => {
    remaining--;
    const pct = ((15 - remaining) / 15) * 100;
    bar.style.width = `${pct}%`;
    cd.textContent  = `00:${String(remaining).padStart(2, '0')}`;

    if (remaining <= 0) {
      clearInterval(adTimer);
      adComplete();
    }
  }, 1000);
}

function adComplete() {
  const s = loadState();
  // Restore restaurant streak by extending the last check-in date to today
  s.restaurantLastCheckin = todayStr();
  s.restaurantStreakProtected = true;
  saveState(s);

  document.getElementById('ckAdStatus').textContent = 'Streak protected! Come back tomorrow.';
  const btn = document.getElementById('ckAdSkip');
  btn.disabled  = false;
  btn.textContent = 'AWESOME — CLOSE';
  btn.classList.add('protected');
  addCoins(5);
  refreshUI();
}

/* ── Toast notification ───────────────────────────────────────── */
function showToast(msg) {
  let t = document.getElementById('ckToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'ckToast';
    t.className = 'ck-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('visible'), 3000);
}

/* ── Calendar render ──────────────────────────────────────────── */
function renderCalendar(checkedDays, photoUploads) {
  const now    = new Date();
  const year   = now.getFullYear();
  const month  = now.getMonth();
  const today  = todayStr();
  const daySet = new Set(checkedDays || []);
  const photoSet = new Set(photoUploads || []);

  const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  document.getElementById('ckCalendarTitle').textContent = `${months[month]} ${year}`;

  const firstDay   = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = document.getElementById('ckCalendarGrid');

  let html = '';
  // Empty leading cells
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="ck-day ck-day-empty"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday    = dateStr === today;
    const isChecked  = daySet.has(dateStr);
    const hasPhoto   = photoSet.has(dateStr);
    const isFuture   = dateStr > today;
    const isMilestone = [7, 14, 21, 30].includes(d);

    let cls = 'ck-day';
    if (isToday)   cls += ' ck-day-today';
    if (isChecked) cls += ' ck-day-checked';
    if (isFuture)  cls += ' ck-day-future';
    if (isMilestone && !isFuture) cls += ' ck-day-milestone';

    const photoMark = hasPhoto ? '<span class="ck-day-photo">📸</span>' : '';
    html += `<div class="${cls}"><span class="ck-day-num">${d}</span>${photoMark}</div>`;
  }
  grid.innerHTML = html;
}

/* ── Milestone track ──────────────────────────────────────────── */
function renderMilestones(streak) {
  const nodes = [7, 14, 21, 30];
  nodes.forEach(n => {
    const el = document.getElementById(`ckNode${n}`);
    if (!el) return;
    el.classList.remove('unlocked', 'reached');
    if (streak >= n)       el.classList.add('unlocked');
    else if (streak >= n - 3) el.classList.add('near');
  });

  // Fill progress bar between nodes
  const pct = Math.min((streak / 30) * 100, 100);
  const fill = document.getElementById('ckMilestoneFill');
  if (fill) fill.style.width = `${pct}%`;
}

/* ── Restaurant streak ────────────────────────────────────────── */
function refreshRestaurantStreak() {
  const s         = loadState();
  // Restaurant check-ins are stored by index.html as dig_in_restaurant_checkins
  let restaurantDays = [];
  try {
    restaurantDays = JSON.parse(localStorage.getItem('dig_in_restaurant_checkins') || '[]');
  } catch (_) {}

  // Merge with what checkin.js tracks
  if (s.restaurantLastCheckin) restaurantDays.push(s.restaurantLastCheckin);
  restaurantDays = [...new Set(restaurantDays)].sort();

  const rStreak = calcStreak(restaurantDays);
  document.getElementById('ckRestaurantStreak').textContent = rStreak;

  const today     = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastDate  = restaurantDays.length ? restaurantDays[restaurantDays.length - 1] : null;
  const atRisk    = rStreak > 0 && lastDate === yesterday && !s.restaurantStreakProtected;

  const protectRow = document.getElementById('ckProtectRow');
  const statusEl   = document.getElementById('ckRestaurantStatus');

  if (rStreak === 0) {
    statusEl.textContent = 'Visit a store to start your streak';
    protectRow.style.display = 'none';
  } else if (atRisk) {
    statusEl.textContent = `${rStreak}-day streak — you haven't checked in today`;
    protectRow.style.display = 'flex';
  } else if (lastDate === today) {
    statusEl.textContent = `Checked in today — streak safe!`;
    protectRow.style.display = 'none';
  } else {
    statusEl.textContent = `${rStreak}-day streak`;
    protectRow.style.display = 'none';
  }
  // Reset protection flag at start of new day
  if (s.restaurantStreakProtected && lastDate !== yesterday) {
    s.restaurantStreakProtected = false;
    saveState(s);
  }
}

/* ── Full UI refresh ──────────────────────────────────────────── */
function refreshUI() {
  const s      = loadState();
  const today  = todayStr();
  const streak = calcStreak(s.checkedDays || []);

  // Coins
  const coinEl = document.getElementById('coinCount');
  if (coinEl) coinEl.textContent = String(getCoins());

  // Hero
  document.getElementById('ckStreakNum').textContent  = streak;
  document.getElementById('ckLongest').textContent    = s.longestStreak || 0;
  document.getElementById('ckTotalDays').textContent  = (s.checkedDays || []).length;

  // Boost label on streak
  if (isBoostActive()) {
    const mins = boostRemainingMins();
    document.getElementById('ckFlame').textContent = '⚡';
    document.getElementById('ckCheckinStatus').textContent = `2× boost active (${mins} min left)`;
  }

  // Check-in button
  const btn    = document.getElementById('ckCheckinBtn');
  const status = document.getElementById('ckCheckinStatus');
  if (s.lastCheckin === today) {
    btn.disabled    = true;
    btn.textContent = 'CHECKED IN ✓';
    btn.classList.add('done');
    if (!isBoostActive()) status.textContent = 'Come back tomorrow!';
  } else {
    btn.disabled    = false;
    btn.textContent = 'CHECK IN TODAY';
    btn.classList.remove('done');
    status.textContent = '';
  }

  // Calendar
  renderCalendar(s.checkedDays || [], s.photoUploads || []);

  // Milestones
  renderMilestones(streak);

  // Photo streak
  const photoStreak = calcStreak(s.photoUploads || []);
  document.getElementById('ckPhotoStreak').textContent = photoStreak;
  if (s.lastPhotoDate === today) {
    document.getElementById('ckPhotoStatus').textContent = 'Meal photo uploaded today ✓';
    document.getElementById('ckUploadLabel').style.display = 'none';
    document.getElementById('ckPhotoPreviewWrap').style.display = 'block';
  }

  // Restaurant streak
  refreshRestaurantStreak();
}

/* ── Boot ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  refreshUI();

  // Check-in button
  document.getElementById('ckCheckinBtn').addEventListener('click', performCheckin);

  // Reward card selection
  document.getElementById('ckRewardCards').addEventListener('click', e => {
    const card = e.target.closest('.ck-reward-card');
    if (!card) return;
    const s = loadState();
    if (s.todayRewardClaimed) return;
    document.querySelectorAll('.ck-reward-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    claimReward(card.dataset.reward);
  });

  // Close reward modal
  document.getElementById('ckClaimClose').addEventListener('click', () => {
    document.getElementById('ckRewardOverlay').classList.remove('active');
    document.getElementById('ckRewardCards').style.opacity = '';
    document.getElementById('ckRewardCards').style.pointerEvents = '';
  });

  // Photo upload
  document.getElementById('ckPhotoInput').addEventListener('change', e => {
    handlePhotoUpload(e.target.files[0]);
  });

  // Protect streak button → open ad modal
  document.getElementById('ckProtectBtn').addEventListener('click', () => {
    document.getElementById('ckAdOverlay').classList.add('active');
    // Reset ad state
    const bar = document.getElementById('ckAdBar');
    const cd  = document.getElementById('ckAdCountdown');
    const status = document.getElementById('ckAdStatus');
    const skip   = document.getElementById('ckAdSkip');
    bar.style.width    = '0%';
    cd.textContent     = '00:15';
    status.textContent = 'Your streak is being protected…';
    skip.disabled      = true;
    skip.textContent   = 'SKIP (watch to protect)';
    skip.classList.remove('protected');
    if (adTimer) clearInterval(adTimer);
    setTimeout(startAdCountdown, 500);
  });

  // Close ad modal (only when ad is done)
  document.getElementById('ckAdSkip').addEventListener('click', () => {
    const btn = document.getElementById('ckAdSkip');
    if (!btn.disabled) {
      if (adTimer) clearInterval(adTimer);
      document.getElementById('ckAdOverlay').classList.remove('active');
    }
  });

  // Close overlays on backdrop click
  ['ckRewardOverlay', 'ckAdOverlay'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target.id === id) {
        const s = loadState();
        // Only allow closing reward overlay if reward was claimed
        if (id === 'ckRewardOverlay' && !s.todayRewardClaimed) return;
        document.getElementById(id).classList.remove('active');
      }
    });
  });
});
