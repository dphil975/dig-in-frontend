/* pantryPixelIcons.js — the pixel art on the Virtual Pantry's shelf
   tiles. One category id in, one data-URL out; callers draw the result
   straight into an <img>.

   Split out of pantryTools.js. No runtime references to either
   pantryTools or pantryCategories; the icon registry is addressed by
   bare category id strings (see SCENES below). */

// ════════════════════════════════════════════════════════════════════════

/* pantryPixelIcons — the pixel art on the Virtual Pantry's shelf tiles.

   Every icon here is DRAWN, not fetched: each shelf category has a scene
   function that paints a 32×32 grid on a canvas (a woven basket of veggies, a
   plate of three differently-coloured cookies, a ramen bowl with a noodle
   swirl and half an egg…) and the result is exported as a PNG data URL. No
   image files, no network, no generated-image service — which is what keeps
   this honest: the tile can never show a photo of food you don't have, and it
   renders identically offline.

   "Generative" here means the scene grammar is shared and parameterised —
   vessels (basket / jar / bowl / can / carton / mug / bottle / bag / plate /
   crate) composed with contents (mounds of shaded balls, noodle swirls, chip
   specks, steam, leaf tops) — with a per-category seeded PRNG placing the
   pieces. Same category always renders the same picture (the seed is the
   category id), so the shelf you learned yesterday looks like itself today.

   Grid/scale conventions: 32×32 cells, object baseline at y=26, floor band
   below it. Cell helpers come from the app's existing pixelArt engine so
   these icons are made of the same primitives as the Pixel Creator's output. */

import { cell, row } from './pixelArt';

const G = 32;              // grid resolution
const BASE_Y = 26;         // every vessel's bottom row sits here
const DEFAULT_SIZE = 160;  // rendered px (32 × 5)

// ── low-level cells ───────────────────────────────────────────────────────
function px(ctx, x, y, c, s) {
  x = Math.round(x); y = Math.round(y);
  if (!c || x < 0 || y < 0 || x >= G || y >= G) return;
  cell(ctx, x, y, c, s);
}
function hline(ctx, y, x0, x1, c, s) {
  y = Math.round(y);
  if (!c || y < 0 || y >= G) return;
  const a = Math.max(0, Math.round(x0));
  const b = Math.min(G - 1, Math.round(x1));
  if (b < a) return;
  row(ctx, y, a, b, c, s);
}
function vline(ctx, x, y0, y1, c, s) {
  for (let y = Math.round(y0); y <= Math.round(y1); y++) px(ctx, x, y, c, s);
}
function box(ctx, x0, y0, x1, y1, c, s) {
  for (let y = Math.round(y0); y <= Math.round(y1); y++) hline(ctx, y, x0, x1, c, s);
}

function shade(hex, amt) {
  const n = parseInt(String(hex).slice(1), 16);
  const cl = v => Math.max(0, Math.min(255, v + amt));
  return `rgb(${cl((n >> 16) & 255)},${cl((n >> 8) & 255)},${cl(n & 255)})`;
}

/** A shaded sphere — the workhorse for fruit, veg, cookies, nuts, berries. */
function ball(ctx, cx, cy, r, c, s) {
  const dark = shade(c, -45);
  const hi = shade(c, 50);
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > r * r + r * 0.35) continue;
      px(ctx, x, y, (dx + dy > r * 0.6) ? dark : c, s);
    }
  }
  if (r >= 2) px(ctx, cx - Math.round(r * 0.4), cy - Math.round(r * 0.45), hi, s);
}

// ── seeded randomness (stable per category) ───────────────────────────────
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── vessels ───────────────────────────────────────────────────────────────
function basket(ctx, s, { x0 = 5, x1 = 26, y0 = 17, light = '#C98A3E', dark = '#8F5B1E', rim = '#B0762C' } = {}) {
  hline(ctx, y0, x0, x1, rim, s);
  hline(ctx, y0 + 1, x0, x1, light, s);
  const h = BASE_Y - y0 - 1;
  for (let i = 2; i <= h + 1; i++) {
    const y = y0 + i;
    const inset = Math.round(((i - 2) / Math.max(1, h - 1)) * 3);
    const weft = (i % 2) ? light : dark;
    hline(ctx, y, x0 + inset, x1 - inset, weft, s);
    for (let x = x0 + inset + ((i % 2) ? 1 : 2); x <= x1 - inset; x += 3) {
      px(ctx, x, y, (i % 2) ? dark : light, s);
    }
  }
  vline(ctx, x0, y0, y0 + 2, dark, s);
  vline(ctx, x1, y0, y0 + 2, dark, s);
}

function bowl(ctx, s, { cx = 16, rx = 12, y0 = 18, color = '#EFE7D4', dark = '#C3B79B', rim = '#8B7C5F' } = {}) {
  const h = BASE_Y - y0;
  for (let i = 0; i <= h; i++) {
    const t = i / h;
    const w = Math.max(3, Math.round(rx * Math.sqrt(Math.max(0, 1 - 0.82 * t * t))));
    hline(ctx, y0 + i, cx - w, cx + w, i === 0 ? rim : (i > h - 2 ? dark : color), s);
  }
}

