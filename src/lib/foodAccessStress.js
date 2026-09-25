/* foodAccessStress — an AREA-LEVEL index of how hard it is to reliably feed a
   household in a given borough / county.

   The insight this encodes (from the Alaska research): a headline median income
   overstates the food budget that's actually available. Where imported food
   costs 40%+ more, where food-insecurity is high, and where a community depends
   on a single store, the same dollar buys far less — so "the money they have is
   spent on surviving." We model that HONESTLY and at the AREA level only:

     effective (cost-adjusted) income = income / foodCostPremium
     stress = blend of income depth, food-insecurity rate, and food-cost premium

   We deliberately DO NOT model individual behavior (addiction spending, under-
   reporting). That would be stigmatizing and unmeasurable per-person. Where those
   pressures are real (rural AK, remote communities), they show up in the public
   inputs we do use — high cost premium, high insecurity, single-store access —
   and are described in prose, never as a fabricated number.

   All inputs are documented estimates, not a live feed. */

// Food cost premium vs the US average grocery basket (US avg = 1.00), by borough
// id — grocery-specific cost indices (MERIC/BLS-style), NOT overall cost of
// living. Alaska's imported-food premium is the standout; the NY-metro boroughs
// and coastal Northeast run high; the South and Mountain-West run below average.
// Honest estimates, not a live feed. Anything absent defaults to 1.0.
export const FOOD_COST_PREMIUM = {
  // NY metro + Northeast (higher)
  manhattan: 1.25, brooklyn: 1.16, queens: 1.14, bronx: 1.13, 'staten-island': 1.12,
  nassau: 1.15, suffolk: 1.14, westchester: 1.16, rockland: 1.14, 'ny-metro': 1.14,
  'upstate-ny': 1.05, 'new-jersey': 1.08, connecticut: 1.09, massachusetts: 1.07,
  'new-hampshire': 1.05, 'rhode-island': 1.05, vermont: 1.06, maine: 1.06,
  maryland: 1.06, dc: 1.10, delaware: 1.03, virginia: 1.00, 'west-virginia': 0.97,
  // South (lower, except FL)
  'south-carolina': 0.98, 'north-carolina': 0.97, georgia: 0.97, florida: 1.03,
  tennessee: 0.96, alabama: 0.97, mississippi: 0.96, louisiana: 0.98, kentucky: 0.96,
  // Plains / Mountain West / Pacific
  texas: 0.95, oklahoma: 0.95, arkansas: 0.94, arizona: 0.99, colorado: 1.02,
  idaho: 0.96, montana: 1.03, nevada: 1.03, new_mexico: 0.99, california: 1.08,
  washington: 1.03, oregon: 1.01, hawaii: 1.55, alaska: 1.35,
  // Puerto Rico: shipping-dependent island economy. Studies genuinely disagree
  // on the size of the effect (a Walmart market-basket study found near-parity
  // with Jacksonville, FL, while other analyses put San Juan food costs far
  // above mainland) — using the more conservative, broadly-cited "cost of
  // living ~13% above mainland average" figure rather than the high-end claims.
  puerto_rico: 1.13,
};

// Direct food-insecurity % for areas where the real rate meaningfully diverges
// from what income alone predicts (Feeding America-style). Absent → estimated
// from income. Statewide figures — rural pockets (esp. AK, NM) run far higher.
export const FOOD_INSECURITY = {
  mississippi: 17, arkansas: 16.5, louisiana: 16, new_mexico: 16, alabama: 15,
  texas: 15, oklahoma: 15, kentucky: 15, 'west-virginia': 15, tennessee: 14,
  'north-carolina': 14, alaska: 14, 'south-carolina': 13.5, georgia: 13,
  florida: 13, nevada: 13, arizona: 12, hawaii: 12, california: 11,
  // Puerto Rico isn't covered by Feeding America's Map the Meal Gap (territories
  // excluded), so this isn't apples-to-apples with the state figures above. PR's
  // own household surveys (Instituto de Estadísticas / ESefam) report food
  // insecurity in the 30-50% range using a different methodology — using the
  // low end of that band rather than the high end to stay conservative.
  puerto_rico: 30,
};

// A US-average food-insecurity rate to normalize against (~Feeding America).
const US_INSECURITY = 13;

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** Estimate an area's food-insecurity % from its median income when no direct
    figure is supplied (poorer areas trend higher). Bounded to a realistic band. */
export function estimateInsecurity(income) {
  if (income == null) return US_INSECURITY;
  return clamp(9 + (75000 - income) / 3500, 5, 32);
}

/**
 * Area food-access stress.
 * @param income        median household income for the area
 * @param opts.costPremium   food-cost premium vs US avg (default from table / 1.0)
 * @param opts.insecurityPct direct food-insecurity % if known (else estimated)
 * @param opts.boroughId     used to look up a default cost premium
 * @returns { score 0-100, level, label, color, costAdjustedIncome, insecurityPct, factors }
 */
export function foodAccessStress(income, opts = {}) {
  const costPremium = opts.costPremium ?? FOOD_COST_PREMIUM[opts.boroughId] ?? 1.0;
  const insecurityPct = opts.insecurityPct ?? FOOD_INSECURITY[opts.boroughId] ?? estimateInsecurity(income);

  // Sub-scores, each 0–100.
  const incomeStress     = clamp((90000 - (income ?? 75000)) / 600, 0, 100); // $90k→0, $30k→100
  const costStress       = clamp((costPremium - 1.0) / 0.006, 0, 100);        // 1.0→0, 1.6×→100
  const insecurityStress = clamp((insecurityPct - 8) / 0.24, 0, 100);         // 8%→0, 32%→100

  const score = Math.round(0.45 * incomeStress + 0.30 * insecurityStress + 0.25 * costStress);
  const costAdjustedIncome = income != null ? Math.round(income / costPremium) : null;

  return {
    score,
    ...stressLevel(score),
    costAdjustedIncome,
    insecurityPct: Math.round(insecurityPct),
    costPremium,
    factors: {
      income: Math.round(incomeStress),
      insecurity: Math.round(insecurityStress),
      cost: Math.round(costStress),
    },
  };
}

export function stressLevel(score) {
  if (score >= 65) return { level: 'severe',   label: 'Severe',   color: '#C8001E' };
  if (score >= 45) return { level: 'elevated', label: 'Elevated', color: '#E86A2E' };
  if (score >= 25) return { level: 'moderate', label: 'Moderate', color: '#f4a924' };
  return { level: 'low', label: 'Low', color: '#2e7d32' };
}

/** One-line reason naming the dominant driver(s), for a caption. */
export function stressReason(result) {
  const f = result.factors;
  const parts = [];
  if (f.cost >= 40) parts.push('high food costs');
  if (f.income >= 45) parts.push('low incomes');
  if (f.insecurity >= 45) parts.push('high food insecurity');
  if (!parts.length) {
    if (f.income >= 25) parts.push('moderate incomes');
    else return 'food is broadly affordable and accessible here';
  }
  return parts.join(' + ');
}
