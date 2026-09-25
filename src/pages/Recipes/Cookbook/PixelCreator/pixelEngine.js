// ── Pixel Art Engine ───────────────────────────────────────────────────────
// All canvas drawing is grid-based: coordinates are in grid units,
// each grid unit = `s` pixels. Canvas size = GRID * s.
//
// The palette table, cell-drawing helpers, outline/grid passes, and the
// photo→pixel-art converter live in src/lib/pixelArt.js so the recipe-step
// "snap your progress" capture flow can share the same engine without
// depending on this page. Re-exported here so existing imports keep working.
export {
  PALETTES, cell, row, col, drawGrid, drawOutline,
  posterize, BIT_CELL, convertPhoto, BIT_MODES,
} from '../../../../lib/pixelArt';
import { cell, row, col } from '../../../../lib/pixelArt';

export const GRID = 32; // base grid resolution (32×32)

// ── Food drawing functions (32×32 grid) ───────────────────────────────────
// Each function receives (ctx, s, pal) where s = cellSize, pal = PALETTES[key]

function hi(pal)  { return pal.hi; }
function out(pal) { return pal.outline; }

export function drawBurger(ctx, s, pal) {
  const [bunL, bunM, bunD, , letG, letD, cheese, tomato] = pal.shades;
  const o = out(pal), w = hi(pal);
  // Plate shadow
  row(ctx, 28, 8, 24, pal.shades[15], s);
  // Bottom bun
  row(ctx, 24, 8, 24, bunD, s); row(ctx, 25, 7, 25, bunD, s); row(ctx, 25, 8, 24, bunM, s);
  row(ctx, 26, 7, 25, bunM, s); row(ctx, 27, 8, 24, bunL, s);
  // Patty
  row(ctx, 19, 7, 25, pal.shades[3], s); row(ctx, 20, 7, 25, pal.shades[3], s);
  row(ctx, 21, 7, 25, pal.shades[3], s);
  // Cheese drape
  row(ctx, 18, 6, 26, cheese, s); row(ctx, 19, 6, 6, cheese, s); row(ctx, 19, 26, 26, cheese, s);
  // Tomato
  row(ctx, 16, 8, 24, tomato, s); row(ctx, 17, 8, 24, pal.shades[7], s);
  // Lettuce
  for (let x = 8; x <= 24; x += 2) { cell(ctx, x, 15, letG, s); cell(ctx, x + 1, 14, letG, s); }
  row(ctx, 15, 8, 24, letD, s);
  // Top bun
  row(ctx, 14, 8, 24, bunD, s);
  row(ctx, 11, 10, 22, bunM, s); row(ctx, 12, 9, 23, bunM, s);
  row(ctx, 10, 11, 21, bunL, s); row(ctx, 9, 12, 20, bunL, s); row(ctx, 8, 13, 19, bunL, s);
  row(ctx, 13, 8, 24, bunL, s);
  // Sesame seeds on top bun
  cell(ctx, 13, 10, w, s); cell(ctx, 17, 9, w, s); cell(ctx, 20, 10, w, s);
  // Highlight
  cell(ctx, 13, 8, w, s); cell(ctx, 14, 8, w, s);
}

export function drawRamen(ctx, s, pal) {
  const [,, bowlL, bowlM, bowlD, , , , , yolk, , , , , broth] = pal.shades;
  const o = out(pal), w = hi(pal);
  // Bowl outer
  row(ctx, 26, 5, 27, bowlD, s); row(ctx, 25, 4, 28, bowlD, s);
  for (let y = 16; y <= 24; y++) row(ctx, y, 3 + Math.floor((y - 16) * 0.3), 29 - Math.floor((y - 16) * 0.3), bowlM, s);
  row(ctx, 25, 4, 28, bowlD, s); row(ctx, 26, 5, 27, bowlD, s);
  // Bowl inner / broth
  for (let y = 16; y <= 23; y++) {
    const margin = 1 + Math.floor((y - 16) * 0.3);
    row(ctx, y, 4 + margin, 28 - margin, broth || bowlL, s);
  }
  // Rim
  row(ctx, 14, 4, 28, bowlL, s); row(ctx, 15, 4, 28, bowlM, s);
  // Noodles
  for (let x = 6; x <= 26; x += 4) {
    cell(ctx, x, 17, w, s); cell(ctx, x + 1, 18, w, s); cell(ctx, x + 2, 17, w, s);
    cell(ctx, x + 3, 19, w, s);
  }
  // Soft-boiled egg (halved)
  for (let y = 14; y <= 18; y++) {
    const span = Math.round(Math.sqrt(9 - Math.pow(y - 16, 2)));
    row(ctx, y, 9 - span, 9 + span, w, s);
  }
  row(ctx, 16, 8, 10, yolk || '#f4d44a', s); row(ctx, 17, 8, 10, yolk || '#f4d44a', s);
  // Nori slice
  col(ctx, 23, 14, 20, pal.shades[4], s); col(ctx, 24, 14, 20, '#203020', s);
  // Spring onion
  cell(ctx, 19, 14, pal.shades[4], s); cell(ctx, 20, 13, pal.shades[6], s); cell(ctx, 21, 14, pal.shades[4], s);
  // Steam
  for (let i = 0; i < 3; i++) {
    const bx = 10 + i * 6;
    cell(ctx, bx, 11, '#d8d8d8', s); cell(ctx, bx, 10, '#e8e8e8', s);
    cell(ctx, bx - 1, 9, '#d8d8d8', s); cell(ctx, bx + 1, 8, '#e0e0e0', s);
  }
  // Bowl highlight
  cell(ctx, 5, 15, w, s); cell(ctx, 6, 15, w, s);
}

