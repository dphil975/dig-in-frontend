/* ════════════════════════════════════════════════════════════
   The dense metros the app knows by name, and the ZIP → metro lookup.

   Pure data, split out of localFlavor.js: the sidebar only needs a city label
   for a ZIP, and importing localFlavor for it pulled the commute planner, the
   budget engine and the store dataset into every page load.
   ════════════════════════════════════════════════════════════ */

export const DENSE_METROS = [
  { zip3: [100, 101, 102, 103, 104], city: 'New York',     keywords: ['bagel', 'deli', 'pizza', 'bacon egg and cheese', 'halal', 'pastrami'] },
  { zip3: [21, 22],                  city: 'Boston',       keywords: ['clam chowder', 'lobster roll', 'chowder'] },
  { zip3: [191],                     city: 'Philadelphia', keywords: ['cheesesteak', 'soft pretzel', 'hoagie'] },
  { zip3: [200, 201, 202, 203, 204, 205], city: 'Washington D.C.', keywords: ['half smoke', 'mumbo sauce', 'chili bowl'] },
  { zip3: [331, 332, 333],           city: 'Miami',        keywords: ['cuban sandwich', 'croqueta', 'cafecito', 'plantain'] },
  { zip3: [606, 607, 608],           city: 'Chicago',      keywords: ['deep dish', 'italian beef', 'hot dog'] },
  { zip3: [700, 701],                city: 'New Orleans',  keywords: ['gumbo', 'po boy', 'beignet', 'jambalaya'] },
  { zip3: [750, 751, 752],           city: 'Dallas',       keywords: ['brisket', 'tex-mex', 'queso'] },
  { zip3: [900, 901, 902],           city: 'Los Angeles',  keywords: ['taco', 'birria', 'poke', 'avocado toast'] },
  { zip3: [941],                     city: 'San Francisco', keywords: ['sourdough', 'dim sum', 'burrito'] },
  { zip3: [981],                     city: 'Seattle',      keywords: ['salmon', 'teriyaki', 'coffee'] },
];

export function toZip3(zip) {
  const digits = String(zip || '').replace(/\D/g, '');
  if (digits.length < 3) return null;
  return parseInt(digits.slice(0, 3), 10);
}

/** Which dense metro a ZIP falls in, or null when it isn't one of the cores
    this app knows by name — an honest "no local flavor data here yet." */
export function metroForZip(zip) {
  const z3 = toZip3(zip);
  if (z3 == null) return null;
  return DENSE_METROS.find((m) => m.zip3.includes(z3)) || null;
}