function jar(ctx, s, { x0 = 10, x1 = 21, y0 = 12, glass = '#DCE9E2', lid = '#8C6A3F' } = {}) {
  box(ctx, x0 - 1, y0 - 4, x1 + 1, y0 - 2, lid, s);            // lid
  hline(ctx, y0 - 4, x0 - 1, x1 + 1, shade(lid, 35), s);
  hline(ctx, y0 - 1, x0, x1, shade(glass, -35), s);            // neck ring
  box(ctx, x0, y0, x1, BASE_Y, glass, s);                      // body
  vline(ctx, x1, y0, BASE_Y, shade(glass, -40), s);            // right shadow
  vline(ctx, x0 + 1, y0 + 1, BASE_Y - 2, shade(glass, 40), s); // left glare
  hline(ctx, BASE_Y, x0, x1, shade(glass, -40), s);
}

function tinCan(ctx, s, { x0 = 10, x1 = 21, y0 = 13, body = '#B9BEC4', band = '#C0392B' } = {}) {
  hline(ctx, y0, x0, x1, shade(body, 45), s);
  hline(ctx, y0 + 1, x0, x1, body, s);
  box(ctx, x0, y0 + 2, x1, BASE_Y, body, s);
  box(ctx, x0, y0 + 4, x1, BASE_Y - 3, band, s);               // label
  hline(ctx, y0 + 4, x0, x1, shade(band, 35), s);
  for (let y = y0 + 6; y <= BASE_Y - 5; y += 2) hline(ctx, y, x0 + 2, x1 - 2, shade(band, 55), s);
  vline(ctx, x1, y0 + 2, BASE_Y, shade(body, -45), s);
  vline(ctx, x0 + 1, y0 + 2, BASE_Y, shade(body, 40), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -45), s);
}

function carton(ctx, s, { x0 = 10, x1 = 21, y0 = 9, body = '#F2EDE0', accent = '#6E8259' } = {}) {
  for (let i = 0; i < 3; i++) hline(ctx, y0 + i, x0 + 3 - i, x1 - 3 + i, shade(body, -20), s); // peak
  box(ctx, x0, y0 + 3, x1, BASE_Y, body, s);
  box(ctx, x0 + 1, y0 + 6, x1 - 1, y0 + 12, accent, s);        // label panel
  vline(ctx, x1, y0 + 3, BASE_Y, shade(body, -35), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -35), s);
}

function mug(ctx, s, { x0 = 9, x1 = 21, y0 = 15, body = '#E8E2D2', handle } = {}) {
  const hc = handle || shade(body, -30);
  box(ctx, x0, y0, x1, BASE_Y, body, s);
  hline(ctx, y0, x0, x1, shade(body, -35), s);
  vline(ctx, x1, y0, BASE_Y, shade(body, -35), s);
  vline(ctx, x0 + 1, y0 + 2, BASE_Y - 2, shade(body, 35), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -35), s);
  // handle
  vline(ctx, x1 + 3, y0 + 3, y0 + 7, hc, s);
  px(ctx, x1 + 1, y0 + 2, hc, s); px(ctx, x1 + 2, y0 + 2, hc, s);
  px(ctx, x1 + 1, y0 + 8, hc, s); px(ctx, x1 + 2, y0 + 8, hc, s);
}

function bottle(ctx, s, { cx = 16, w = 5, y0 = 5, body = '#7FA05A', cap = '#33302A', labelC = '#F3EADA' } = {}) {
  box(ctx, cx - 1, y0, cx + 1, y0 + 1, cap, s);                // cap
  box(ctx, cx - 1, y0 + 2, cx + 1, y0 + 6, body, s);           // neck
  for (let i = 0; i < 3; i++) hline(ctx, y0 + 7 + i, cx - 2 - i, cx + 2 + i, body, s); // shoulder
  box(ctx, cx - w, y0 + 10, cx + w, BASE_Y, body, s);
  box(ctx, cx - w, y0 + 13, cx + w, y0 + 18, labelC, s);       // label
  vline(ctx, cx + w, y0 + 10, BASE_Y, shade(body, -45), s);
  vline(ctx, cx - w + 1, y0 + 11, BASE_Y - 1, shade(body, 45), s);
  hline(ctx, BASE_Y, cx - w, cx + w, shade(body, -45), s);
}

function bag(ctx, s, { x0 = 8, x1 = 23, y0 = 10, body = '#E0A32E', accent = '#33302A' } = {}) {
  for (let x = x0; x <= x1; x += 2) { px(ctx, x, y0, shade(body, -40), s); px(ctx, x + 1, y0 + 1, shade(body, -40), s); }
  hline(ctx, y0 + 1, x0, x1, shade(body, -25), s);             // crimp
  box(ctx, x0, y0 + 2, x1, BASE_Y, body, s);
  box(ctx, x0 + 2, y0 + 6, x1 - 2, y0 + 11, accent, s);        // label block
  vline(ctx, x1, y0 + 2, BASE_Y, shade(body, -45), s);
  vline(ctx, x0 + 1, y0 + 3, BASE_Y - 1, shade(body, 40), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -45), s);
}

