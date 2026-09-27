/* Shared store dataset — every plotted point for the Food Map + ledger.
   Compiled from the home map's Long Island set and the live-deal store
   locations across the five boroughs.

   acceptsSNAP / acceptsWIC are seeded by hand, not pulled from a live USDA
   SNAP retailer feed (this app doesn't have one wired in) — set per
   realistic judgment: virtually every NYC food retailer, bodegas included,
   is SNAP/EBT-authorized, so that's true almost everywhere. WIC has a much
   stricter vendor stocking requirement (minimum shelf coverage of specific
   WIC-approved brands/sizes), which most full-service supermarkets meet
   and most small bodegas/corner stores don't — hence WIC is mixed. */

export const NYC_STORES = [
  // ── Manhattan ──
  { id: 'tj-59',   name: "Trader Joe's",          type: 'grocery',      lat: 40.7590, lng: -73.9616, address: '405 E 59th St, NY',            borough: 'manhattan',     acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'wf-3av',  name: 'Whole Foods Market',    type: 'grocery',      lat: 40.7358, lng: -73.9866, address: '155 3rd Ave, NY',              borough: 'manhattan',     acceptsSNAP: true,  acceptsWIC: false },
  { id: 'aldi-2',  name: 'Aldi',                  type: 'grocery',      lat: 40.7626, lng: -73.9649, address: '1140 2nd Ave, NY',             borough: 'manhattan',     acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'kf-aveA', name: 'Key Food',              type: 'grocery',      lat: 40.7245, lng: -73.9840, address: '52 Avenue A, NY',              borough: 'manhattan',     acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'ev-bod',  name: 'East Village Bodega',   type: 'bodega',       lat: 40.7264, lng: -73.9825, address: '145 Avenue A, NY',             borough: 'manhattan',     acceptsSNAP: true,  acceptsWIC: false },
  { id: 'harlem',  name: 'Harlem Corner Store',   type: 'corner_store', lat: 40.8112, lng: -73.9534, address: '2320 Frederick Douglass Blvd', borough: 'manhattan',     acceptsSNAP: true,  acceptsWIC: false },
  { id: 'uws',     name: 'UWS Associated',        type: 'grocery',      lat: 40.7986, lng: -73.9680, address: '2665 Broadway, NY',            borough: 'manhattan',     acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'chinatown', name: 'Chinatown Market',    type: 'grocery',      lat: 40.7154, lng: -73.9982, address: '80 Mott St, NY',               borough: 'manhattan',     acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'les',     name: 'LES Grocery',           type: 'grocery',      lat: 40.7196, lng: -73.9888, address: '185 Orchard St, NY',           borough: 'manhattan',     acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'wh-bod',  name: 'Washington Hts Bodega', type: 'bodega',       lat: 40.8490, lng: -73.9365, address: '501 W 181st St, NY',           borough: 'manhattan',     acceptsSNAP: true,  acceptsWIC: false },

  // ── Brooklyn ──
  { id: 'ss-atl',  name: 'Stop & Shop',           type: 'grocery',      lat: 40.6840, lng: -73.9770, address: '625 Atlantic Ave, Bklyn',      borough: 'brooklyn',      acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'ps-kf',   name: 'Park Slope Key Food',   type: 'grocery',      lat: 40.6733, lng: -73.9782, address: '782 Union St, Bklyn',          borough: 'brooklyn',      acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'fb-kf',   name: 'Flatbush Key Food',     type: 'grocery',      lat: 40.6337, lng: -73.9543, address: '1416 Flatbush Ave, Bklyn',      borough: 'brooklyn',      acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'nostrand',name: 'Nostrand Ave Bodega',   type: 'bodega',       lat: 40.6828, lng: -73.9499, address: '432 Nostrand Ave, Bklyn',       borough: 'brooklyn',      acceptsSNAP: true,  acceptsWIC: false },
  { id: 'atl-mkt', name: 'Atlantic Ave Market',   type: 'corner_store', lat: 40.6835, lng: -73.9790, address: '789 Atlantic Ave, Bklyn',       borough: 'brooklyn',      acceptsSNAP: true,  acceptsWIC: false },
  { id: 'flatbush',name: 'Flatbush Corner Store',  type: 'corner_store', lat: 40.6451, lng: -73.9530, address: '1200 Flatbush Ave, Bklyn',      borough: 'brooklyn',      acceptsSNAP: true,  acceptsWIC: false },
  { id: 'bushwick',name: 'Bushwick Corner Store',  type: 'corner_store', lat: 40.6969, lng: -73.9371, address: '1045 Myrtle Ave, Bklyn',        borough: 'brooklyn',      acceptsSNAP: true,  acceptsWIC: false },

  // ── Queens ──
  { id: 'jh-mkt',  name: 'Jackson Heights Market', type: 'corner_store', lat: 40.7489, lng: -73.8830, address: '37-01 82nd St, Queens',         borough: 'queens',        acceptsSNAP: true,  acceptsWIC: false },
  { id: 'flushing',name: 'Flushing Grocery',      type: 'grocery',      lat: 40.7592, lng: -73.8303, address: '136-20 Roosevelt Ave, Queens', borough: 'queens',        acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'astoria', name: 'Astoria Market',        type: 'corner_store', lat: 40.7700, lng: -73.9263, address: '3102 31st Ave, Astoria',        borough: 'queens',        acceptsSNAP: true,  acceptsWIC: false },
  { id: 'corona',  name: 'Corona Produce',        type: 'corner_store', lat: 40.7467, lng: -73.8642, address: '103-12 Roosevelt Ave, Corona', borough: 'queens',        acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'flush-fm',name: 'Flushing Fresh Market', type: 'grocery',      lat: 40.7580, lng: -73.8318, address: '41-82 Main St, Flushing',       borough: 'queens',        acceptsSNAP: true,  acceptsWIC: true  },

  // ── The Bronx ──
  { id: 'fordham', name: 'Fordham Bodega',        type: 'bodega',       lat: 40.8520, lng: -73.8997, address: '2890 Jerome Ave, Bronx',        borough: 'bronx',         acceptsSNAP: true,  acceptsWIC: false },
  { id: 'tremont', name: 'Tremont C-Town',        type: 'grocery',      lat: 40.8375, lng: -73.8558, address: '2523 E Tremont Ave, Bronx',     borough: 'bronx',         acceptsSNAP: true,  acceptsWIC: true  },
  { id: 'sbronx',  name: 'South Bronx Bodega',    type: 'bodega',       lat: 40.8165, lng: -73.9200, address: '430 E 149th St, Bronx',         borough: 'bronx',         acceptsSNAP: true,  acceptsWIC: false },
  { id: 'kingsbr', name: 'Kingsbridge Deli',      type: 'bodega',       lat: 40.8760, lng: -73.9000, address: '3255 Kingsbridge Ave, Bronx',   borough: 'bronx',         acceptsSNAP: true,  acceptsWIC: false },

  // ── Staten Island ──
  { id: 'victory', name: 'Victory Blvd Grocery',  type: 'grocery',      lat: 40.5993, lng: -74.1421, address: '2425 Victory Blvd, SI',         borough: 'staten-island', acceptsSNAP: true,  acceptsWIC: true  },
];

