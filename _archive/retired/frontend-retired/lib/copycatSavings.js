/* copycatSavings.js — the money math behind the Copycat Lab.

   The whole pitch: people stay loyal to a chain because the drink is identical
   every time (consistency), and they pay a big markup for that. Reverse-engineer
   the exact formula and the consistency is yours — so the only thing left to
   quantify is the markup you stop paying. This turns any drink in the knowledge
   base into: store price vs. real at-home cost, savings per drink, and the
   annualized number that actually changes behavior.

   Home costs are honest per-serving estimates for making it yourself (beans,
   milk, syrup, etc. bought at grocery prices) — a guide, not accounting. Tune
   HOME_COST as ingredient prices move. */

import { DRINK_DB } from '../pages/DrinkScan/drinkKnowledgeBase';

// Per-serving at-home cost (USD) to reproduce the drink, by DB key.
const HOME_COST = {
  'caramel-macchiato': 0.95,
  'pink-drink': 1.05,
  'pumpkin-spice': 1.15,
  'dulce-de-leche': 1.10,
  'golden-eagle': 1.20,
  'dunkin-cold-brew': 0.55,
  'orange-dream': 1.60,
  'vanilla-sweet-cream-cold-brew': 0.85,
  'brown-sugar-oatmilk-shaken-espresso': 0.95,
  'white-chocolate-mocha': 1.10,
  'iced-matcha-latte': 1.05,
  'dragon-drink': 1.00,
  'dunkin-caramel-craze': 0.95,
  'dutch-annihilator': 1.25,
  'peppermint-mocha': 1.05,
  'eggnog-latte': 1.25,
  'homemade-chai-latte': 0.70,
  'classic-frappuccino': 0.90,
  'gingerbread-latte': 1.00,
};

// Fallback when a drink has no explicit estimate: espresso/dairy drinks land
// around a dollar a serving made at home.
const DEFAULT_HOME_COST = 1.10;
const DEFAULT_STORE_PRICE = 5.45;

const SIZE_ORDER = ['12oz', '16oz', '24oz'];

/** The "default" store price we compare against — the mid (16oz) size if present. */
export function storePrice(drink) {
  if (!drink?.sizePrices) return DEFAULT_STORE_PRICE;
  if (drink.sizePrices['16oz'] != null) return drink.sizePrices['16oz'];
  const first = SIZE_ORDER.find(s => drink.sizePrices[s] != null);
  return first ? drink.sizePrices[first] : DEFAULT_STORE_PRICE;
}

export function homeCost(key) {
  return HOME_COST[key] ?? DEFAULT_HOME_COST;
}

/** Savings for one drink: store markup you stop paying. */
export function savingsPerDrink(key) {
  const drink = DRINK_DB[key];
  return Math.max(0, storePrice(drink) - homeCost(key));
}

/** Markup multiple — "the store charges Nx what it costs you." */
export function markupMultiple(key) {
  const hc = homeCost(key);
  if (!hc) return 0;
  return storePrice(DRINK_DB[key]) / hc;
}

/** Project savings over time from how often you buy it. */
export function projectSavings(key, drinksPerWeek) {
  const per = savingsPerDrink(key);
  const weekly = per * drinksPerWeek;
  return {
    perDrink: per,
    weekly,
    monthly: weekly * 4.345,   // avg weeks per month
    yearly: weekly * 52,
    fiveYear: weekly * 52 * 5,
  };
}

/* Same projection from raw store/home prices — for food copycats, which carry
   their own storePrice + homeCost rather than living in DRINK_DB. */
export function projectValues(store, home, drinksPerWeek) {
  const per = Math.max(0, (store || 0) - (home || 0));
  const weekly = per * drinksPerWeek;
  return { perDrink: per, weekly, monthly: weekly * 4.345, yearly: weekly * 52, fiveYear: weekly * 52 * 5 };
}

export function formatMoney(n) {
  return `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Round, punchy version for big hero numbers ($1,240).
export function formatMoneyRound(n) {
  return `$${Math.round(n || 0).toLocaleString('en-US')}`;
}

/* A concrete "what your money could be instead" line, scaled to the annual
   number — reframes the abstract savings as something the user actually wants,
   which is the whole point ("save the money for stuff you want to do later"). */
export function savingsReframe(yearly) {
  if (yearly >= 1500) return 'a round-trip flight somewhere you’ve never been';
  if (yearly >= 900)  return 'a month of groceries, on the house';
  if (yearly >= 500)  return 'a new phone, paid in full';
  if (yearly >= 250)  return 'a really good pair of shoes and dinner out';
  if (yearly >= 100)  return 'a week of lunches you didn’t have to think about';
  return 'gas money that stays in your pocket';
}