function packBox(ctx, s, { x0 = 9, x1 = 22, y0 = 8, body = '#C0392B', panel = '#F3EADA' } = {}) {
  box(ctx, x0, y0, x1, BASE_Y, body, s);
  hline(ctx, y0, x0, x1, shade(body, 40), s);
  box(ctx, x0 + 2, y0 + 4, x1 - 2, y0 + 11, panel, s);
  vline(ctx, x1, y0, BASE_Y, shade(body, -45), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -45), s);
}

function plate(ctx, s, { cx = 16, rx = 13, y0 = 23, color = '#F5F1E6' } = {}) {
  hline(ctx, y0, cx - rx + 3, cx + rx - 3, shade(color, 25), s);
  hline(ctx, y0 + 1, cx - rx, cx + rx, color, s);
  hline(ctx, y0 + 2, cx - rx + 1, cx + rx - 1, shade(color, -25), s);
  hline(ctx, y0 + 3, cx - rx + 4, cx + rx - 4, shade(color, -45), s);
}

function sack(ctx, s, { cx = 16, y0 = 12, body = '#DCCBA4', tie = '#8F5B1E' } = {}) {
  box(ctx, cx - 3, y0, cx + 3, y0 + 2, body, s);               // gathered top
  hline(ctx, y0 + 3, cx - 4, cx + 4, tie, s);                  // tie
  for (let i = 0; i <= BASE_Y - y0 - 4; i++) {
    const w = Math.min(9, 4 + i);
    hline(ctx, y0 + 4 + i, cx - w, cx + w, i % 4 === 3 ? shade(body, -22) : body, s);
  }
  vline(ctx, cx + 9, y0 + 9, BASE_Y, shade(body, -45), s);
  hline(ctx, BASE_Y, cx - 9, cx + 9, shade(body, -45), s);
}

function crate(ctx, s, { x0 = 7, x1 = 24, y0 = 14, body = '#B98A55' } = {}) {
  box(ctx, x0, y0, x1, BASE_Y, body, s);
  for (let y = y0 + 3; y < BASE_Y; y += 4) hline(ctx, y, x0, x1, shade(body, -40), s);
  vline(ctx, x0, y0, BASE_Y, shade(body, -50), s);
  vline(ctx, x1, y0, BASE_Y, shade(body, -50), s);
  hline(ctx, y0, x0, x1, shade(body, 35), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -50), s);
}

// ── contents ──────────────────────────────────────────────────────────────
/** A heaped pile of shaded balls sitting on a rim — produce, nuts, candy. */
function mound(ctx, s, rng, { cx = 16, rimY = 17, spread = 9, colors, count = 7, rMin = 2, rMax = 3 }) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
    const r = rMin + Math.floor(rng() * (rMax - rMin + 1));
    pts.push({
      x: cx + Math.round(t * spread),
      y: rimY - 1 - Math.round((1 - t * t) * 3) - Math.round(rng() * 1.4),
      r,
      c: colors[i % colors.length],
      k: Math.abs(t),
    });
  }
  pts.sort((a, b) => b.k - a.k);   // outside first so the middle overlaps forward
  for (const p of pts) ball(ctx, p.x, p.y, p.r, p.c, s);
  return pts;
}

function leafTop(ctx, s, x, y, c = '#5E8A3C') {
  px(ctx, x, y, c, s); px(ctx, x - 1, y - 1, c, s); px(ctx, x + 1, y - 1, c, s);
  px(ctx, x, y - 2, shade(c, 30), s);
}

function steam(ctx, s, { cx = 16, y = 12, color = 'rgba(255,255,255,0.75)' }) {
  for (const dx of [-4, 0, 4]) {
    for (let i = 0; i < 4; i++) px(ctx, cx + dx + (i % 2 ? 1 : 0), y - i * 2, color, s);
  }
}

function specks(ctx, s, rng, { cx, cy, r, color, n = 4 }) {
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * (r - 0.6);
    px(ctx, Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), color, s);
  }
}

function noodleSwirl(ctx, s, { cx = 16, y0 = 19, rows = 4, color = '#F2D98B' }) {
  for (let i = 0; i < rows; i++) {
    const y = y0 + i;
    const w = 9 - i;
    for (let x = cx - w; x <= cx + w; x++) {
      px(ctx, x, y + ((x + i) % 3 === 0 ? -1 : 0), (x + i) % 2 ? color : shade(color, -30), s);
    }
  }
}