export function drawCoffee(ctx, s, pal) {
  const coffee = '#5c3018', coffeeL = '#8c5028', cream = '#f8f0d0';
  const [cupW, , , , , , , , , , , , plateC, plateE] = pal.shades;
  const w = hi(pal);
  // Saucer
  row(ctx, 26, 7, 25, pal.shades[13] || '#c8c8c8', s);
  row(ctx, 25, 6, 26, pal.shades[12] || '#e0e0e0', s);
  row(ctx, 24, 6, 26, w, s);
  // Cup body
  for (let y = 14; y <= 23; y++) {
    const taper = Math.floor((y - 14) * 0.3);
    row(ctx, y, 8 + taper, 24 - taper, pal.shades[12] || '#ffffff', s);
  }
  // Coffee surface
  row(ctx, 15, 9, 23, coffee, s); row(ctx, 16, 9, 23, coffeeL, s);
  row(ctx, 17, 9, 23, coffee, s);
  // Latte art swirl
  cell(ctx, 15, 16, cream, s); cell(ctx, 16, 15, cream, s);
  cell(ctx, 17, 16, cream, s); cell(ctx, 16, 17, cream, s);
  cell(ctx, 15, 17, coffeeL, s);
  // Cup rim
  row(ctx, 14, 8, 24, w, s); row(ctx, 13, 8, 24, pal.shades[12] || '#f0f0f0', s);
  // Handle
  col(ctx, 25, 16, 20, pal.shades[12] || '#e0e0e0', s);
  row(ctx, 16, 24, 25, pal.shades[12] || '#e0e0e0', s);
  row(ctx, 20, 24, 25, pal.shades[12] || '#e0e0e0', s);
  // Steam
  cell(ctx, 13, 11, '#d0d0d0', s); cell(ctx, 13, 10, '#e0e0e0', s);
  cell(ctx, 14, 9, '#d8d8d8', s); cell(ctx, 13, 8, '#e8e8e8', s);
  cell(ctx, 18, 11, '#d0d0d0', s); cell(ctx, 18, 10, '#e0e0e0', s);
  cell(ctx, 19, 9, '#d8d8d8', s); cell(ctx, 18, 8, '#e8e8e8', s);
  // Highlight
  cell(ctx, 9, 14, w, s); cell(ctx, 9, 15, w, s);
}

export function drawTaco(ctx, s, pal) {
  const [shellL, shellM, shellD, , letG, letD, cheese, tomato, salmon] = pal.shades;
  const w = hi(pal);
  // Shell (U shape)
  for (let y = 12; y <= 24; y++) {
    const spread = Math.floor((y - 12) * 0.7);
    const leftX = 8 - spread; const rightX = 24 + spread;
    if (leftX >= 1) {
      cell(ctx, leftX, y, shellD, s); cell(ctx, leftX + 1, y, shellM, s);
    }
    if (rightX <= 31) {
      cell(ctx, rightX, y, shellD, s); cell(ctx, rightX - 1, y, shellM, s);
    }
  }
  row(ctx, 25, 6, 26, shellD, s);
  row(ctx, 26, 7, 25, shellM, s); row(ctx, 27, 8, 24, shellL, s);
  // Filling visible at top
  row(ctx, 12, 9, 23, letG, s); row(ctx, 13, 9, 23, letG, s);
  row(ctx, 12, 10, 22, letD, s);
  // Meat
  row(ctx, 14, 10, 22, pal.shades[3], s); row(ctx, 15, 10, 22, pal.shades[3], s);
  // Salsa
  row(ctx, 16, 10, 22, tomato, s);
  // Cheese
  row(ctx, 17, 11, 21, cheese, s);
  // Shell top crest
  for (let x = 9; x <= 23; x++) cell(ctx, x, 11, shellL, s);
  row(ctx, 10, 10, 24, shellM, s); row(ctx, 9, 11, 23, shellL, s);
  // Highlight
  cell(ctx, 10, 10, w, s); cell(ctx, 11, 9, w, s);
}

