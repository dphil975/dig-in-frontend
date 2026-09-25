/**
 * Dig In Check-In Service
 * Pure logic — no DOM access. React components call these and manage state.
 */

import { pushCheckinState, pushProfile } from '../lib/syncService';

const CK_KEY   = 'dig_in_checkin';
const COIN_KEY = 'dig_in_coins';

export const SECRET_RECIPES = [
  'Bodega Grilled Cheese Special',
  'Midnight Dumpling Soup',
  'Corner Store Congee',
  'NYC Egg Cream Float',
  'Rooftop BBQ Wings',
  'Fire Escape Kimchi Fried Rice',
  'Deli Counter Chopped Cheese',
];

export function loadState() {
  try { return JSON.parse(localStorage.getItem(CK_KEY)) || {}; }
  catch { return {}; }
}

function saveState(s) {
  localStorage.setItem(CK_KEY, JSON.stringify(s));
  pushCheckinState(s);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function getCoins() {
  return parseInt(localStorage.getItem(COIN_KEY) || '0', 10);
}

export function isBoostActive() {
  return Date.now() < (loadState().boostExpiry || 0);
}

export function boostRemainingMins() {
  const ms = (loadState().boostExpiry || 0) - Date.now();
  return ms > 0 ? Math.ceil(ms / 60000) : 0;
}

export function streakCoins(streak) {
  if (streak >= 30) return 100;
  if (streak >= 14) return 60;
  if (streak >= 7)  return 40;
  return 25;
}

export function calcStreak(checkedDays = []) {
  if (!checkedDays.length) return 0;
  const sorted = [...new Set(checkedDays)].sort().reverse();
  const today     = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let cursor = sorted[0] === today ? today : sorted[0] === yesterday ? yesterday : null;
  if (!cursor) return 0;
  let count = 0;
  for (const d of sorted) {
    if (d === cursor) {
      count++;
      cursor = new Date(new Date(cursor) - 86400000).toISOString().slice(0, 10);
    } else break;
  }
  return count;
}

function addCoins(n) {
  const earned = n * (isBoostActive() ? 2 : 1);
  const total  = getCoins() + earned;
  localStorage.setItem(COIN_KEY, String(total));
  pushProfile({ coins: total });
  return earned;
}

/** Returns { state, coinsEarned, milestoneMsg, secretRecipe } */
export function performCheckin() {
  const s     = loadState();
  const today = todayStr();
  if (s.lastCheckin === today) return null; // already done

  const days = [...new Set([...(s.checkedDays || []), today])];
  s.checkedDays        = days;
  s.lastCheckin        = today;
  s.todayRewardClaimed = false;
  s.todayRewardType    = null;

  const streak = calcStreak(days);
  s.currentStreak = streak;
  s.longestStreak = Math.max(streak, s.longestStreak || 0);

  let milestoneMsg  = null;
  let secretRecipe  = null;
  let coinsEarned   = 0;

  if (streak === 7)  { coinsEarned  = addCoins(50);  milestoneMsg = '+50 coins — WEEK WARRIOR!'; }
  if (streak === 14) { s.boostExpiry = Date.now() + 86400000; milestoneMsg = 'COIN BOOST active for 24 hours!'; }
  if (streak === 21) { coinsEarned  = addCoins(150); milestoneMsg = '+150 coins — 3-WEEK LEGEND!'; }
  if (streak === 30) {
    secretRecipe = SECRET_RECIPES[Math.floor(Math.random() * SECRET_RECIPES.length)];
    s.unlockedRecipes = [...(s.unlockedRecipes || []), secretRecipe];
    milestoneMsg = `Secret recipe unlocked: ${secretRecipe}!`;
  }

  saveState(s);
  return { state: s, streak, coinsEarned, milestoneMsg, secretRecipe };
}

/** Returns { msg, coinsEarned } */
export function claimReward(type) {
  const s      = loadState();
  const streak = s.currentStreak || 1;
  let msg = '';
  let coinsEarned = 0;

  if (type === 'coins') {
    coinsEarned = addCoins(streakCoins(streak));
    msg = `+${coinsEarned} coins added to your wallet!`;
  } else if (type === 'boost') {
    s.boostExpiry = Date.now() + 3600000;
    msg = 'COIN BOOST active — 2× coins for the next hour!';
  } else if (type === 'recipe') {
    const recipe = SECRET_RECIPES[Math.floor(Math.random() * SECRET_RECIPES.length)];
    s.unlockedRecipes = [...(s.unlockedRecipes || []), recipe];
    msg = `Unlocked: "${recipe}" — check your cookbook!`;
  }
  s.todayRewardClaimed = true;
  s.todayRewardType    = type;
  saveState(s);
  return { msg, coinsEarned };
}

/** Returns updated state or null if photo already uploaded today */
export function logPhotoUpload() {
  const s     = loadState();
  const today = todayStr();
  if (s.lastPhotoDate === today) return null;

  const photos = [...new Set([...(s.photoUploads || []), today])];
  s.photoUploads  = photos;
  s.lastPhotoDate = today;
  s.photoStreak   = calcStreak(photos);
  const earned    = addCoins(15);
  saveState(s);
  return { state: s, earned };
}

export function activateStreakProtection() {
  const s = loadState();
  s.restaurantLastCheckin       = todayStr();
  s.restaurantStreakProtected   = true;
  addCoins(5);
  saveState(s);
}

export function getRestaurantStreak() {
  const s    = loadState();
  let days   = [];
  try { days = JSON.parse(localStorage.getItem('dig_in_restaurant_checkins') || '[]'); }
  catch { /* ignore */ }
  if (s.restaurantLastCheckin) days.push(s.restaurantLastCheckin);
  return calcStreak([...new Set(days)].sort());
}

export function buildCalendarCells(checkedDays = [], photoUploads = []) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const today = todayStr();
  const daySet   = new Set(checkedDays);
  const photoSet = new Set(photoUploads);
  const MONTHS   = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                    'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ empty: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({
      day: d, dateStr,
      isToday:     dateStr === today,
      isChecked:   daySet.has(dateStr),
      hasPhoto:    photoSet.has(dateStr),
      isFuture:    dateStr > today,
      isMilestone: [7, 14, 21, 30].includes(d),
    });
  }
  return { cells, title: `${MONTHS[month]} ${year}` };
}