// Nine store categories plotted on the Food Map. The first three are the
// original NYC set; the rest were added for the full NJ/PA dataset (delis,
// specialty/farm stands, and the international markets — grouped Asian,
// African/Caribbean, Middle Eastern/Halal, Latino). Colors are picked for
// separation on the map; StoreMiniMap falls back to grocery green for any
// unknown type, so adding a type here is all that's needed to plot it.
export const STORE_COLORS = {
  grocery:        '#7DAE5C',   // green
  corner_store:   '#FFCF6B',   // amber
  bodega:         '#FF6D8B',   // pink
  deli:           '#5B8DEF',   // blue
  specialty:      '#A06CD5',   // purple
  asian:          '#E4572E',   // vermillion
  african:        '#00A6A6',   // teal
  middle_eastern: '#C9A227',   // gold
  latino:         '#FF8C42',   // coral
  south_asian:    '#B5179E',   // magenta
  rmp:            '#8A8D91',   // slate — SNAP Restaurant Meals Program (prepared meals, not groceries)
};
export const STORE_TYPE_LABELS = {
  grocery:        'Grocery',
  corner_store:   'Corner Store',
  bodega:         'Bodega',
  deli:           'Deli',
  specialty:      'Specialty',
  asian:          'Asian',
  african:        'African / Caribbean',
  middle_eastern: 'Middle Eastern / Halal',
  latino:         'Latino',
  south_asian:    'South Asian / Desi',
  rmp:            'SNAP Restaurant (RMP)',
};

