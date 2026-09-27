// Re-export shim — check-in logic now lives in geoService.
export {
  SECRET_RECIPES,
  loadCheckinState as loadState,
  todayStr,
  getCoins,
  isBoostActive,
  boostRemainingMins,
  streakCoins,
  calcStreak,
  performCheckin,
  claimReward,
  logPhotoUpload,
  activateStreakProtection,
  getRestaurantStreak,
  buildCalendarCells,
} from './geoService';
