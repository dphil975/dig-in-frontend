/* liveDeals.js — sample "today's deals" data, moved here from the old Home-
   page map hub so it can live next to FoodMap instead of a second, removed
   map. Each deal lists the specific stores (name + coords) currently
   carrying it — a small, hand-curated NYC sample, not a live feed. */
export const LIVE_DEALS = [
  {
    id: 'eggs', store: 'Bodega', badge: '2 for $1', title: 'Eggs (per pair)', accent: '#f4a924',
    available: {
      manhattan: [
        { name: 'East Village Bodega', address: '145 Avenue A, New York, NY', lat: 40.7264, lng: -73.9825 },
        { name: 'Harlem Corner Store', address: '2320 Frederick Douglass Blvd, NY', lat: 40.8112, lng: -73.9534 },
      ],
      brooklyn: [
        { name: 'Nostrand Ave Bodega', address: '432 Nostrand Ave, Brooklyn, NY', lat: 40.6828, lng: -73.9499 },
      ],
      bronx: [
        { name: 'Fordham Bodega', address: '2890 Jerome Ave, Bronx, NY', lat: 40.8520, lng: -73.8997 },
      ],
    },
  },
  {
    id: 'bananas', store: 'Corner Store', badge: '3 for $1', title: 'Bananas (ripe)', accent: '#ffe07a',
    available: {
      brooklyn: [
        { name: 'Atlantic Ave Market', address: '789 Atlantic Ave, Brooklyn, NY', lat: 40.6835, lng: -73.9790 },
        { name: 'Flatbush Corner Store', address: '1200 Flatbush Ave, Brooklyn, NY', lat: 40.6451, lng: -73.9530 },
      ],
      queens: [
        { name: 'Jackson Heights Market', address: '37-01 82nd St, Jackson Heights, NY', lat: 40.7489, lng: -73.8830 },
      ],
    },
  },
  {
    id: 'milk', store: 'Grocery', badge: '½ gal $2', title: 'Milk (store brand)', accent: '#7ae0b0',
    available: {
      manhattan: [
        { name: 'UWS Associated', address: '2665 Broadway, New York, NY', lat: 40.7986, lng: -73.9680 },
      ],
      brooklyn: [
        { name: 'Park Slope Key Food', address: '782 Union St, Brooklyn, NY', lat: 40.6733, lng: -73.9782 },
        { name: 'Flatbush Key Food', address: '1416 Flatbush Ave, Brooklyn, NY', lat: 40.6337, lng: -73.9543 },
      ],
      queens: [
        { name: 'Flushing Grocery', address: '136-20 Roosevelt Ave, Flushing, NY', lat: 40.7592, lng: -73.8303 },
      ],
      bronx: [
        { name: 'Tremont C-Town', address: '2523 E Tremont Ave, Bronx, NY', lat: 40.8375, lng: -73.8558 },
      ],
    },
  },
  {
    id: 'bread', store: 'Bodega', badge: '$1.49', title: 'White bread loaf', accent: '#ff9eb5',
    available: {
      manhattan: [
        { name: 'Washington Hts Bodega', address: '501 W 181st St, New York, NY', lat: 40.8490, lng: -73.9365 },
      ],
      bronx: [
        { name: 'South Bronx Bodega', address: '430 E 149th St, Bronx, NY', lat: 40.8165, lng: -73.9200 },
        { name: 'Kingsbridge Deli', address: '3255 Kingsbridge Ave, Bronx, NY', lat: 40.8760, lng: -73.9000 },
      ],
    },
  },
  {
    id: 'tomatoes', store: 'Corner Store', badge: '4 for $2', title: 'Roma tomatoes', accent: '#f4a924',
    available: {
      brooklyn: [
        { name: 'Bushwick Corner Store', address: '1045 Myrtle Ave, Brooklyn, NY', lat: 40.6969, lng: -73.9371 },
      ],
      queens: [
        { name: 'Astoria Market', address: '3102 31st Ave, Astoria, NY', lat: 40.7700, lng: -73.9263 },
        { name: 'Corona Produce', address: '103-12 Roosevelt Ave, Corona, NY', lat: 40.7467, lng: -73.8642 },
      ],
    },
  },
  {
    id: 'garlic', store: 'Grocery', badge: '$0.99/head', title: 'Garlic bulb', accent: '#ffe07a',
    available: {
      manhattan: [
        { name: 'Chinatown Market', address: '80 Mott St, New York, NY', lat: 40.7154, lng: -73.9982 },
        { name: 'LES Grocery', address: '185 Orchard St, New York, NY', lat: 40.7196, lng: -73.9888 },
      ],
      queens: [
        { name: 'Flushing Fresh Market', address: '41-82 Main St, Flushing, NY', lat: 40.7580, lng: -73.8318 },
      ],
      'staten-island': [
        { name: 'Victory Blvd Grocery', address: '2425 Victory Blvd, Staten Island, NY', lat: 40.5993, lng: -74.1421 },
      ],
    },
  },
];

/** Flat list of every {deal, name, address, lat, lng} location across all deals —
 * used to match against whichever real store dataset is currently loaded. */
export const LIVE_DEAL_LOCATIONS = LIVE_DEALS.flatMap(deal =>
  Object.values(deal.available).flat().map(loc => ({ deal, ...loc })),
);