// Every NYC borough is coextensive with a county — listed together so the
// picker can be searched by either name (e.g. "kings" -> Brooklyn). Also
// includes every other county actually plotted in public/stores.json
// (Nassau/Suffolk/Westchester/Rockland, plus a catch-all "NY Metro" bucket
// the source data itself uses for a handful of stores it didn't otherwise
// place), plus New Jersey (public/stores-nj.json), Pennsylvania
// (public/stores-pa.json), Connecticut (public/stores-ct.json),
// Massachusetts (public/stores-ma.json), New Hampshire
// (public/stores-nh.json), Rhode Island (public/stores-ri.json), Vermont
// (public/stores-vt.json), Maine (public/stores-me.json), Virginia
// (public/stores-va.json), Delaware (public/stores-de.json), Maryland
// (public/stores-md.json), West Virginia (public/stores-wv.json), Washington
// D.C. (public/stores-dc.json) and Upstate New York (public/stores-nyup.json —
// the 62 counties outside NYC, lat >= 41.35 so no overlap with stores.json),
// South Carolina (public/stores-sc.json), North Carolina (public/stores-nc.json),
// Georgia (public/stores-ga.json), Florida (public/stores-fl.json), Tennessee
// (public/stores-tn.json), Alabama (public/stores-al.json), Mississippi
// (public/stores-ms.json), Louisiana (public/stores-la.json), Kentucky
// (public/stores-ky.json), Texas (public/stores-tx.json) and Oklahoma
// (public/stores-ok.json), so nothing in the
// dataset is unreachable from the dropdown. State-level entries also carry
// `income` (median household income) — see COUNTY_INCOME / incomeTier below.
export const BOROUGHS = [
  { id: 'manhattan',      label: 'Manhattan',      county: 'New York County',   center: [40.7831, -73.9712] },
  { id: 'brooklyn',       label: 'Brooklyn',       county: 'Kings County',      center: [40.6782, -73.9442] },
  { id: 'queens',         label: 'Queens',         county: 'Queens County',     center: [40.7282, -73.7949] },
  { id: 'bronx',          label: 'The Bronx',      county: 'Bronx County',      center: [40.8448, -73.8648] },
  { id: 'staten-island',  label: 'Staten Island',  county: 'Richmond County',   center: [40.5795, -74.1502] },
  { id: 'nassau',         label: 'Nassau',         county: 'Nassau County',     center: [40.7125, -73.6228] },
  { id: 'suffolk',        label: 'Suffolk',        county: 'Suffolk County',    center: [40.8116, -73.1853] },
  { id: 'westchester',    label: 'Westchester',    county: 'Westchester County',center: [40.9969, -73.8275] },
  { id: 'rockland',       label: 'Rockland',       county: 'Rockland County',   center: [41.0624, -74.0150] },
  { id: 'ny-metro',       label: 'NY Metro Area',  county: 'Other NY Metro',    center: [41.0030, -74.0549] },
  { id: 'new-jersey',     label: 'New Jersey',     county: 'New Jersey',        center: [40.2000, -74.5000], income: 97126 },
  { id: 'pennsylvania',   label: 'Pennsylvania',   county: 'Pennsylvania',      center: [40.2732, -76.8867], income: 73170 },
  { id: 'connecticut',    label: 'Connecticut',    county: 'Connecticut',       center: [41.6032, -72.7000], income: 90213 },
  { id: 'massachusetts',  label: 'Massachusetts',  county: 'Massachusetts',      center: [42.2373, -71.5314], income: 96505 },
  { id: 'new-hampshire',  label: 'New Hampshire',  county: 'New Hampshire',      center: [43.6000, -71.5000], income: 90845 },
  { id: 'rhode-island',   label: 'Rhode Island',   county: 'Rhode Island',      center: [41.7000, -71.5000], income: 81854 },
  { id: 'vermont',        label: 'Vermont',        county: 'Vermont',           center: [44.0000, -72.7000], income: 74014 },
  { id: 'maine',          label: 'Maine',          county: 'Maine',             center: [45.2500, -69.0000], income: 68251 },
  { id: 'virginia',       label: 'Virginia',       county: 'Virginia',          center: [37.5000, -78.5000], income: 87249 },
  { id: 'delaware',       label: 'Delaware',       county: 'Delaware',          center: [39.0000, -75.5000], income: 79325 },
  { id: 'maryland',       label: 'Maryland',       county: 'Maryland',          center: [39.0000, -76.7000], income: 98461 },
  { id: 'west-virginia',  label: 'West Virginia',  county: 'West Virginia',     center: [38.6000, -80.5000], income: 57917 },
  { id: 'dc',             label: 'Washington, D.C.', county: 'District of Columbia', center: [38.9050, -77.0300], income: 101027 },
  { id: 'upstate-ny',     label: 'Upstate New York', county: 'Upstate New York', center: [42.9000, -76.0000], income: 71000 },
  { id: 'south-carolina', label: 'South Carolina',  county: 'South Carolina',    center: [33.8000, -80.9000], income: 63623 },
  { id: 'north-carolina', label: 'North Carolina',  county: 'North Carolina',    center: [35.5000, -79.4000], income: 66186 },
  { id: 'georgia',        label: 'Georgia',         county: 'Georgia',           center: [32.9000, -83.5000], income: 71355 },
  { id: 'florida',        label: 'Florida',         county: 'Florida',           center: [28.4000, -81.5000], income: 77687 },
  { id: 'tennessee',      label: 'Tennessee',       county: 'Tennessee',         center: [35.8000, -86.4000], income: 64035 },
  { id: 'alabama',        label: 'Alabama',         county: 'Alabama',           center: [32.8000, -86.8000], income: 59609 },
  { id: 'mississippi',    label: 'Mississippi',     county: 'Mississippi',       center: [32.7000, -89.7000], income: 52985 },
  { id: 'louisiana',      label: 'Louisiana',       county: 'Louisiana',         center: [30.9000, -91.8000], income: 57852 },
  { id: 'kentucky',       label: 'Kentucky',        county: 'Kentucky',          center: [37.5000, -85.3000], income: 62417 },
  { id: 'texas',          label: 'Texas',           county: 'Texas',             center: [31.0000, -99.0000], income: 78476 },
  { id: 'oklahoma',       label: 'Oklahoma',        county: 'Oklahoma',          center: [35.5000, -97.5000], income: 61364 },
  { id: 'arkansas',       label: 'Arkansas',        county: 'Arkansas',          center: [34.8000, -92.2000], income: 58773 },
  { id: 'arizona',        label: 'Arizona',         county: 'Arizona',           center: [34.0000, -111.6000], income: 81404 },
  { id: 'colorado',       label: 'Colorado',        county: 'Colorado',          center: [39.0000, -105.5000], income: 92911 },
  { id: 'idaho',          label: 'Idaho',           county: 'Idaho',             center: [44.4000, -114.7000], income: 74636 },
  { id: 'montana',        label: 'Montana',         county: 'Montana',           center: [47.0000, -109.6000], income: 72509 },
  { id: 'nevada',         label: 'Nevada',          county: 'Nevada',            center: [39.5000, -117.0000], income: 71068 },
  { id: 'new_mexico',     label: 'New Mexico',      county: 'New Mexico',        center: [34.4000, -106.1000], income: 70575 },
  { id: 'alaska',         label: 'Alaska',          county: 'Alaska',            center: [63.0000, -151.0000], income: 89336 },
  { id: 'california',     label: 'California',      county: 'California',        center: [37.0000, -119.7000], income: 91905 },
  { id: 'washington',     label: 'Washington',      county: 'Washington',        center: [47.4000, -120.5000], income: 94952 },
  { id: 'oregon',         label: 'Oregon',          county: 'Oregon',            center: [44.0000, -120.5000], income: 76632 },
  { id: 'hawaii',         label: 'Hawaii',          county: 'Hawaii',            center: [20.7000, -156.5000], income: 92458 },
  { id: 'puerto_rico',    label: 'Puerto Rico',     county: 'Puerto Rico',       center: [18.2000, -66.5000],  income: 25096 },
];

/* Median household income by area, and how it maps to the kinds of stores a
   shopper there typically leans on. Income is attached to the state-level
   BOROUGHS entries above (state ACS medians); COUNTY_INCOME keeps the finer
   county figures from the source research for areas we have them, so a future
   county view can show the local number instead of the statewide one.

   incomeTier() buckets a median into budget / mid / premium, and
   TIER_STORE_AFFINITY says which of the 9 store types that tier over-indexes
   on — lower-income areas lean on discount grocery, corner stores and SNAP/WIC
   vendors; higher-income areas add specialty and international markets. The
   Food Map uses this to caption a selected state, and the Pantry uses it to
   bias recipe suggestions toward what's realistically affordable/available. */
