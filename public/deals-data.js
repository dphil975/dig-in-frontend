// deals-data.js — embedded deal records (works offline; synced from /api/deals when backend is live)
// Schema: { id, storeName, storeType, borough, title, description, discount, category, validUntil }
window.DIG_IN_DEALS = [

    // ── Bodegas ──────────────────────────────────────────────────────────────
    {
        id: 'bd001', storeType: 'bodega', borough: 'manhattan',
        storeName: 'Sunrise Bodega',
        title: 'Coffee + Roll Combo',
        description: 'Any large coffee + 1 fresh roll for $2.50 all morning',
        discount: 'Save $1.50', category: 'beverages', validUntil: '2026-07-31',
    },
    {
        id: 'bd002', storeType: 'bodega', borough: 'manhattan',
        storeName: 'Loco Bodega',
        title: 'BEC Morning Special',
        description: 'Bacon egg & cheese on a roll + coffee — flat $3.75 before 11am',
        discount: 'Save $2', category: 'food', validUntil: '2026-07-31',
    },
    {
        id: 'bd003', storeType: 'bodega', borough: 'brooklyn',
        storeName: 'Bedford Bodega',
        title: '3 for $5 Cold Drinks',
        description: '20oz Gatorade, Snapple, or Arizona Iced Tea — mix & match',
        discount: '3 for $5', category: 'beverages', validUntil: '2026-07-20',
    },
    {
        id: 'bd004', storeType: 'bodega', borough: 'brooklyn',
        storeName: 'Bushwick Esquina',
        title: 'Chopped Cheese Combo',
        description: 'Chopped cheese + bag of chips + fountain drink — $6 flat',
        discount: '$6 combo', category: 'food', validUntil: '2026-07-31',
    },
    {
        id: 'bd005', storeType: 'bodega', borough: 'queens',
        storeName: 'Calle Bodega',
        title: 'Pernil by the Pound',
        description: 'Slow-roasted pernil — $6/lb (limit 2 lbs per customer)',
        discount: '$6/lb', category: 'meat', validUntil: '2026-06-30',
    },
    {
        id: 'bd006', storeType: 'bodega', borough: 'bronx',
        storeName: 'Grand Concourse Deli',
        title: 'Hero + Drink $7',
        description: 'Any 12" hero sandwich with a 20oz drink — any filling',
        discount: 'Save $3', category: 'food', validUntil: '2026-07-15',
    },
    {
        id: 'bd007', storeType: 'bodega', borough: 'staten-island',
        storeName: 'Bay Ridge Bodega',
        title: 'Halal Lamb Special',
        description: 'Fresh halal lamb shoulder — $6/lb (reg. $10)',
        discount: '40% off', category: 'meat', validUntil: '2026-06-30',
    },

    // ── Corner Stores ─────────────────────────────────────────────────────────
    {
        id: 'cs001', storeType: 'corner', borough: 'manhattan',
        storeName: 'Corner Deli 24/7',
        title: 'Late Night Snack Pack',
        description: '2 chips + 1 candy bar + 1 20oz drink for $4 after 10pm',
        discount: 'Save $2', category: 'snacks', validUntil: '2026-07-31',
    },
    {
        id: 'cs002', storeType: 'corner', borough: 'manhattan',
        storeName: 'East Village Corner',
        title: 'Energy Drink 2-for-1',
        description: 'Monster, Celsius, or Bang — buy one get one free all week',
        discount: 'BOGO', category: 'beverages', validUntil: '2026-07-07',
    },
    {
        id: 'cs003', storeType: 'corner', borough: 'queens',
        storeName: 'Astoria Corner Store',
        title: 'Greek Yogurt + Honey $3.50',
        description: 'Local thick-cut Greek yogurt with wildflower honey drizzle — limited daily stock',
        discount: 'Daily special', category: 'dairy', validUntil: '2026-07-31',
    },
    {
        id: 'cs004', storeType: 'corner', borough: 'bronx',
        storeName: 'Mott Haven Corner',
        title: 'Dulce de Leche Empanadas',
        description: 'Homemade dulce de leche empanadas — 3 for $4',
        discount: '3 for $4', category: 'food', validUntil: '2026-06-25',
    },
    {
        id: 'cs005', storeType: 'corner', borough: 'staten-island',
        storeName: 'Victory Corner',
        title: 'Fresh Mozzarella Sale',
        description: 'House-made mozzarella — $5/lb (reg. $8/lb)',
        discount: '38% off', category: 'dairy', validUntil: '2026-07-10',
    },
    {
        id: 'cs006', storeType: 'corner', borough: 'brooklyn',
        storeName: 'Flatbush Corner Mart',
        title: 'Ripe Plantain Special',
        description: 'Sweet ripe plantains — 5 lbs for $3 (reg. $5)',
        discount: '5 lbs for $3', category: 'produce', validUntil: '2026-06-20',
    },

    // ── Pharmacies ───────────────────────────────────────────────────────────
    {
        id: 'ph001', storeType: 'pharmacy', borough: 'all', chain: true,
        storeName: 'CVS Pharmacy', emoji: 'CVS',
        title: 'B2G1 Free Vitamins & Supplements',
        description: 'All vitamins, minerals, and supplements — mix & match any brands.',
        discount: 'B2G1 Free', category: 'health', validUntil: '2026-07-15',
    },
    {
        id: 'ph002', storeType: 'pharmacy', borough: 'all', chain: true,
        storeName: 'Walgreens', emoji: 'WALGREENS',
        title: 'Cosmetics 30% Off In-Store',
        description: "L'Oréal, Maybelline, NYX, Revlon — all shades on sale this week.",
        discount: '30% off', category: 'beauty', validUntil: '2026-07-10',
    },
    {
        id: 'ph003', storeType: 'pharmacy', borough: 'all', chain: true,
        storeName: 'Rite Aid', emoji: 'RITE',
        title: '50% Off One Rite Aid Brand Item',
        description: 'Any one Rite Aid store brand health or beauty item — limit 1 per customer.',
        discount: '50% off', category: 'general', validUntil: '2026-07-08',
    },
    {
        id: 'ph004', storeType: 'pharmacy', borough: 'manhattan', chain: true,
        storeName: 'Duane Reade', emoji: 'DUANE',
        title: 'NYC Lunch Combo: $7 Flat',
        description: 'Any hot food item + drink — grab-and-go at all Manhattan locations.',
        discount: '$7 combo', category: 'food', validUntil: '2026-07-31',
    },

    // ── Chains ────────────────────────────────────────────────────────────────
    {
        id: 'ch001', storeType: 'chain', borough: 'all', chain: true,
        storeName: 'Target', emoji: 'TARGET',
        title: 'Circle: 20% Off Household Essentials',
        description: 'Paper towels, cleaning supplies, laundry — activate in Target Circle app.',
        discount: '20% off', category: 'household', validUntil: '2026-07-12',
    },
    {
        id: 'ch002', storeType: 'chain', borough: 'all', chain: true,
        storeName: 'Target', emoji: 'TARGET',
        title: 'Good & Gather Pantry: 25% Off',
        description: "Target's store brand pasta, sauces, snacks, and organic options.",
        discount: '25% off', category: 'pantry', validUntil: '2026-07-14',
    },
    {
        id: 'ch003', storeType: 'chain', borough: 'all', chain: true,
        storeName: 'Dollar General', emoji: 'DOLLAR',
        title: '3 for $5 Canned & Dry Goods',
        description: 'Canned vegetables, beans, pasta, rice — any 3 items.',
        discount: '3 for $5', category: 'pantry', validUntil: '2026-07-31',
    },

    // ── Specialty Markets ─────────────────────────────────────────────────────
    {
        id: 'mk001', storeType: 'market', borough: 'all', chain: true,
        storeName: 'Whole Foods Market', emoji: 'WHOLE',
        title: 'Prime: Extra 10% Off 365 Brand',
        description: 'All 365 by Whole Foods items — must scan Amazon Prime card.',
        discount: '10% for Prime', category: 'pantry', validUntil: '2026-08-31',
    },
    {
        id: 'mk002', storeType: 'market', borough: 'all', chain: true,
        storeName: "Trader Joe's", emoji: 'TRADER',
        title: 'Unexpected Cheddar: $4.99',
        description: 'Fan-favorite clothbound cheddar — while supplies last.',
        discount: '$4.99', category: 'dairy', validUntil: '2026-07-31',
    },
    {
        id: 'mk003', storeType: 'market', borough: 'all', chain: true,
        storeName: 'Aldi', emoji: 'ALDI',
        title: 'Organic Bananas: $0.79/lb',
        description: 'USDA organic — consistently the lowest price in NYC.',
        discount: '$0.79/lb', category: 'produce', validUntil: '2026-07-31',
    },
    {
        id: 'mk004', storeType: 'market', borough: 'all', chain: true,
        storeName: 'Aldi', emoji: 'ALDI',
        title: 'ALDI Finds: Air Fryer $29.99',
        description: '4-quart digital air fryer — while supplies last, no rainchecks.',
        discount: '$29.99', category: 'kitchen', validUntil: '2026-07-05',
    },

    // ── NYC Grocery Chains ────────────────────────────────────────────────────
    {
        id: 'nyc001', storeType: 'grocery', borough: 'all', chain: true,
        storeName: 'Key Food', emoji: 'KEY',
        title: 'Chicken Thighs: $0.99/lb',
        description: 'Bone-in chicken thighs — family packs, in-store only.',
        discount: '$0.99/lb', category: 'meat', validUntil: '2026-07-07',
    },
    {
        id: 'nyc002', storeType: 'grocery', borough: 'all', chain: true,
        storeName: 'Stop & Shop', emoji: 'STOP',
        title: 'Digital Coupon: $5 Off $50',
        description: 'Clip coupon in Stop & Shop app — minimum $50 transaction.',
        discount: '$5 off $50', category: 'general', validUntil: '2026-07-10',
    },
    {
        id: 'nyc003', storeType: 'grocery', borough: 'all', chain: true,
        storeName: 'Associated Supermarket', emoji: 'ASSOCIATED',
        title: 'Ground Beef 80/20: $3.49/lb',
        description: 'Fresh 80/20 blend — all NYC Associated locations.',
        discount: '$3.49/lb', category: 'meat', validUntil: '2026-07-06',
    },

    // ── Grocery Stores ────────────────────────────────────────────────────────
    {
        id: 'gr001', storeType: 'grocery', borough: 'manhattan',
        storeName: 'Union Square Foods',
        title: 'Organic Seasonal Produce Box',
        description: 'Mixed seasonal vegetables — $12 for 5 lbs (reg. $20). Pre-order by 5pm.',
        discount: '40% off', category: 'produce', validUntil: '2026-07-06',
    },
    {
        id: 'gr002', storeType: 'grocery', borough: 'manhattan',
        storeName: 'Green Apple Grocery',
        title: '15% Off All Bulk Grains',
        description: 'Rice, lentils, quinoa, farro — all bulk bin items discounted this week',
        discount: '15% off', category: 'pantry', validUntil: '2026-07-31',
    },
    {
        id: 'gr003', storeType: 'grocery', borough: 'manhattan',
        storeName: 'Harlem Fresh Market',
        title: 'West African Spice Bundle',
        description: 'Suya spice mix + egusi + crayfish — bundle for $8 (reg. $14)',
        discount: '43% off bundle', category: 'pantry', validUntil: '2026-07-01',
    },
    {
        id: 'gr004', storeType: 'grocery', borough: 'brooklyn',
        storeName: 'Williamsburg Grocery',
        title: 'Polish Cold Cuts $4/lb',
        description: 'House-smoked kielbasa and smoked ham — $4/lb (reg. $7/lb)',
        discount: '43% off', category: 'meat', validUntil: '2026-06-28',
    },
    {
        id: 'gr005', storeType: 'grocery', borough: 'brooklyn',
        storeName: 'Park Slope Provisions',
        title: 'Local Farm Box $18',
        description: 'Weekly seasonal farm share box from upstate NY — $18 (reg. $28)',
        discount: '35% off', category: 'produce', validUntil: '2026-07-05',
    },
    {
        id: 'gr006', storeType: 'grocery', borough: 'queens',
        storeName: 'Patel Bros Jackson Hts',
        title: 'Basmati Rice Bulk Deal',
        description: '20 lb bag of aged Basmati — $18 (reg. $26). In-store only.',
        discount: '$8 off', category: 'pantry', validUntil: '2026-07-31',
    },
    {
        id: 'gr007', storeType: 'grocery', borough: 'queens',
        storeName: 'Flushing Supermarket',
        title: 'Tofu + Soy Milk Bundle',
        description: 'Fresh house tofu block + 1L unsweetened soy milk — $4.50',
        discount: 'Bundle deal', category: 'dairy', validUntil: '2026-07-15',
    },
    {
        id: 'gr008', storeType: 'grocery', borough: 'bronx',
        storeName: 'Fordham Grocery',
        title: 'Tropical Fruit Mix',
        description: 'Mangoes, papayas, and guavas — mixed 3 lbs for $5',
        discount: '3 lbs / $5', category: 'produce', validUntil: '2026-06-22',
    },
    {
        id: 'gr009', storeType: 'grocery', borough: 'staten-island',
        storeName: 'St George Market',
        title: 'Sunday Sauce Kit',
        description: 'San Marzano tomatoes + sweet Italian sausage + pasta — $14 bundle',
        discount: 'Bundle $14', category: 'pantry', validUntil: '2026-07-06',
    },
];