export function drawSushi(ctx, s, pal) {
  const [, , , , , , , , salmon] = pal.shades;
  const rice = '#f0ede0', nori = '#1c2818', w = hi(pal);
  // Plate
  row(ctx, 27, 5, 27, '#c8c8c8', s);
  for (let y = 24; y <= 26; y++) row(ctx, y, 4, 28, '#e8e8e8', s);
  // Rolls (3 pieces)
  const rolls = [9, 16, 23];
  rolls.forEach(cx => {
    // Rice
    for (let y = 17; y <= 23; y++) {
      const hw = 4 - Math.floor(Math.abs(y - 20) * 0.3);
      row(ctx, y, cx - hw, cx + hw, rice, s);
    }
    // Nori band
    row(ctx, 19, cx - 4, cx + 4, nori, s);
    row(ctx, 20, cx - 4, cx + 4, nori, s);
    // Salmon topping
    for (let y = 14; y <= 18; y++) {
      const hw = 3 - Math.floor(Math.abs(y - 16) * 0.4);
      row(ctx, y, cx - hw, cx + hw, pal.shades[8] || salmon || '#f07858', s);
    }
    // Shine
    cell(ctx, cx - 2, 15, w, s);
  });
  // Wasabi dab
  cell(ctx, 26, 22, pal.shades[4], s); cell(ctx, 27, 21, pal.shades[4], s);
  // Ginger
  row(ctx, 22, 25, 28, pal.shades[8] || '#f8b8a0', s);
}

export function drawPizza(ctx, s, pal) {
  const [crust1, crust2, , , , , cheese, sauce] = pal.shades;
  const w = hi(pal);
  // Triangular slice
  // Crust edge (top arc)
  row(ctx, 7, 14, 18, crust2, s); row(ctx, 8, 13, 19, crust1, s);
  row(ctx, 9, 12, 20, crust1, s); row(ctx, 10, 12, 20, crust2, s);
  // Main pizza surface (triangle pointing down)
  for (let y = 10; y <= 27; y++) {
    const hw = Math.round(10 - (y - 10) * (10 / 17));
    if (hw > 0) {
      row(ctx, y, 16 - hw, 16 + hw, cheese, s);
      // Sauce patches
      if (y % 3 === 0) row(ctx, y, 16 - hw + 1, 16 + hw - 1, sauce, s);
    }
  }
  // Pepperoni circles
  [[14, 16],[18, 13],[18, 19],[22, 16]].forEach(([py, px]) => {
    cell(ctx, px, py, pal.shades[7], s); cell(ctx, px + 1, py, pal.shades[7], s);
    cell(ctx, px, py + 1, pal.shades[6], s); cell(ctx, px + 1, py + 1, pal.shades[6], s);
  });
  // Crust highlight
  cell(ctx, 14, 8, w, s); cell(ctx, 15, 8, w, s);
  // Melted cheese drips
  cell(ctx, 12, 11, cheese, s); cell(ctx, 20, 11, cheese, s);
}