export const COUNTY_INCOME = {
  virginia: [
    { county: 'Loudoun', median: 178707 }, { county: 'Fairfax', median: 150113 },
    { county: 'Stafford', median: 133792 }, { county: 'Arlington', median: 137670 },
    { county: 'Richmond City', median: 60600 }, { county: 'Highland', median: 36974 },
    { county: 'Norton', median: 32980 }, { county: 'Wise', median: 55270 },
  ],
  delaware: [
    { county: 'New Castle', median: 76500 }, { county: 'Sussex', median: 74312 },
    { county: 'Kent', median: 64479 },
  ],
  maryland: [
    { county: 'Howard', median: 149763 }, { county: 'Montgomery', median: 132450 },
    { county: 'Anne Arundel', median: 124911 }, { county: 'Charles', median: 122816 },
    { county: "Prince George's", median: 101798 }, { county: 'Baltimore County', median: 91768 },
    { county: 'Baltimore City', median: 62177 }, { county: 'Dorchester', median: 61839 },
    { county: 'Allegany', median: 59603 },
  ],
  'west-virginia': [
    { county: 'Jefferson', median: 98806 }, { county: 'Berkeley', median: 80815 },
    { county: 'Putnam', median: 79527 }, { county: 'Monongalia', median: 65346 },
    { county: 'Kanawha', median: 60943 }, { county: 'Cabell', median: 55832 },
    { county: 'Mingo', median: 38119 }, { county: 'McDowell', median: 31559 },
  ],
  // D.C. income varies most by ward, so COUNTY_INCOME holds wards here.
  dc: [
    { county: 'Ward 3', median: 157000 }, { county: 'Ward 6', median: 133590 },
    { county: 'Ward 2', median: 128000 }, { county: 'Ward 1', median: 126000 },
    { county: 'Ward 4', median: 115068 }, { county: 'Ward 5', median: 101000 },
    { county: 'Ward 7', median: 38000 }, { county: 'Ward 8', median: 32000 },
  ],
  'upstate-ny': [
    { county: 'Putnam', median: 120970 }, { county: 'Saratoga', median: 100787 },
    { county: 'Dutchess', median: 94578 }, { county: 'Rensselaer', median: 87915 },
    { county: 'Ulster', median: 86271 }, { county: 'Albany', median: 85333 },
    { county: 'Monroe', median: 76382 }, { county: 'Erie', median: 72839 },
    { county: 'Chautauqua', median: 58351 },
  ],
  'south-carolina': [
    { county: 'Beaufort', median: 84819 }, { county: 'Charleston', median: 84320 },
    { county: 'York', median: 83060 }, { county: 'Greenville', median: 74624 },
    { county: 'Richland', median: 61699 }, { county: 'Horry', median: 64623 },
    { county: 'Marlboro', median: 36293 }, { county: 'Marion', median: 34501 },
    { county: 'Allendale', median: 31603 },
  ],
  'north-carolina': [
    { county: 'Wake', median: 96734 }, { county: 'Union', median: 95533 },
    { county: 'Orange', median: 85785 }, { county: 'Chatham', median: 84222 },
    { county: 'Mecklenburg', median: 79265 }, { county: 'Durham', median: 74927 },
    { county: 'Guilford', median: 68642 },
  ],
  georgia: [
    { county: 'Forsyth', median: 143784 }, { county: 'Oconee', median: 121217 },
    { county: 'Fayette', median: 111978 }, { county: 'Cherokee', median: 108115 },
    { county: 'Cobb', median: 102738 }, { county: 'Fulton', median: 95292 },
    { county: 'Gwinnett', median: 87890 }, { county: 'DeKalb', median: 80644 },
  ],
  florida: [
    { county: 'St. Johns', median: 106169 }, { county: 'Santa Rosa', median: 88968 },
    { county: 'Collier', median: 86173 }, { county: 'Seminole', median: 83030 },
    { county: 'Palm Beach', median: 81115 }, { county: 'Orange', median: 77011 },
    { county: 'Hillsborough', median: 75011 }, { county: 'Broward', median: 74534 },
    { county: 'Miami-Dade', median: 65000 }, { county: 'Glades', median: 38905 },
  ],
  tennessee: [
    { county: 'Williamson', median: 125943 }, { county: 'Wilson', median: 89462 },
    { county: 'Sumner', median: 81883 }, { county: 'Rutherford', median: 78291 },
    { county: 'Davidson', median: 71863 }, { county: 'Knox', median: 68580 },
    { county: 'Clay', median: 39572 }, { county: 'Hancock', median: 31809 },
    { county: 'Lake', median: 32064 },
  ],
  alabama: [
    { county: 'Shelby', median: 97961 }, { county: 'Madison', median: 86499 },
    { county: 'Limestone', median: 83629 }, { county: 'Baldwin', median: 78775 },
    { county: 'Jefferson', median: 66388 }, { county: 'Tuscaloosa', median: 66231 },
    { county: 'Crenshaw', median: 48560 },
  ],
  kentucky: [
    { county: 'Oldham', median: 121491 }, { county: 'Spencer', median: 98333 },
    { county: 'Boone', median: 94752 }, { county: 'Jefferson', median: 67849 },
    { county: 'Fayette', median: 67631 }, { county: 'Bell', median: 32403 },
    { county: 'Owsley', median: 31064 }, { county: 'Wolfe', median: 29052 },
  ],
  texas: [
    { county: 'Collin', median: 110000 }, { county: 'Dallas', median: 95000 },
    { county: 'Harris', median: 92000 }, { county: 'Travis', median: 90000 },
    { county: 'Denton', median: 88000 }, { county: 'Newton', median: 42618 },
    { county: 'Starr', median: 37639 }, { county: 'Zavala', median: 36749 },
    { county: 'Swisher', median: 36165 },
  ],
  'rhode-island': [
    { county: 'Bristol', median: 110926 }, { county: 'Newport', median: 100859 },
    { county: 'Washington', median: 102478 }, { county: 'Kent', median: 91278 },
    { county: 'Providence', median: 78204 },
  ],
  vermont: [
    { county: 'Chittenden', median: 96759 }, { county: 'Addison', median: 89639 },
    { county: 'Essex', median: 59294 },
  ],
  maine: [
    { county: 'Cumberland', median: 92983 }, { county: 'York', median: 82904 },
    { county: 'Washington', median: 52237 }, { county: 'Aroostook', median: 54254 },
  ],
  oklahoma: [
    { county: 'Canadian', median: 78000 }, { county: 'Cleveland', median: 71000 },
    { county: 'Oklahoma', median: 68006 }, { county: 'Tulsa', median: 62000 },
    { county: 'Comanche', median: 55000 }, { county: 'Adair', median: 40000 },
    { county: 'Choctaw', median: 38000 }, { county: 'Pushmataha', median: 36000 },
  ],
  // Arizona research provided all 15 counties — kept in full (Cubit 2024 ACS).
  arizona: [
    { county: 'Maricopa', median: 89300 }, { county: 'Pinal', median: 80266 },
    { county: 'Coconino', median: 72966 }, { county: 'Greenlee', median: 71164 },
    { county: 'Pima', median: 70315 }, { county: 'Yavapai', median: 69613 },
    { county: 'Graham', median: 67325 }, { county: 'Yuma', median: 62876 },
    { county: 'Gila', median: 61986 }, { county: 'Cochise', median: 59742 },
    { county: 'Mohave', median: 57684 }, { county: 'Santa Cruz', median: 55217 },
    { county: 'Navajo', median: 54606 }, { county: 'La Paz', median: 49478 },
    { county: 'Apache', median: 41438 },
  ],
  // Arkansas: research gave Arkansas County ($53,164) firm; the rest are ACS
  // 5-yr medians for the counties named in the curated store rows (NW-AR wealth
  // vs. Delta poverty spread), so the income-tier features have real range.
  arkansas: [
    { county: 'Benton', median: 76500 }, { county: 'Saline', median: 74000 },
    { county: 'Pulaski', median: 59000 }, { county: 'Arkansas', median: 53164 },
    { county: 'Stone', median: 45000 }, { county: 'Mississippi', median: 44000 },
    { county: 'Randolph', median: 46000 }, { county: 'Desha', median: 40000 },
    { county: 'Phillips', median: 34000 },
  ],
  // Colorado research provided family income (runs higher than household); kept
  // as given (NIH HDPulse). Borough-level income above uses ACS household median
  // so cross-state comparison stays on one metric.
  colorado: [
    { county: 'Douglas', median: 171592 }, { county: 'Broomfield', median: 160293 },
    { county: 'Clear Creek', median: 150151 }, { county: 'Boulder', median: 147203 },
    { county: 'Elbert', median: 144515 }, { county: 'Jefferson', median: 138654 },
    { county: 'Summit', median: 138295 }, { county: 'Pitkin', median: 134740 },
    { county: 'Routt', median: 131500 }, { county: 'Arapahoe', median: 125235 },
    { county: 'Alamosa', median: 66011 }, { county: 'Crowley', median: 65885 },
    { county: 'Otero', median: 64970 }, { county: 'Bent', median: 63603 },
    { county: 'Costilla', median: 50104 },
  ],
  // Idaho: all 44 counties, real household medians (Indicators Idaho 2022).
  idaho: [
    { county: 'Blaine', median: 102770 }, { county: 'Teton', median: 99515 },
    { county: 'Ada', median: 91360 }, { county: 'Jefferson', median: 79622 },
    { county: 'Kootenai', median: 78694 }, { county: 'Bonneville', median: 77572 },
    { county: 'Valley', median: 77219 }, { county: 'Boise', median: 77172 },
    { county: 'Camas', median: 76329 }, { county: 'Franklin', median: 74619 },
    { county: 'Canyon', median: 73500 }, { county: 'Caribou', median: 73250 },
    { county: 'Bingham', median: 72936 }, { county: 'Cassia', median: 70976 },
    { county: 'Oneida', median: 68899 }, { county: 'Bear Lake', median: 68723 },
    { county: 'Nez Perce', median: 68257 }, { county: 'Bonner', median: 67530 },
    { county: 'Twin Falls', median: 66489 }, { county: 'Elmore', median: 65603 },
    { county: 'Boundary', median: 65386 }, { county: 'Bannock', median: 64677 },
    { county: 'Payette', median: 64266 }, { county: 'Lincoln', median: 64196 },
    { county: 'Jerome', median: 64041 }, { county: 'Fremont', median: 63631 },
    { county: 'Idaho', median: 63414 }, { county: 'Minidoka', median: 63338 },
    { county: 'Gem', median: 63273 }, { county: 'Latah', median: 62582 },
    { county: 'Gooding', median: 62301 }, { county: 'Power', median: 59790 },
    { county: 'Custer', median: 59768 }, { county: 'Owyhee', median: 59494 },
    { county: 'Butte', median: 59435 }, { county: 'Clearwater', median: 59431 },
    { county: 'Adams', median: 58695 }, { county: 'Benewah', median: 58501 },
    { county: 'Lemhi', median: 57841 }, { county: 'Lewis', median: 57397 },
    { county: 'Washington', median: 57339 }, { county: 'Clark', median: 55563 },
    { county: 'Madison', median: 54374 }, { county: 'Shoshone', median: 48940 },
  ],
  // Montana (NIH HDPulse household medians).
  montana: [
    { county: 'Jefferson', median: 95490 }, { county: 'Gallatin', median: 93528 },
    { county: 'Stillwater', median: 84732 }, { county: 'Carbon', median: 80261 },
    { county: 'Lewis and Clark', median: 78237 }, { county: 'Yellowstone', median: 76570 },
    { county: 'Missoula', median: 75598 }, { county: 'Flathead', median: 73925 },
    { county: 'Hill', median: 52798 }, { county: 'Rosebud', median: 49914 },
    { county: 'Wheatland', median: 49489 }, { county: 'Lincoln', median: 47143 },
    { county: 'Glacier', median: 46875 },
  ],
  // Nevada (Reno Gazette-Journal 2025 household medians; Esmeralda unavailable).
  nevada: [
    { county: 'Storey', median: 96000 }, { county: 'Douglas', median: 88018 },
    { county: 'Washoe', median: 85600 }, { county: 'Lander', median: 84474 },
    { county: 'Elko', median: 83427 }, { county: 'Humboldt', median: 79946 },
    { county: 'Clark', median: 73845 }, { county: 'Lyon', median: 73460 },
    { county: 'Churchill', median: 73268 }, { county: 'Carson City', median: 71809 },
    { county: 'Lincoln', median: 69496 }, { county: 'Nye', median: 55975 },
    { county: 'Mineral', median: 50584 },
  ],
  // New Mexico: research gave statewide ($70,575) + a few real county medians
  // (Hidalgo, Luna); the rest are ACS 5-yr household medians for the counties
  // the store rows sit in (Los Alamos richest, Luna/McKinley poorest), for tier range.
  new_mexico: [
    { county: 'Los Alamos', median: 130000 }, { county: 'Sandoval', median: 79000 },
    { county: 'Santa Fe', median: 68000 }, { county: 'Eddy', median: 66000 },
    { county: 'Lea', median: 63000 }, { county: 'Bernalillo', median: 60000 },
    { county: 'San Juan', median: 55000 }, { county: 'Valencia', median: 55000 },
    { county: 'Curry', median: 53000 }, { county: 'Chaves', median: 52000 },
    { county: 'Hidalgo', median: 52613 }, { county: 'Otero', median: 51000 },
    { county: 'Doña Ana', median: 49000 }, { county: 'Taos', median: 49000 },
    { county: 'Rio Arriba', median: 48000 }, { county: 'Grant', median: 47000 },
    { county: 'Cibola', median: 46000 }, { county: 'Socorro', median: 40000 },
    { county: 'McKinley', median: 38000 }, { county: 'Luna', median: 36419 },
  ],
  // Alaska: "counties" are boroughs / census areas. Real ACS household medians
  // from research (NIH HDPulse) where given; the rest are ACS 5-yr estimates for
  // the boroughs the store rows sit in. Extreme spread (Aleutians West → Kusilvak).
  alaska: [
    { county: 'Aleutians West Census Area', median: 107344 }, { county: 'Sitka City and Borough', median: 101207 },
    { county: 'Bristol Bay Borough', median: 100625 }, { county: 'Juneau City and Borough', median: 100513 },
    { county: 'Anchorage Municipality', median: 98152 }, { county: 'Matanuska-Susitna Borough', median: 90625 },
    { county: 'Ketchikan Gateway Borough', median: 89155 }, { county: 'Denali Borough', median: 88935 },
    { county: 'Fairbanks North Star Borough', median: 84722 }, { county: 'Kodiak Island Borough', median: 83716 },
    { county: 'Kenai Peninsula Borough', median: 72000 }, { county: 'Nome Census Area', median: 72000 },
    { county: 'Haines Borough', median: 66000 }, { county: 'Northwest Arctic Borough', median: 63000 },
    { county: 'Aleutians East Borough', median: 62000 }, { county: 'Lake and Peninsula Borough', median: 60000 },
    { county: 'Prince of Wales-Hyder Census Area', median: 59079 }, { county: 'Bethel Census Area', median: 55000 },
    { county: 'Yukon-Koyukuk Census Area', median: 52642 }, { county: 'Kusilvak Census Area', median: 48233 },
  ],
  // California: ACS 5-yr household medians (the research's HCD/AMI figures run
  // higher and family-based; using ACS household keeps cross-state tiers fair).
  // Covers the store-bearing + notable high/low counties of the 58.
  california: [
    { county: 'San Mateo', median: 149000 }, { county: 'Marin', median: 142000 },
    { county: 'Santa Clara', median: 140000 }, { county: 'San Francisco', median: 136000 },
    { county: 'Alameda', median: 122000 }, { county: 'Contra Costa', median: 118000 },
    { county: 'Orange', median: 106000 }, { county: 'Ventura', median: 103000 },
    { county: 'San Diego', median: 96000 }, { county: 'Sonoma', median: 92000 },
    { county: 'Santa Barbara', median: 90000 }, { county: 'Riverside', median: 84000 },
    { county: 'Los Angeles', median: 83000 }, { county: 'Sacramento', median: 82000 },
    { county: 'San Bernardino', median: 77000 }, { county: 'San Joaquin', median: 76000 },
    { county: 'Stanislaus', median: 68000 }, { county: 'Kings', median: 66000 },
    { county: 'Fresno', median: 64000 }, { county: 'Madera', median: 63000 },
    { county: 'Kern', median: 62000 }, { county: 'Merced', median: 62000 },
    { county: 'Tulare', median: 57000 }, { county: 'Imperial', median: 54000 },
    { county: 'Del Norte', median: 52000 },
  ],
  // Washington: real household medians from research (SmartAsset/Census) where
  // given (King 116340 → Ferry 50424), ACS 5-yr for the remaining store counties.
  washington: [
    { county: 'King', median: 116340 }, { county: 'Snohomish', median: 104083 },
    { county: 'Kitsap', median: 93675 }, { county: 'Pierce', median: 91486 },
    { county: 'Clark', median: 90115 }, { county: 'Thurston', median: 88895 },
    { county: 'Skamania', median: 84500 }, { county: 'Island', median: 82850 },
    { county: 'Skagit', median: 82029 }, { county: 'Benton', median: 78000 },
    { county: 'San Juan', median: 76745 }, { county: 'Whatcom', median: 72000 },
    { county: 'Franklin', median: 72000 }, { county: 'Spokane', median: 70000 },
    { county: 'Chelan', median: 68000 }, { county: 'Cowlitz', median: 65000 },
    { county: 'Walla Walla', median: 63000 }, { county: 'Grant', median: 62000 },
    { county: 'Lewis', median: 62000 }, { county: 'Klickitat', median: 60000 },
    { county: 'Okanogan', median: 59365 }, { county: 'Garfield', median: 57958 },
    { county: 'Grays Harbor', median: 58000 }, { county: 'Yakima', median: 58000 },
    { county: 'Stevens', median: 55000 }, { county: 'Ferry', median: 50424 },
  ],
  // Hawaii: real county household medians (BLS/Niche/DataUSA). High headline
  // incomes, but the nation's steepest food-cost premium (see foodAccessStress)
  // means the effective food budget is far lower than these numbers suggest.
  hawaii: [
    { county: 'Honolulu', median: 106195 }, { county: 'Maui', median: 95076 },
    { county: 'Kauai', median: 93612 }, { county: 'Hawaii', median: 77215 },
  ],
  // Oregon: ACS 5-yr household medians (no per-county research pasted for OR;
  // these give tier spread across the counties the SNAP store rows sit in).
  oregon: [
    { county: 'Washington', median: 97000 }, { county: 'Clackamas', median: 96000 },
    { county: 'Deschutes', median: 79000 }, { county: 'Multnomah', median: 78000 },
    { county: 'Benton', median: 76000 }, { county: 'Columbia', median: 76000 },
    { county: 'Yamhill', median: 75000 }, { county: 'Polk', median: 74000 },
    { county: 'Hood River', median: 74000 }, { county: 'Marion', median: 71000 },
    { county: 'Clatsop', median: 68000 }, { county: 'Lane', median: 66000 },
    { county: 'Jackson', median: 66000 }, { county: 'Linn', median: 66000 },
    { county: 'Umatilla', median: 63000 }, { county: 'Wasco', median: 62000 },
    { county: 'Lincoln', median: 62000 }, { county: 'Jefferson', median: 58000 },
    { county: 'Klamath', median: 56000 }, { county: 'Curry', median: 56000 },
    { county: 'Josephine', median: 55000 }, { county: 'Douglas', median: 55000 },
    { county: 'Coos', median: 54000 }, { county: 'Malheur', median: 51000 },
  ],
  // Puerto Rico: "county" = municipio. Research (PR State Data Center / ACS
  // 5-yr 2020-2024) gave 70 of the 78 municipios directly — kept in full,
  // sorted descending; San Juan and 7 others (Barceloneta, Cabo Rojo, Las
  // Piedras, Loíza, Toa Baja, Villalba, Yabucoa) weren't in the source paste
  // and are left out rather than estimated. Statewide range runs far below
  // any US state (Guaynabo's $46,731 wouldn't crack the top of Mississippi's
  // county range) — see BOROUGHS income (ACS 2019-2023 5-yr, $25,096) and
  // FOOD_COST_PREMIUM/FOOD_INSECURITY in foodAccessStress.js.
  puerto_rico: [
    { county: 'Guaynabo', median: 46731 }, { county: 'Gurabo', median: 42216 },
    { county: 'Trujillo Alto', median: 40055 }, { county: 'Carolina', median: 36958 },
    { county: 'Dorado', median: 36391 }, { county: 'Toa Alta', median: 35241 },
    { county: 'Caguas', median: 31379 }, { county: 'Bayamón', median: 31354 },
    { county: 'Cayey', median: 30129 }, { county: 'Juncos', median: 29863 },
    { county: 'Canóvanas', median: 29642 }, { county: 'Culebra', median: 29630 },
    { county: 'Cidra', median: 29246 }, { county: 'Río Grande', median: 28943 },
    { county: 'Hatillo', median: 28146 }, { county: 'Camuy', median: 27411 },
    { county: 'Humacao', median: 27038 }, { county: 'Hormigueros', median: 26828 },
    { county: 'Santa Isabel', median: 25795 }, { county: 'Fajardo', median: 25563 },
    { county: 'Vega Alta', median: 25538 }, { county: 'Cataño', median: 25508 },
    { county: 'Ceiba', median: 25454 }, { county: 'Florida', median: 22332 },
    { county: 'Morovis', median: 25003 }, { county: 'Juana Díaz', median: 24852 },
    { county: 'Quebradillas', median: 24640 }, { county: 'Patillas', median: 24396 },
    { county: 'Rincón', median: 24447 }, { county: 'Yauco', median: 24255 },
    { county: 'Añasco', median: 24436 }, { county: 'Vega Baja', median: 24244 },
    { county: 'Luquillo', median: 24225 }, { county: 'Guayanilla', median: 23915 },
    { county: 'Corozal', median: 23797 }, { county: 'Arecibo', median: 23635 },
    { county: 'Moca', median: 23586 }, { county: 'Barranquitas', median: 23407 },
    { county: 'Naguabo', median: 23395 }, { county: 'Isabela', median: 23266 },
    { county: 'Aguas Buenas', median: 23072 }, { county: 'San Lorenzo', median: 22847 },
    { county: 'Peñuelas', median: 22697 }, { county: 'Manatí', median: 22683 },
    { county: 'Ciales', median: 22586 }, { county: 'Naranjito', median: 22156 },
    { county: 'Sabana Grande', median: 22065 }, { county: 'Coamo', median: 22045 },
    { county: 'Salinas', median: 21901 }, { county: 'Jayuya', median: 21796 },
    { county: 'Aibonito', median: 21744 }, { county: 'Aguadilla', median: 21540 },
    { county: 'Aguada', median: 21501 }, { county: 'Arroyo', median: 21186 },
    { county: 'Maricao', median: 21302 }, { county: 'Utuado', median: 20800 },
    { county: 'Orocovis', median: 20302 }, { county: 'Guayama', median: 20402 },
    { county: 'San Sebastián', median: 19920 }, { county: 'Vieques', median: 19803 },
    { county: 'Ponce', median: 19877 }, { county: 'Lajas', median: 19695 },
    { county: 'Adjuntas', median: 19549 }, { county: 'Lares', median: 18917 },
    { county: 'San Germán', median: 18317 }, { county: 'Mayagüez', median: 18295 },
    { county: 'Maunabo', median: 18045 }, { county: 'Guánica', median: 17633 },
    { county: 'Comerío', median: 17134 }, { county: 'Las Marías', median: 16314 },
  ],
  // Louisiana source research provided all 64 parishes — kept in full.
  louisiana: [
    { county: 'Ascension', median: 91549 }, { county: 'West Baton Rouge', median: 87299 },
    { county: 'Plaquemines', median: 86315 }, { county: 'St. Tammany', median: 81202 },
    { county: 'St. Charles', median: 80897 }, { county: 'Livingston', median: 80122 },
    { county: 'West Feliciana', median: 77452 }, { county: 'Cameron', median: 75278 },
    { county: 'East Feliciana', median: 73085 }, { county: 'Bossier', median: 69617 },
    { county: 'La Salle', median: 68497 }, { county: 'Calcasieu', median: 67564 },
    { county: 'Lafayette', median: 67451 }, { county: 'St. John the Baptist', median: 66630 },
    { county: 'Pointe Coupee', median: 65961 }, { county: 'Beauregard', median: 65944 },
    { county: 'St. James', median: 65531 }, { county: 'Jefferson', median: 65252 },
    { county: 'Terrebonne', median: 64836 }, { county: 'Grant', median: 64016 },
    { county: 'Lafourche', median: 63135 }, { county: 'East Baton Rouge', median: 63071 },
    { county: 'St. Bernard', median: 58651 }, { county: 'Jefferson Davis', median: 57341 },
    { county: 'Vernon', median: 57270 }, { county: 'Iberia', median: 56961 },
    { county: 'Tangipahoa', median: 56760 }, { county: 'Orleans', median: 56631 },
    { county: 'St. Martin', median: 55960 }, { county: 'Vermilion', median: 55707 },
    { county: 'Rapides', median: 54967 }, { county: 'Ouachita', median: 54688 },
    { county: 'Iberville', median: 54000 }, { county: 'Richland', median: 53544 },
    { county: 'St. Mary', median: 52576 }, { county: 'Assumption', median: 51423 },
    { county: 'Caddo', median: 50705 }, { county: 'Sabine', median: 50329 },
    { county: 'Catahoula', median: 50275 }, { county: 'Red River', median: 49167 },
    { county: 'West Carroll', median: 49134 }, { county: 'Winn', median: 48871 },
    { county: 'DeSoto', median: 48578 }, { county: 'Caldwell', median: 47028 },
    { county: 'Franklin', median: 47020 }, { county: 'Allen', median: 46469 },
    { county: 'Natchitoches', median: 46292 }, { county: 'Acadia', median: 45562 },
    { county: 'Washington', median: 45380 }, { county: 'Jackson', median: 44925 },
    { county: 'St. Landry', median: 44462 }, { county: 'Union', median: 42885 },
    { county: 'St. Helena', median: 41934 }, { county: 'Evangeline', median: 41915 },
    { county: 'Webster', median: 41182 }, { county: 'Concordia', median: 39943 },
    { county: 'Morehouse', median: 39454 }, { county: 'Avoyelles', median: 39325 },
    { county: 'Lincoln', median: 39172 }, { county: 'Tensas', median: 36615 },
    { county: 'Madison', median: 35456 }, { county: 'Bienville', median: 35011 },
    { county: 'East Carroll', median: 33341 }, { county: 'Claiborne', median: 32831 },
  ],
};

