// Photo mission engine — store-specific photo challenges that earn coins and pixel collectibles

const MISSION_POOLS = {
  grocery: [
    { id: 'produce',     emoji: 'PRODUCE', label: 'Produce Section',  instruction: 'Photograph any fruit or vegetable display',            coins: 20 },
    { id: 'fruit-price', emoji: 'FRUIT', label: 'Fruit Prices',      instruction: 'Capture the price tag on any fresh fruit',             coins: 25 },
    { id: 'veg-price',   emoji: 'VEGGIE', label: 'Veggie Prices',     instruction: 'Capture a vegetable price sign',                       coins: 25 },
    { id: 'dairy',       emoji: 'DAIRY', label: 'Dairy Section',     instruction: 'Show the milk and dairy cooler',                       coins: 15 },
    { id: 'bulk',        emoji: 'BULK', label: 'Bulk Bins',         instruction: 'Photograph the bulk food section',                     coins: 20 },
    { id: 'deli',        emoji: 'DELI', label: 'Deli Counter',      instruction: "Show what's on display at the deli counter",           coins: 20 },
    { id: 'bread',       emoji: 'BREAD', label: 'Bread Aisle',       instruction: 'Show the bread section with any prices visible',       coins: 15 },
    { id: 'eggs',        emoji: 'EGG', label: 'Egg Prices',        instruction: 'Photograph the egg display with prices visible',       coins: 30 },
    { id: 'greens',      emoji: 'LEAFY', label: 'Leafy Greens',      instruction: 'Show collard greens, kale, or spinach on display',     coins: 20 },
    { id: 'checkout',    emoji: 'CHECKOUT', label: 'Checkout Lane',     instruction: 'Capture the checkout area (no faces)',                 coins: 10 },
  ],
  bodega: [
    { id: 'hot-food',    emoji: 'HOT', label: 'Hot Food Display',  instruction: 'Show what is in the hot food case today',             coins: 25 },
    { id: 'coffee',      emoji: 'COFFEE', label: 'Coffee Station',    instruction: 'Photograph the coffee setup',                         coins: 15 },
    { id: 'drinks',      emoji: 'DRINK', label: 'Drink Cooler',      instruction: 'Show the refrigerated drinks selection',               coins: 15 },
    { id: 'fruit-front', emoji: 'FRONT', label: 'Front Fruit',       instruction: 'Many bodegas keep fruit out front — photograph it',   coins: 20 },
    { id: 'snacks',      emoji: 'SNACK', label: 'Snack Wall',        instruction: 'Capture the candy and snack display',                 coins: 15 },
    { id: 'snack-price', emoji: 'SNACK', label: 'Snack Prices',      instruction: 'Find a price tag on any snack item',                  coins: 20 },
    { id: 'sandwiches',  emoji: 'SANDWICH', label: 'Sandwich Menu',     instruction: 'Show the sandwich menu or specials board',            coins: 25 },
    { id: 'cat',         emoji: 'BODEGA', label: 'Bodega Cat',        instruction: 'Spot and photograph the bodega cat (if present)',     coins: 50 },
  ],
  corner_store: [
    { id: 'cooler',      emoji: 'DRINK', label: 'Drink Cooler',      instruction: 'Show the refrigerated section',                       coins: 15 },
    { id: 'chips',       emoji: 'CHIP', label: 'Chip Rack',         instruction: 'Photograph the chip and snack display',               coins: 15 },
    { id: 'produce',     emoji: 'PRODUCE', label: 'Produce Display',   instruction: 'Show any fruits or vegetables for sale',              coins: 25 },
    { id: 'price-signs', emoji: 'PRICE', label: 'Price Signs',       instruction: 'Capture any handwritten price signs',                 coins: 30 },
    { id: 'candy',       emoji: 'CANDY', label: 'Candy Selection',   instruction: 'Show the candy or sweets display',                    coins: 15 },
  ],
  specialty: [
    { id: 'signature',   emoji: 'SIGNATURE', label: 'Signature Item',    instruction: 'Photograph the most unique item in the store',        coins: 35 },
    { id: 'spec-price',  emoji: 'PRICE', label: 'Price Check',       instruction: 'Show pricing on any specialty item',                  coins: 25 },
    { id: 'display',     emoji: 'STORE', label: 'Store Display',     instruction: 'Capture a beautiful product display',                 coins: 20 },
  ],
  supermarket: [
    { id: 'produce',     emoji: 'PRODUCE', label: 'Produce Section',   instruction: 'Photograph any fruit or vegetable display',           coins: 20 },
    { id: 'fruit-price', emoji: 'FRUIT', label: 'Fruit Prices',      instruction: 'Capture the price tag on any fresh fruit',            coins: 25 },
    { id: 'dairy',       emoji: 'DAIRY', label: 'Dairy Section',     instruction: 'Show the milk and dairy cooler',                      coins: 15 },
    { id: 'eggs',        emoji: 'EGG', label: 'Egg Prices',        instruction: 'Photograph the egg display with prices visible',      coins: 30 },
    { id: 'deli',        emoji: 'DELI', label: 'Deli Counter',      instruction: "Show what's on display at the deli counter",          coins: 20 },
  ],
};

// Shuffle and pick N missions for a given store type
export function getMissionsForStore(storeType, count = 3) {
  const pool = MISSION_POOLS[storeType] || MISSION_POOLS.grocery;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
}

// Convert an uploaded image File into a pixelated data URL (240×240 output)
export async function pixelizeImage(file, blockSize = 10) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const OUTPUT = 240;
      const reduced = Math.floor(OUTPUT / blockSize);

      // Step 1: draw source at reduced size
      const tmp = document.createElement('canvas');
      tmp.width = reduced;
      tmp.height = reduced;
      const tmpCtx = tmp.getContext('2d');
      tmpCtx.imageSmoothingEnabled = true;
      tmpCtx.drawImage(img, 0, 0, reduced, reduced);

      // Step 2: scale back up without smoothing = chunky pixel blocks
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, OUTPUT, OUTPUT);

      // Step 3: draw subtle grid lines for the pixel-art look
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < OUTPUT; x += blockSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, OUTPUT); ctx.stroke();
      }
      for (let y = 0; y < OUTPUT; y += blockSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(OUTPUT, y); ctx.stroke();
      }

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

const CARDS_KEY = 'dig_in_pixel_cards';
const MAX_CARDS = 150;

// Save a completed pixel card to localStorage
export function savePixelCard({ storeId, storeName, storeType, missionId, missionLabel, missionEmoji, pixelDataUrl, coins }) {
  let cards = [];
  try { cards = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]'); } catch {}

  const card = {
    id: `${storeId || 'store'}_${missionId}_${Date.now()}`,
    storeId,
    storeName,
    storeType,
    missionId,
    missionLabel,
    missionEmoji,
    pixelDataUrl,
    coins,
    date: new Date().toISOString(),
  };

  cards.unshift(card);
  if (cards.length > MAX_CARDS) cards = cards.slice(0, MAX_CARDS);
  try { localStorage.setItem(CARDS_KEY, JSON.stringify(cards)); } catch {}
  return card;
}

// Load all saved pixel cards
export function getPixelCards() {
  try { return JSON.parse(localStorage.getItem(CARDS_KEY) || '[]'); } catch { return []; }
}