export function drawCake(ctx, s, pal) {
  const [topL, topM, , , , , , , , , , , , , , frosting] = pal.shades;
  const sponge = '#f8e8c0', cream = '#fafafa', berry = '#c02838';
  const w = hi(pal);
  // Plate
  row(ctx, 27, 6, 26, '#d8d8d8', s);
  row(ctx, 26, 5, 27, '#e8e8e8', s);
  // Bottom layer
  for (let y = 21; y <= 25; y++) row(ctx, y, 8, 24, sponge, s);
  row(ctx, 20, 7, 25, cream, s);
  row(ctx, 21, 7, 25, cream, s);
  // Middle layer
  for (let y = 16; y <= 19; y++) row(ctx, y, 8, 24, sponge, s);
  row(ctx, 15, 7, 25, cream, s);
  row(ctx, 16, 7, 25, pal.shades[7] || '#f8c8d0', s);
  // Top layer
  for (let y = 12; y <= 14; y++) row(ctx, y, 8, 24, sponge, s);
  // Frosting on top
  row(ctx, 11, 7, 25, cream, s); row(ctx, 10, 8, 24, cream, s);
  // Frosting drips
  [9, 13, 17, 22].forEach(x => {
    cell(ctx, x, 12, cream, s); cell(ctx, x, 13, cream, s);
  });
  // Berries on top
  [[10, 12],[14, 10],[18, 11],[22, 12]].forEach(([px, py]) => {
    cell(ctx, px, py, berry, s); cell(ctx, px + 1, py, berry, s);
    cell(ctx, px, py + 1, '#e03050', s);
  });
  // Candle
  col(ctx, 16, 5, 9, '#f4c850', s); cell(ctx, 16, 4, '#ff8820', s); cell(ctx, 16, 3, '#ffee44', s);
  // Highlight
  cell(ctx, 9, 11, w, s);
}

export function drawCookie(ctx, s, pal) {
  const [cookieL, cookieM, cookieD] = pal.shades;
  const choc = '#5c3010', w = hi(pal);
  // Cookie circle (pixelated)
  const cx = 16, cy = 16, r = 11;
  for (let y = cy - r; y <= cy + r; y++) {
    const hw = Math.round(Math.sqrt(r * r - (y - cy) * (y - cy)));
    // Slight irregular edge
    const edge = hw - (y % 3 === 0 ? 1 : 0);
    if (hw > 0) {
      row(ctx, y, cx - hw, cx + hw, cookieM, s);
      // Edge darker
      cell(ctx, cx - hw, y, cookieD, s); cell(ctx, cx + hw, y, cookieD, s);
    }
    if (hw > 2) row(ctx, y, cx - hw + 1, cx + hw - 1, cookieL, s);
  }
  // Crinkle texture
  [12, 15, 18, 21].forEach(y => {
    row(ctx, y, cx - 3, cx + 3, cookieD, s);
  });
  // Chocolate chips
  [[12, 12],[16, 10],[20, 13],[13, 19],[19, 20],[16, 17],[11, 16],[21, 16]].forEach(([px, py]) => {
    cell(ctx, px, py, choc, s); cell(ctx, px + 1, py + 1, '#8a5020', s);
  });
  // Highlight
  cell(ctx, 11, 10, w, s); cell(ctx, 12, 9, w, s);
}

export function drawEgg(ctx, s, pal) {
  const [panL, panM, panD, panEdge] = pal.shades.slice(12);
  const w = hi(pal), yolk = pal.shades[6] || '#f4c840';
  // Pan body
  for (let y = 18; y <= 26; y++) row(ctx, y, 3, 29, panM || '#d8924a', s);
  row(ctx, 27, 4, 28, panD || '#b06830', s);
  // Egg white
  for (let y = 13; y <= 22; y++) {
    const hw = Math.round(Math.sqrt(36 - (y - 18) * (y - 18) * 0.5));
    if (hw > 0) row(ctx, y, 16 - hw, 16 + hw, w, s);
  }
  // Yolk
  for (let y = 14; y <= 19; y++) {
    const hw = Math.round(Math.sqrt(9 - (y - 17) * (y - 17)));
    if (hw >= 0) row(ctx, y, 16 - hw, 16 + hw, yolk, s);
  }
  cell(ctx, 14, 15, '#fff8d0', s); // yolk highlight
  // Pan handle
  row(ctx, 22, 29, 31, panM || '#d8924a', s);
  row(ctx, 23, 29, 31, panD || '#b06830', s);
  // Pan highlight
  cell(ctx, 4, 19, '#e8b870', s); cell(ctx, 5, 19, '#e8b870', s);
}

// ── Food manifest ─────────────────────────────────────────────────────────
export const FOODS = [
  { id: 'burger',  label: 'Burger', fn: drawBurger  },
  { id: 'ramen',   label: 'Ramen', fn: drawRamen   },
  { id: 'coffee',  label: 'Coffee', fn: drawCoffee  },
  { id: 'taco',    label: 'Taco', fn: drawTaco    },
  { id: 'sushi',   label: 'Sushi', fn: drawSushi   },
  { id: 'pizza',   label: 'Pizza', fn: drawPizza   },
  { id: 'cake',    label: 'Cake', fn: drawCake    },
  { id: 'cookie',  label: 'Cookie', fn: drawCookie  },
  { id: 'egg',     label: 'Fried Egg', fn: drawEgg   },
];