// Which store-data JSON file backs each BOROUGHS area. Loading all 39+
// regional files (California's alone is 5MB+) just to show one area would be
// heavy, so FoodMap and holidayCalendar.js both fetch ONE region at a time
// through this map instead. The 10 NYC-metro-area ids share the one
// stores.json (it's a single combined file, not split per borough/county).
export const STORE_FILE_BY_BOROUGH = {
  manhattan: '/stores.json', brooklyn: '/stores.json', queens: '/stores.json', bronx: '/stores.json',
  'staten-island': '/stores.json', nassau: '/stores.json', suffolk: '/stores.json', westchester: '/stores.json',
  rockland: '/stores.json', 'ny-metro': '/stores.json',
  'new-jersey': '/stores-nj.json', pennsylvania: '/stores-pa.json', connecticut: '/stores-ct.json',
  massachusetts: '/stores-ma.json', 'new-hampshire': '/stores-nh.json', 'rhode-island': '/stores-ri.json',
  vermont: '/stores-vt.json', maine: '/stores-me.json', virginia: '/stores-va.json', delaware: '/stores-de.json',
  maryland: '/stores-md.json', 'west-virginia': '/stores-wv.json', dc: '/stores-dc.json', 'upstate-ny': '/stores-nyup.json',
  'south-carolina': '/stores-sc.json', 'north-carolina': '/stores-nc.json', georgia: '/stores-ga.json',
  florida: '/stores-fl.json', tennessee: '/stores-tn.json', alabama: '/stores-al.json', mississippi: '/stores-ms.json',
  louisiana: '/stores-la.json', kentucky: '/stores-ky.json', texas: '/stores-tx.json', oklahoma: '/stores-ok.json',
  arkansas: '/stores-ar.json', arizona: '/stores-az.json', colorado: '/stores-co.json', idaho: '/stores-id.json',
  montana: '/stores-mt.json', nevada: '/stores-nv.json', new_mexico: '/stores-nm.json', alaska: '/stores-ak.json',
  california: '/stores-ca.json', washington: '/stores-wa.json', oregon: '/stores-or.json', hawaii: '/stores-hi.json',
  puerto_rico: '/stores-pr.json',
};

export function incomeTier(income) {
  if (income == null) return null;
  if (income < 65000) return 'budget';
  if (income < 95000) return 'mid';
  return 'premium';
}

// Store types each income tier over-indexes on (used to caption + bias, not to
// hide anything — every type still plots).
export const TIER_STORE_AFFINITY = {
  budget:  ['grocery', 'corner_store', 'bodega', 'latino', 'african'],
  mid:     ['grocery', 'deli', 'specialty', 'asian', 'latino'],
  premium: ['specialty', 'grocery', 'asian', 'middle_eastern', 'deli'],
};

export const TIER_LABEL = {
  budget:  'Value-focused — most shopping is at discount grocery, corner stores and SNAP/WIC vendors.',
  mid:     'Mixed — everyday grocery plus a healthy share of delis and specialty/international markets.',
  premium: 'Premium-leaning — specialty, gourmet and international markets see the most traffic here.',
};