// ── backdrops ─────────────────────────────────────────────────────────────
function backdrop(ctx, s, wall, floor) {
  box(ctx, 0, 0, G - 1, BASE_Y, wall, s);
  hline(ctx, 3, 0, G - 1, shade(wall, 18), s);
  hline(ctx, 4, 0, G - 1, shade(wall, 10), s);
  box(ctx, 0, BASE_Y + 1, G - 1, G - 1, floor, s);
  hline(ctx, BASE_Y + 1, 0, G - 1, shade(floor, -35), s);
  hline(ctx, BASE_Y + 1, 6, 25, shade(floor, -60), s);   // contact shadow
  hline(ctx, BASE_Y + 2, 9, 22, shade(floor, -45), s);
}

// ── the scenes, one per shelf category ────────────────────────────────────
export const SCENES = {
  veggies: (ctx, s, rng) => {
    backdrop(ctx, s, '#DCE7CC', '#B7C79E');
    const pts = mound(ctx, s, rng, {
      rimY: 17, colors: ['#D94F3D', '#E8892B', '#6FA83C', '#8CC152', '#C0392B', '#4F8A2E', '#E5B93C'],
      count: 7, rMin: 2, rMax: 3,
    });
    for (const p of pts.slice(0, 3)) leafTop(ctx, s, p.x, p.y - p.r);
    basket(ctx, s, {});
    // a carrot leaning out over the rim
    for (let i = 0; i < 4; i++) hline(ctx, 15 + i, 22 + i, 25 - i, '#E8892B', s);
    leafTop(ctx, s, 24, 14);
  },

  fruits: (ctx, s, rng) => {
    backdrop(ctx, s, '#F6E2DC', '#D8B7AC');
    mound(ctx, s, rng, {
      rimY: 17, colors: ['#D0342C', '#F0A03A', '#E8C33B', '#8E4FA8', '#D94F6A', '#E86A2B', '#C0392B'],
      count: 7, rMin: 2, rMax: 3,
    });
    leafTop(ctx, s, 13, 11); leafTop(ctx, s, 20, 12);
    basket(ctx, s, {});
    // loose berries spilling in front of the basket
    ball(ctx, 6, 24, 1.6, '#4B2E83', s);
    ball(ctx, 9, 25, 1.4, '#2F4E9B', s);
    ball(ctx, 25, 24, 1.6, '#B02A4A', s);
    ball(ctx, 27, 25, 1.3, '#4B2E83', s);
  },

  seasoning: (ctx, s) => {
    backdrop(ctx, s, '#EFE0C4', '#CDB489');
    const jars = [[6, '#C0392B', 15], [16, '#E0A32E', 13], [26, '#7B4B2A', 16]];
    for (const [cx, fill, top] of jars) {
      box(ctx, cx - 3, top - 3, cx + 3, top - 2, '#8C6A3F', s);          // cork
      hline(ctx, top - 3, cx - 3, cx + 3, '#A9855A', s);
      box(ctx, cx - 3, top - 1, cx + 3, BASE_Y, '#DCE9E2', s);           // glass
      box(ctx, cx - 3, top + 2, cx + 3, BASE_Y - 1, fill, s);            // ground spice
      for (let y = top + 3; y < BASE_Y - 1; y += 2) px(ctx, cx + ((y % 4) ? 1 : -1), y, shade(fill, 40), s);
      vline(ctx, cx - 2, top, BASE_Y - 1, 'rgba(255,255,255,0.45)', s);  // glare
      vline(ctx, cx + 3, top - 1, BASE_Y, shade('#DCE9E2', -45), s);
      hline(ctx, BASE_Y, cx - 3, cx + 3, '#8A7F68', s);
    }
    // a scatter of loose spice on the counter
    for (const [x, c] of [[11, '#C0392B'], [12, '#E0A32E'], [21, '#7B4B2A'], [20, '#E0A32E']]) px(ctx, x, BASE_Y, c, s);
  },

  teas_cocoa: (ctx, s) => {
    backdrop(ctx, s, '#E6DCC6', '#C2AF8B');
    steam(ctx, s, { cx: 15, y: 13 });
    mug(ctx, s, { body: '#F0EAD8' });
    box(ctx, 10, 16, 20, 18, '#8C5A2B', s);                              // the brew
    hline(ctx, 16, 10, 20, '#A9723A', s);
    // tea-bag string and tag over the rim
    vline(ctx, 19, 16, 20, '#EFE7D4', s);
    box(ctx, 18, 20, 21, 22, '#E0A32E', s);
    leafTop(ctx, s, 24, 24, '#4F8A2E'); leafTop(ctx, s, 7, 25, '#4F8A2E');
  },

  coffee: (ctx, s, rng) => {
    backdrop(ctx, s, '#E3D6C3', '#BCA383');
    steam(ctx, s, { cx: 15, y: 13 });
    mug(ctx, s, { body: '#F3EADA' });
    box(ctx, 10, 16, 20, 18, '#4A2C17', s);
    hline(ctx, 16, 11, 19, '#6B4023', s);
    for (const [x, y] of [[5, 24], [8, 25], [25, 24], [27, 25], [23, 25]]) {
      ball(ctx, x, y, 1.6, '#5B3418', s);
      px(ctx, x, y, '#3A2110', s);                                       // the bean's crease
      if (rng() > 0.5) px(ctx, x, y - 1, '#3A2110', s);
    }
  },

  beverages: (ctx, s) => {
    backdrop(ctx, s, '#D5E6EC', '#A9C4CE');
    bottle(ctx, s, { cx: 8, w: 3, y0: 6, body: '#4A8FBF', labelC: '#F3EADA' });
    tinCan(ctx, s, { x0: 14, x1: 21, y0: 15, body: '#C9CDD2', band: '#C0392B' });
    // a glass with a straw
    box(ctx, 24, 16, 29, BASE_Y, 'rgba(255,255,255,0.55)', s);
    box(ctx, 24, 19, 29, BASE_Y - 1, '#E0A32E', s);
    vline(ctx, 24, 16, BASE_Y, '#EFF6F8', s);
    vline(ctx, 29, 16, BASE_Y, shade('#A9C4CE', -30), s);
    for (let i = 0; i < 5; i++) px(ctx, 27 + (i % 2 ? 0 : 1), 13 + i, '#C0392B', s);
  },

  plant_based: (ctx, s) => {
    backdrop(ctx, s, '#DCE9D2', '#B0C69B');
    carton(ctx, s, { x0: 11, x1: 22, y0: 8, body: '#F2EDE0', accent: '#6E8259' });
    // sprout emblem on the carton panel
    vline(ctx, 16, 16, 20, '#3F6B24', s);
    for (const d of [-1, 1]) {
      px(ctx, 16 + d, 17, '#8CC152', s);
      px(ctx, 16 + d * 2, 16, '#8CC152', s);
      px(ctx, 16 + d * 2, 17, '#6FA83C', s);
    }
    // a block of tofu in front, one slice cut off it
    box(ctx, 3, 19, 10, BASE_Y, '#F6F1E2', s);
    hline(ctx, 19, 3, 10, '#FFFDF4', s);
    vline(ctx, 7, 20, BASE_Y - 1, '#E2DAC4', s);        // the cut
    vline(ctx, 10, 19, BASE_Y, '#D6CDB4', s);
    hline(ctx, BASE_Y, 3, 10, '#C4B99C', s);
    leafTop(ctx, s, 25, 25, '#4F8A2E');
  },

  pasta: (ctx, s, rng) => {
    backdrop(ctx, s, '#EFE3C8', '#CBB68C');
    jar(ctx, s, { x0: 10, x1: 21, y0: 10, glass: '#E4EFE9', lid: '#8C6A3F' });
    for (let x = 11; x <= 20; x++) {                                      // dry strands
      const top = 11 + (rng() > 0.5 ? 0 : 1);
      vline(ctx, x, top, BASE_Y - 1, x % 2 ? '#EFCF7E' : '#E0B85C', s);
    }
    vline(ctx, 11, 12, BASE_Y - 2, 'rgba(255,255,255,0.4)', s);
    // a piece of penne and a bow-tie resting on the counter
    for (let i = 0; i < 3; i++) hline(ctx, 24 + i, 4 + i, 8 + i, '#EFCF7E', s);
    px(ctx, 24, 24, '#E0A32E', s); px(ctx, 26, 24, '#E0A32E', s);
    px(ctx, 25, 25, '#EFCF7E', s); px(ctx, 24, BASE_Y, '#E0A32E', s); px(ctx, 26, BASE_Y, '#E0A32E', s);
  },

  ramen: (ctx, s) => {
    backdrop(ctx, s, '#E9D8C6', '#C4A98B');
    steam(ctx, s, { cx: 16, y: 15 });
    box(ctx, 6, 18, 26, 19, '#8C4A22', s);                                // broth
    noodleSwirl(ctx, s, { cx: 16, y0: 19, rows: 3, color: '#F2D98B' });
    ball(ctx, 10, 20, 2.4, '#FBF3DC', s);                                 // half an egg
    ball(ctx, 10, 20, 1.2, '#E8A33A', s);
    box(ctx, 20, 18, 24, 21, '#2E3A2A', s);                               // nori
    px(ctx, 24, 18, '#46583F', s);
    ball(ctx, 16, 18, 1.6, '#6FA83C', s);                                 // scallion
    bowl(ctx, s, { cx: 16, rx: 12, y0: 20, color: '#C0392B', dark: '#8E2A20', rim: '#F3EADA' });
    // a pair of chopsticks standing in the bowl
    for (let i = 0; i < 12; i++) {
      const y = 9 + i;
      px(ctx, 22 + Math.round(i * 0.35), y, '#C9A06A', s);
      px(ctx, 24 + Math.round(i * 0.35), y, '#A97A45', s);
    }
  },

  canned: (ctx, s) => {
    backdrop(ctx, s, '#E2E5E8', '#B4BAC0');
    tinCan(ctx, s, { x0: 2, x1: 9, y0: 16, body: '#B9BEC4', band: '#6E8259' });
    tinCan(ctx, s, { x0: 12, x1: 19, y0: 12, body: '#C6CBD0', band: '#C0392B' });
    tinCan(ctx, s, { x0: 22, x1: 29, y0: 17, body: '#B9BEC4', band: '#E0A32E' });
  },

  sweets: (ctx, s, rng) => {
    backdrop(ctx, s, '#F3E0E4', '#D5B4B9');
    plate(ctx, s, { cx: 16, rx: 13, y0: 22, color: '#F8F4EA' });
    // three cookies, deliberately three different doughs
    const cookies = [[8, 20, '#C98A3E', '#4A2C17'], [16, 18, '#E3B673', '#7B4B2A'], [24, 20, '#8C5A3C', '#F3EADA']];
    for (const [cx, cy, dough, chip] of cookies) {
      ball(ctx, cx, cy, 3.4, dough, s);
      specks(ctx, s, rng, { cx, cy, r: 2.6, color: chip, n: 5 });
    }
    // a couple of candies at the front
    ball(ctx, 5, 24, 1.6, '#D94F6A', s);
    ball(ctx, 27, 24, 1.6, '#8E4FA8', s);
  },

  snacks: (ctx, s) => {
    backdrop(ctx, s, '#F0E4C8', '#CFB98A');
    bag(ctx, s, { x0: 9, x1: 23, y0: 9, body: '#E0A32E', accent: '#33302A' });
    hline(ctx, 20, 11, 21, '#F6DCA0', s);
    // chips that fell out
    for (const [x, y, c] of [[4, 23, '#E8C77A'], [6, BASE_Y, '#D9B15E'], [26, 24, '#E8C77A'], [28, BASE_Y, '#D9B15E']]) {
      px(ctx, x, y, c, s); px(ctx, x + 1, y, c, s); px(ctx, x, y - 1, shade(c, 30), s);
    }
  },

  dairy: (ctx, s) => {
    backdrop(ctx, s, '#E4EAF0', '#B7C2CE');
    carton(ctx, s, { x0: 6, x1: 16, y0: 8, body: '#FAF7EE', accent: '#4A8FBF' });
    // cheese wedge
    for (let i = 0; i < 7; i++) hline(ctx, 20 + i, 19, 19 + i * 1.4, '#E8B93C', s);
    px(ctx, 22, 23, '#C79A24', s); px(ctx, 24, 25, '#C79A24', s);
    // an egg
    ball(ctx, 28, 24, 2.2, '#F6ECD8', s);
  },

  meat: (ctx, s, rng) => {
    backdrop(ctx, s, '#EFDCD8', '#CFA9A2');
    plate(ctx, s, { cx: 16, rx: 12, y0: 22 });
    // a bone-in steak: a rounded cut with a cream fat rim and a bone through it
    const widths = [5, 7, 8, 8, 8, 7, 5];
    widths.forEach((w, i) => {
      const y = 14 + i;
      hline(ctx, y, 13 - w, 13 + w, '#A83A30', s);
      px(ctx, 13 - w, y, '#F0E2C8', s);
      px(ctx, 13 + w, y, '#F0E2C8', s);
    });
    hline(ctx, 14, 8, 18, '#F0E2C8', s);                                   // fat cap along the top
    hline(ctx, 20, 8, 18, '#7E241F', s);                                   // seared underside
    for (let i = 0; i < 7; i++) {                                          // marbling
      px(ctx, 9 + Math.floor(rng() * 9), 15 + Math.floor(rng() * 5), '#C9564C', s);
    }
    box(ctx, 20, 16, 24, 18, '#F5EFE0', s);                                // the bone
    px(ctx, 24, 15, '#F5EFE0', s); px(ctx, 24, 19, '#F5EFE0', s);
    px(ctx, 25, 16, '#E0D6C0', s); px(ctx, 25, 18, '#E0D6C0', s);
    hline(ctx, 18, 20, 24, '#DED2B8', s);
  },

  seafood: (ctx, s) => {
    backdrop(ctx, s, '#D8E8EC', '#AAC6CE');
    plate(ctx, s, { cx: 16, rx: 13, y0: 23 });
    // fish body
    for (let i = 0; i < 7; i++) {
      const w = Math.round(9 - Math.abs(3 - i) * 2.4);
      hline(ctx, 16 + i, 14 - w, 14 + w, i < 3 ? '#7FB3C8' : '#5C93AC', s);
    }
    for (let i = 0; i < 4; i++) hline(ctx, 17 + i, 23 + Math.abs(1.5 - i), 26, '#7FB3C8', s);  // tail
    px(ctx, 9, 18, '#33302A', s);                                          // eye
    for (const [x, y] of [[14, 19], [17, 20], [12, 21]]) px(ctx, x, y, '#3E6E86', s);
    ball(ctx, 26, 24, 2, '#E8C33B', s);                                    // lemon wedge
  },

  bakery: (ctx, s) => {
    backdrop(ctx, s, '#EEE0C6', '#CBAF85');
    // a domed loaf: narrow at the crown, square-shouldered at the board
    const widths = [4, 6, 7, 8, 8, 8, 8, 8];
    widths.forEach((w, i) => {
      const y = 19 + i;
      hline(ctx, y, 11 - w, 11 + w, i === 0 ? '#DFAF6A' : '#C88C44', s);
    });
    hline(ctx, BASE_Y, 3, 19, '#9C6A2C', s);                              // baked base
    for (let i = 0; i < 3; i++) {                                          // scored slashes
      px(ctx, 7 + i * 4, 20 + i, '#8C5A2B', s);
      px(ctx, 8 + i * 4, 20 + i, '#8C5A2B', s);
      px(ctx, 8 + i * 4, 21 + i, '#8C5A2B', s);
    }
    // two cut slices standing behind the loaf
    for (const sx of [21, 26]) {
      box(ctx, sx, 15, sx + 4, BASE_Y, '#F0DDB4', s);                      // crumb
      hline(ctx, 15, sx, sx + 4, '#C88C44', s);                            // crust top
      vline(ctx, sx, 15, BASE_Y, '#C88C44', s);
      vline(ctx, sx + 4, 15, BASE_Y, '#A9702F', s);
      hline(ctx, BASE_Y, sx, sx + 4, '#A9702F', s);
      px(ctx, sx + 2, 19, '#E2CBA0', s); px(ctx, sx + 1, 22, '#E2CBA0', s);
    }
  },

  grains: (ctx, s, rng) => {
    backdrop(ctx, s, '#EDE6D2', '#C8BC9A');
    sack(ctx, s, { cx: 15, y0: 11, body: '#DCCBA4', tie: '#8F5B1E' });
    box(ctx, 12, 15, 18, 19, '#F4EEDC', s);                                // open mouth of the sack
    for (let i = 0; i < 14; i++) px(ctx, 12 + Math.floor(rng() * 7), 15 + Math.floor(rng() * 5), '#E6DCBE', s);
    // a heap of loose grain poured out beside it, individual kernels visible
    const heap = [[24, BASE_Y, 6], [24, BASE_Y - 1, 5], [25, BASE_Y - 2, 3], [25, BASE_Y - 3, 2]];
    for (const [x, y, w] of heap) hline(ctx, y, x, x + w, '#F2EAD2', s);
    for (let i = 0; i < 9; i++) {
      px(ctx, 24 + Math.floor(rng() * 6), BASE_Y - Math.floor(rng() * 3), '#D8CBA6', s);
    }
    hline(ctx, BASE_Y + 1, 24, 30, '#C8BC9A', s);
  },

  baking: (ctx, s, rng) => {
    backdrop(ctx, s, '#F2EBDD', '#D2C6AC');
    // a paper flour sack with a folded top and a banded label
    box(ctx, 4, 11, 16, BASE_Y, '#E9DCBE', s);
    hline(ctx, 11, 4, 16, '#CDBD99', s);                                   // folded seam
    hline(ctx, 12, 4, 16, '#D9CAA8', s);
    box(ctx, 5, 15, 15, 21, '#F7F1E2', s);                                 // label panel
    hline(ctx, 16, 5, 15, '#C0392B', s);
    hline(ctx, 20, 5, 15, '#C0392B', s);
    for (let x = 7; x <= 13; x += 2) px(ctx, x, 18, '#B9A987', s);         // label lettering
    vline(ctx, 16, 11, BASE_Y, '#C6B692', s);
    hline(ctx, BASE_Y, 4, 16, '#B6A582', s);
    // flour dusted across the counter
    for (let i = 0; i < 14; i++) px(ctx, 3 + Math.floor(rng() * 22), 24 + Math.floor(rng() * 3), '#FBF7EC', s);
    // rolling pin above, egg in front
    box(ctx, 20, 14, 28, 16, '#C98A3E', s);
    hline(ctx, 14, 21, 27, '#DDA45C', s);
    box(ctx, 18, 15, 19, 15, '#8C6A3F', s); box(ctx, 29, 15, 30, 15, '#8C6A3F', s);
    ball(ctx, 24, 22, 2.6, '#EFDCB4', s);                                  // egg — warm enough to read against the flour
  },

  condiments: (ctx, s) => {
    backdrop(ctx, s, '#EDE7D6', '#C9C0A4');
    bottle(ctx, s, { cx: 6, w: 3, y0: 8, body: '#C0392B', cap: '#33302A', labelC: '#F3EADA' });
    bottle(ctx, s, { cx: 16, w: 3, y0: 6, body: '#E0A32E', cap: '#33302A', labelC: '#F3EADA' });
    bottle(ctx, s, { cx: 26, w: 3, y0: 9, body: '#4A2C17', cap: '#33302A', labelC: '#F3EADA' });
  },

  oils: (ctx, s) => {
    backdrop(ctx, s, '#E8EBD6', '#C2C79E');
    bottle(ctx, s, { cx: 11, w: 4, y0: 4, body: '#8FA83C', cap: '#33302A', labelC: '#F3EADA' });
    bottle(ctx, s, { cx: 23, w: 3, y0: 10, body: '#6B3A1E', cap: '#33302A', labelC: '#F3EADA' });
    // a pour catching the light
    for (let i = 0; i < 4; i++) px(ctx, 16 + i, 12 + i, '#E8C33B', s);
  },

  frozen: (ctx, s) => {
    backdrop(ctx, s, '#D8EAF2', '#A9C8D8');
    // a frosted block
    box(ctx, 8, 12, 24, BASE_Y, '#CFE6F2', s);
    hline(ctx, 12, 8, 24, '#EAF6FC', s);
    vline(ctx, 9, 13, BASE_Y - 1, '#EAF6FC', s);
    vline(ctx, 24, 12, BASE_Y, '#8FB6CC', s);
    hline(ctx, BASE_Y, 8, 24, '#8FB6CC', s);
    // snowflake
    const cx = 16, cy = 19;
    vline(ctx, cx, cy - 4, cy + 4, '#5C93AC', s);
    hline(ctx, cy, cx - 4, cx + 4, '#5C93AC', s);
    for (let i = 1; i <= 3; i++) {
      px(ctx, cx - i, cy - i, '#5C93AC', s); px(ctx, cx + i, cy + i, '#5C93AC', s);
      px(ctx, cx + i, cy - i, '#5C93AC', s); px(ctx, cx - i, cy + i, '#5C93AC', s);
    }
    for (const [x, y] of [[4, 16], [28, 14], [5, 22], [27, 21]]) px(ctx, x, y, '#FFFFFF', s);
  },

  breakfast: (ctx, s, rng) => {
    backdrop(ctx, s, '#F0E2C8', '#CFB78C');
    packBox(ctx, s, { x0: 3, x1: 15, y0: 8, body: '#C0392B', panel: '#F3EADA' });
    for (let i = 0; i < 5; i++) px(ctx, 6 + i * 2, 14 + (i % 2), '#E0A32E', s);
    // a bowl of cereal loops
    for (const [x, y, c] of [[20, 20, '#E0A32E'], [24, 20, '#C0392B'], [22, 18, '#8CC152'], [26, 21, '#8E4FA8']]) {
      ball(ctx, x, y, 1.8, c, s);
      px(ctx, x, y, '#F0E2C8', s);                                         // the hole in the loop
    }
    bowl(ctx, s, { cx: 23, rx: 8, y0: 21, color: '#F0EAD8', dark: '#CBBFA4', rim: '#8B7C5F' });
    if (rng() > 0.5) px(ctx, 19, 22, '#FFFFFF', s);
  },

  nuts: (ctx, s, rng) => {
    backdrop(ctx, s, '#EDE0C8', '#CBB48A');
    mound(ctx, s, rng, {
      cx: 16, rimY: 19, spread: 7,
      colors: ['#B07C4A', '#8C5A2B', '#D6B27A', '#A9713F', '#6B4423', '#C79A5E'],
      count: 7, rMin: 1, rMax: 2,
    });
    bowl(ctx, s, { cx: 16, rx: 10, y0: 19, color: '#B98A55', dark: '#8F6538', rim: '#D8AE76' });
    ball(ctx, 6, 24, 1.6, '#8C5A2B', s);
    ball(ctx, 26, 25, 1.6, '#D6B27A', s);
  },

  other: (ctx, s) => {
    backdrop(ctx, s, '#E7E1D3', '#C2B9A2');
    crate(ctx, s, { x0: 7, x1: 24, y0: 14, body: '#B98A55' });
    // an unlabelled tag — nothing claimed about what's inside
    box(ctx, 12, 17, 19, 21, '#F3EADA', s);
    hline(ctx, 19, 13, 18, '#B4A98E', s);
  },
};

// ── render + cache ────────────────────────────────────────────────────────
const cache = new Map();

/**
 * A PNG data URL of the pixel scene for one shelf category.
 * Cached per (category, size) — drawing is cheap but a grid of 25 tiles
 * re-rendering on every keystroke in the pantry is not.
 */
export function categoryIconUrl(catId, { size = DEFAULT_SIZE } = {}) {
  if (typeof document === 'undefined') return '';
  const key = `${catId}:${size}`;
  if (cache.has(key)) return cache.get(key);

  const scene = SCENES[catId] || SCENES.other;
  const s = Math.max(1, Math.round(size / G));
  const canvas = document.createElement('canvas');
  canvas.width = G * s;
  canvas.height = G * s;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let url = '';
  try {
    scene(ctx, s, mulberry32(hashStr(String(catId))));
    url = canvas.toDataURL('image/png');
  } catch { url = ''; }

  cache.set(key, url);
  return url;
}

export { G as ICON_GRID };
