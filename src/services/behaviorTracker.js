// Re-export shim — behavior tracking now lives in lib/analytics.
export {
  recordDeparture,
  recordCheckin,
  recordRecipeView,
  getPredictedDepartureHour,
  formatDepartureHint,
  getTrafficLabelForHour,
  getCuisinePreferences,
  getRecommendedRecipes,
  getRecentRestaurants,
} from '../lib/analytics';
