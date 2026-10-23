/* ════════════════════════════════════════════════════════════
   Merged module — originally three files in src/lib/:
     · pixelArt.js         (photo → pixel-art engine)
     · pixelBoomerang.js   (multi-frame palette + GIF encoding)
     · boomerangCapture.js (camera burst capture)
   ════════════════════════════════════════════════════════════ */

/* ── from pixelArt.js ──────────────────────────────────────────
 * Dig In pixel-art engine — shared by the Pixel Creator page and the
 * recipe-step "snap your progress" capture flow.
 *
 * The photo pipeline (`convertPhoto`) uses real palette extraction
 * (median-cut over the photo's own colors), then maps each cell to its
 * nearest palette color flat — that's what gets a phone photo of a
 * half-finished dish to read as clean, solid-block pixel art instead of
 * muddy or noisy blocks. Floyd–Steinberg dithering is available (`dither:
 * true`) but off by default: at these block sizes each dithered "pixel" is a
 * whole visible cell rather than a screen pixel, so the alternating-color
 * pattern that fakes a gradient reads as speckle instead of a smooth blend.
 */

export const GRID = 32; // base grid resolution (32×32) for the hand-drawn food icons

// ── Colour palettes ────────────────────────────────────────────────────────
export const PALETTES = {
  rpg: {
    label: 'RPG Warm',
    bg:      '#f5edd0',
    outline: '#3a2010',
    hi:      '#fafafa',
    shades: ['#f4c77a','#e8a84a','#c47a2a','#8a4820',
             '#6aaa4a','#4a8a30','#f4d44a','#e84a3a',
             '#f07858','#5c3018','#d08030','#a05030',
             '#d0e4f0','#b8d0e8','#e8c8a0','#c0a870'],
  },
  neon: {
    label: 'Neon Arcade',
    bg:      '#0a0a1a',
    outline: '#1a1040',
    hi:      '#ffffff',
    shades: ['#ff00ff','#00ffff','#ff6600','#ffff00',
             '#00ff00','#ff0066','#6600ff','#ff6699',
             '#00ccff','#ff3300','#ccff00','#ff99cc',
             '#3300ff','#ff9900','#00ff99','#cc00ff'],
  },
  pastel: {
    label: 'Soft Pastel',
    bg:      '#fff9f0',
    outline: '#4a3830',
    hi:      '#ffffff',
    shades: ['#ffb3ba','#ffdfba','#ffffba','#baffc9',
             '#bae1ff','#e8b4f8','#ffd9b3','#b3ffe0',
             '#ffc8e8','#d4e8ff','#fff0b3','#ffd4d4',
             '#b3f0d4','#e8d4ff','#ffd9c8','#c8f0ff'],
  },
  monochrome: {
    label: 'Monochrome',
    bg:      '#f8f8f8',
    outline: '#282828',
    hi:      '#ffffff',
    shades: ['#ffffff','#e0e0e0','#c0c0c0','#a0a0a0',
             '#808080','#606060','#404040','#303030',
             '#181818','#d8d8d8','#b8b8b8','#989898',
             '#787878','#585858','#484848','#383838'],
  },
  harvest: {
    label: 'Harvest',
    bg:      '#ede8c8',
    outline: '#30200c',
    hi:      '#fff8e8',
    shades: ['#f8d870','#e8b040','#c87820','#904810',
             '#88c848','#508828','#f8f0c0','#e85030',
             '#f09050','#703010','#d0a848','#a06028',
             '#d8e8a0','#88a840','#f8c880','#c89850'],
  },
  natural: {
    label: 'Natural',
    bg:      '#f0ede6',
    outline: '#28201a',
    hi:      '#ffffff',
    shades: [],
  },
  blocks: {
    label: 'Building Blocks',
    bg:      '#dcd8ce',
    outline: '#1a2838',
    hi:      '#ffffff',
    shades: ['#d42718','#f4cf42','#1060c4','#2a7d46',
             '#1a2838','#f4f4f4','#ff8c1a','#a0a5a9',
             '#5c2e14','#4b9f4b','#923978','#e4cd9e',
             '#78dbd8','#fc97ac','#e4adc8','#6c6e68'],
  },
};

// ── Cell drawing helpers ───────────────────────────────────────────────────
export function cell(ctx, x, y, color, s) {
  if (!color) return;
  ctx.fillStyle = color;
  ctx.fillRect(x * s, y * s, s, s);
}

export function row(ctx, y, x0, x1, color, s) {
  if (!color) return;
  ctx.fillStyle = color;
  ctx.fillRect(x0 * s, y * s, (x1 - x0 + 1) * s, s);
}

export function col(ctx, x, y0, y1, color, s) {
  if (!color) return;
  ctx.fillStyle = color;
  ctx.fillRect(x * s, y0 * s, s, (y1 - y0 + 1) * s);
}

// ── Grid overlay ───────────────────────────────────────────────────────────
export function drawGrid(ctx, size, cellSize, alpha = 0.12) {
  ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= size; i += cellSize) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }
}

// ── Outline pass ──────────────────────────────────────────────────────────
// Adds a dark pixel next to every non-background edge
export function drawOutline(ctx, size, cellSize, outlineColor, bgColor) {
  const imageData = ctx.getImageData(0, 0, size, size);
  const d = imageData.data;
  const bgR = parseInt(bgColor.slice(1, 3), 16);
  const bgG = parseInt(bgColor.slice(3, 5), 16);
  const bgB = parseInt(bgColor.slice(5, 7), 16);

  function isBg(idx) {
    return (
      Math.abs(d[idx] - bgR) < 20 &&
      Math.abs(d[idx + 1] - bgG) < 20 &&
      Math.abs(d[idx + 2] - bgB) < 20
    );
  }

  const outR = parseInt(outlineColor.slice(1, 3), 16);
  const outG = parseInt(outlineColor.slice(3, 5), 16);
  const outB = parseInt(outlineColor.slice(5, 7), 16);
  const out = new Uint8ClampedArray(imageData.data);

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = (y * size + x) * 4;
      if (!isBg(idx)) continue;
      const neighbors = [
        ((y - 1) * size + x) * 4,
        ((y + 1) * size + x) * 4,
        (y * size + x - 1) * 4,
        (y * size + x + 1) * 4,
      ];
      if (neighbors.some(n => !isBg(n) && out[n + 3] > 0)) {
        out[idx] = outR; out[idx + 1] = outG; out[idx + 2] = outB; out[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(new ImageData(out, size, size), 0, 0);
}

// ── Photo → Pixel Art converter ───────────────────────────────────────────
export function posterize(v, levels) {
  const step = 255 / (levels - 1);
  return Math.round(Math.round(v / step) * step);
}

export const BIT_CELL = { 8: 20, 16: 12, 32: 8, 64: 5, 128: 2 };
const PALETTE_COLOR_COUNT = { 8: 5, 16: 8, 32: 10, 64: 16, 128: 24 };

/** Applies the same warm/neon/pastel/monochrome style shift used across the
 *  app, but to a single extracted palette swatch rather than every raw pixel —
 *  that's what keeps regions flat and clean instead of grainy. */
function liftShadows(r, g, b, floor = 45) {
  const lum = r * 0.299 + g * 0.587 + b * 0.114;
  if (lum < floor) {
    const lift = (floor - lum) * 0.7;
    r = Math.min(255, r + Math.round(lift * 1.1));
    g = Math.min(255, g + Math.round(lift));
    b = Math.min(255, b + Math.round(lift * 0.9));
  }
  return { r, g, b };
}

function boostSaturation(r, g, b, factor) {
  const lum = r * 0.299 + g * 0.587 + b * 0.114;
  r = Math.min(255, Math.max(0, Math.round(lum + (r - lum) * factor)));
  g = Math.min(255, Math.max(0, Math.round(lum + (g - lum) * factor)));
  b = Math.min(255, Math.max(0, Math.round(lum + (b - lum) * factor)));
  return { r, g, b };
}

function tintSwatch({ r, g, b }, paletteMode) {
  if (paletteMode === 'natural') {
    ({ r, g, b } = liftShadows(r, g, b, 70));
    ({ r, g, b } = boostSaturation(r, g, b, 1.6));
    return { r, g, b };
  } else if (paletteMode === 'rpg' || paletteMode === 'harvest') {
    ({ r, g, b } = liftShadows(r, g, b, 65));
    ({ r, g, b } = boostSaturation(r, g, b, 1.5));
    r = Math.min(255, r + 22);
    g = Math.min(255, g + 12);
    b = Math.max(0,   b - 10);
  } else if (paletteMode === 'neon') {
    ({ r, g, b } = liftShadows(r, g, b, 40));
    const mx = Math.max(r, g, b);
    if (mx === r)      { r = Math.min(255, r + 60); g = Math.max(0, g - 30); b = Math.max(0, b - 30); }
    else if (mx === g) { g = Math.min(255, g + 60); r = Math.max(0, r - 30); b = Math.max(0, b - 30); }
    else                { b = Math.min(255, b + 60); r = Math.max(0, r - 30); g = Math.max(0, g - 30); }
  } else if (paletteMode === 'monochrome') {
    const lum = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    const lifted = Math.max(lum, 45);
    r = g = b = lifted;
  } else if (paletteMode === 'pastel') {
    r = Math.min(255, Math.round(r * 0.45 + 140));
    g = Math.min(255, Math.round(g * 0.45 + 140));
    b = Math.min(255, Math.round(b * 0.45 + 140));
  } else if (paletteMode === 'blocks') {
    ({ r, g, b } = liftShadows(r, g, b, 55));
    ({ r, g, b } = boostSaturation(r, g, b, 1.6));
  }
  return { r, g, b };
}

function colorRange(bucket) {
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
  for (const c of bucket) {
    if (c.r < minR) minR = c.r; if (c.r > maxR) maxR = c.r;
    if (c.g < minG) minG = c.g; if (c.g > maxG) maxG = c.g;
    if (c.b < minB) minB = c.b; if (c.b > maxB) maxB = c.b;
  }
  const rangeR = maxR - minR, rangeG = maxG - minG, rangeB = maxB - minB;
  if (rangeR >= rangeG && rangeR >= rangeB) return { range: rangeR, component: 'r' };
  if (rangeG >= rangeB) return { range: rangeG, component: 'g' };
  return { range: rangeB, component: 'b' };
}

function averageColor(bucket) {
  let r = 0, g = 0, b = 0, total = 0;
  for (const c of bucket) { r += c.r * c.count; g += c.g * c.count; b += c.b * c.count; total += c.count; }
  return { r: Math.round(r / total), g: Math.round(g / total), b: Math.round(b / total) };
}

/** Median-cut palette extraction — finds the `targetCount` colors that best
 *  represent the photo, rather than quantizing each pixel independently. */
function medianCutPalette(imageData, targetCount) {
  const data = imageData.data;
  const byKey = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = (r << 16) | (g << 8) | b;
    const existing = byKey.get(key);
    if (existing) existing.count++;
    else byKey.set(key, { r, g, b, count: 1 });
  }
  let buckets = [[...byKey.values()]];
  while (buckets.length < targetCount) {
    let splitIdx = -1, maxRange = -1, splitComponent = 'r';
    buckets.forEach((bucket, i) => {
      if (bucket.length < 2) return;
      const { range, component } = colorRange(bucket);
      if (range > maxRange) { maxRange = range; splitIdx = i; splitComponent = component; }
    });
    if (splitIdx === -1) break;
    const bucket = buckets[splitIdx];
    bucket.sort((a, b) => a[splitComponent] - b[splitComponent]);
    const mid = Math.floor(bucket.length / 2);
    buckets.splice(splitIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
  }
  return buckets.filter(b => b.length).map(averageColor);
}

function findClosestColor(color, palette) {
  let closest = palette[0], smallest = Infinity;
  for (const p of palette) {
    const d = (color.r - p.r) ** 2 + (color.g - p.g) ** 2 + (color.b - p.b) ** 2;
    if (d < smallest) { smallest = d; closest = p; }
  }
  return closest;
}

function nearestColorMapping(imageData, palette) {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    const nearest = findClosestColor({ r: data[i], g: data[i + 1], b: data[i + 2] }, palette);
    data[i] = nearest.r; data[i + 1] = nearest.g; data[i + 2] = nearest.b;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

/** Floyd–Steinberg dithering against a fixed palette — distributes
 *  quantization error to neighbors so gradients (skin, sauce, steam) read as
 *  a smooth dotted blend instead of hard color bands. */
function floydSteinbergDither(imageData, palette) {
  const width = imageData.width, height = imageData.height;
  const data = new Float32Array(imageData.data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const old = { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
      const next = findClosestColor(old, palette);
      const err = { r: old.r - next.r, g: old.g - next.g, b: old.b - next.b };
      data[idx] = next.r; data[idx + 1] = next.g; data[idx + 2] = next.b;

      const spread = (dx, dy, factor) => {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
        const nIdx = (ny * width + nx) * 4;
        data[nIdx]     += err.r * factor;
        data[nIdx + 1] += err.g * factor;
        data[nIdx + 2] += err.b * factor;
      };
      spread(1, 0, 7 / 16);
      spread(-1, 1, 3 / 16);
      spread(0, 1, 5 / 16);
      spread(1, 1, 1 / 16);
    }
  }
  return new ImageData(new Uint8ClampedArray(data), width, height);
}

function downsample(imgEl, cols, rows) {
  // Nearest-neighbor downsample — each cell picks ONE source pixel instead of
  // blending neighbors, giving decisive color choices that quantize cleanly
  // into flat, crisp GBA-style blocks.
  const src = document.createElement('canvas');
  src.width = cols; src.height = rows;
  const sctx = src.getContext('2d');
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(imgEl, 0, 0, cols, rows);
  return sctx.getImageData(0, 0, cols, rows);
}

/**
 * Extracts a palette (tinted median-cut swatches) from one reference image at
 * a given bit depth/style. Split out from `convertPhoto` so a *burst* of
 * photos — e.g. the boomerang capture flow — can be quantized against a
 * single shared palette instead of each frame picking its own colors, which
 * is what keeps a multi-frame loop from flickering between frames.
 */
export function extractPalette(imgEl, bitDepth, paletteMode, outputSize = 384) {
  const cellSize = BIT_CELL[bitDepth] || 12;
  const cols = Math.floor(outputSize / cellSize);
  const rows = Math.floor(outputSize / cellSize);
  const imageData = downsample(imgEl, cols, rows);
  const colorCount = PALETTE_COLOR_COUNT[bitDepth] || 16;
  const palette = medianCutPalette(imageData, colorCount).map(c => tintSwatch(c, paletteMode));
  return { palette, cellSize, cols, rows, outputSize };
}

// ── Brick render mode — each cell as a raised, studded block instead of a
// flat square: a lightened top/left bevel, a darkened
// bottom/right bevel, and a circular stud in the middle. Only kicks in when
// the cell is big enough to actually show a stud (>=6px) — at finer bit
// depths (128-bit's 2px cells) there's no room for one, so it honestly
// falls back to a flat cell rather than drawing noise. ──────────────────
function parseColorString(c) {
  if (c[0] === '#') {
    return { r: parseInt(c.slice(1, 3), 16), g: parseInt(c.slice(3, 5), 16), b: parseInt(c.slice(5, 7), 16) };
  }
  const m = c.match(/\d+/g) || [0, 0, 0];
  return { r: +m[0], g: +m[1], b: +m[2] };
}
function shadeColor(c, amount) {
  const { r, g, b } = parseColorString(c);
  const adj = v => Math.max(0, Math.min(255, Math.round(v + amount)));
  return `rgb(${adj(r)},${adj(g)},${adj(b)})`;
}
function drawBrickCell(ctx, x, y, s, color) {
  const px = x * s, py = y * s;
  ctx.fillStyle = color;
  ctx.fillRect(px, py, s, s);

  if (s < 6) return; // too small for a visible bevel/stud — flat cell above is the honest result

  const bevel = Math.max(1, Math.round(s * 0.16));
  ctx.fillStyle = shadeColor(color, 65);
  ctx.fillRect(px, py, s, bevel);              // top highlight
  ctx.fillRect(px, py, bevel, s);              // left highlight
  ctx.fillStyle = shadeColor(color, -35);
  ctx.fillRect(px, py + s - bevel, s, bevel);   // bottom shadow
  ctx.fillRect(px + s - bevel, py, bevel, s);   // right shadow

  const r = s * 0.3;
  const cx = px + s / 2, cy = py + s / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor(color, 30);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = shadeColor(color, 75);
  ctx.fill();
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.strokeStyle = shadeColor(color, -25);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Downsamples + quantizes an image against an already-extracted palette,
 * returning the raw per-cell grid — real color plus real edge-detection
 * (a cell whose neighbors differ enough to read as a silhouette line) for
 * every cell. This is the one real implementation both the 2D renderer
 * below AND the 3D voxel builder (lib/visual/voxelArt.js) read from — a voxel
 * heightmap needs the exact same "what color is this cell, is it an edge"
 * data a flat pixel-art render does, just turned into height instead of a
 * flat fill. Always un-dithered (dithering fakes an in-between shade by
 * alternating two colors cell-to-cell, which would read as a fake edge
 * here, and doesn't mean anything for a solid 3D block anyway).
 */
export function quantizeToGrid(imgEl, paletteInfo, paletteMode) {
  const { palette, cellSize, cols, rows } = paletteInfo;
  const imageData = downsample(imgEl, cols, rows);
  const flatData = nearestColorMapping(imageData, palette).data;

  // Mode filter: replace isolated cells (whose color matches zero of their 4
  // neighbors) with the most popular neighbor color. Two passes clean up the
  // single-cell speckle that makes photo-converted pixel art look noisy.
  for (let pass = 0; pass < 2; pass++) {
    const snap = new Uint8ClampedArray(flatData);
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const i = (y * cols + x) * 4;
        const me = (snap[i] << 16) | (snap[i + 1] << 8) | snap[i + 2];
        const nIdxs = [
          ((y - 1) * cols + x) * 4, ((y + 1) * cols + x) * 4,
          (y * cols + x - 1) * 4,   (y * cols + x + 1) * 4,
        ];
        let match = 0;
        const votes = new Map();
        for (const ni of nIdxs) {
          const nk = (snap[ni] << 16) | (snap[ni + 1] << 8) | snap[ni + 2];
          if (nk === me) match++;
          votes.set(nk, (votes.get(nk) || 0) + 1);
        }
        if (match === 0) {
          let best = me, bestC = 0;
          for (const [k, c] of votes) if (c > bestC) { bestC = c; best = k; }
          flatData[i]     = (best >> 16) & 0xff;
          flatData[i + 1] = (best >> 8) & 0xff;
          flatData[i + 2] = best & 0xff;
        }
      }
    }
  }

  const at = (x, y) => {
    const i = (y * cols + x) * 4;
    return { r: flatData[i], g: flatData[i + 1], b: flatData[i + 2] };
  };
  const cells = [];
  for (let y = 0; y < rows; y++) {
    cells[y] = [];
    for (let x = 0; x < cols; x++) {
      const c = at(x, y);
      const neighbors = [
        y > 0        ? at(x, y - 1) : c,
        y < rows - 1 ? at(x, y + 1) : c,
        x > 0        ? at(x - 1, y) : c,
        x < cols - 1 ? at(x + 1, y) : c,
      ];
      const diffs = neighbors.map(n =>
        Math.abs(c.r - n.r) + Math.abs(c.g - n.g) + Math.abs(c.b - n.b));
      const lum = c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
      const edgeThreshold = 200;
      cells[y][x] = {
        r: c.r, g: c.g, b: c.b, lum,
        edge: diffs.some(d => d > edgeThreshold),
      };
    }
  }
  return { cellSize, cols, rows, cells };
}

/**
 * Renders one image against a palette already extracted by `extractPalette`
 * (rather than computing its own). `convertPhoto` is the single-image case —
 * extract + render against itself, in one call.
 */
export function renderPixelFrame(imgEl, paletteInfo, paletteMode, addOutline, showGridLines, dither = false, brick = false) {
  const { palette, cellSize, cols, rows, outputSize } = paletteInfo;
  const grid = quantizeToGrid(imgEl, paletteInfo, paletteMode);

  // Dithering (off by default everywhere in this app — see the note on
  // quantizeToGrid) recomputes its own per-pixel color against the raw
  // downsampled data; the flat/edge grid above still drives edge detection
  // either way, since dithered data would light up fake edges.
  let mData = null;
  if (dither) {
    const imageData = downsample(imgEl, cols, rows);
    mData = floydSteinbergDither(imageData, palette).data;
  }

  // Render to output canvas, one flat-colored block per cell
  const out = document.createElement('canvas');
  out.width = outputSize; out.height = outputSize;
  const ctx = out.getContext('2d');
  const pal = PALETTES[paletteMode];

  // Fill background before drawing cells — prevents the few-pixel gap between
  // the last cell row/col and the canvas edge from showing as black/transparent.
  ctx.fillStyle = pal?.bg || '#f5edd0';
  ctx.fillRect(0, 0, outputSize, outputSize);

  // Pass 1 — fill every cell with its real color (never the outline color).
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = grid.cells[y][x];
      const i = (y * cols + x) * 4;
      const color = mData ? `rgb(${mData[i]},${mData[i + 1]},${mData[i + 2]})` : `rgb(${cell.r},${cell.g},${cell.b})`;
      if (brick) drawBrickCell(ctx, x, y, cellSize, color);
      else { ctx.fillStyle = color; ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize); }
    }
  }

  // Pass 2 — 1px outline between cells that differ significantly. Each
  // boundary is checked exactly once (right-of and below-of each cell) so
  // lines are always exactly 1px, never doubled.
  if (addOutline) {
    const outColor = pal?.outline || '#3a2010';
    ctx.fillStyle = outColor;
    const thresh = 200;
    const c = grid.cells;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const a = c[y][x];
        if (x < cols - 1) {
          const b = c[y][x + 1];
          if (Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) > thresh)
            ctx.fillRect((x + 1) * cellSize, y * cellSize, 1, cellSize);
        }
        if (y < rows - 1) {
          const b = c[y + 1][x];
          if (Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) > thresh)
            ctx.fillRect(x * cellSize, (y + 1) * cellSize, cellSize, 1);
        }
      }
    }
  }


  if (showGridLines) drawGrid(ctx, outputSize, cellSize);

  return out;
}

/**
 * Converts a photo into pixel art.
 * @param {HTMLImageElement} imgEl   Loaded source image
 * @param {8|16|32|64|128} bitDepth  Console-era detail level
 * @param {string} paletteMode       key of PALETTES — tints the extracted swatches
 * @param {boolean} addOutline       silhouette-style dark edge pass
 * @param {boolean} showGridLines    pixel-grid overlay
 * @param {boolean} dither           Floyd–Steinberg dithering (default false — at pixel-art
 *                                   block sizes each dithered "pixel" is a whole visible cell,
 *                                   not a screen pixel, so it reads as noise rather than a smooth
 *                                   gradient; flat quantization is the clean, crisp look)
 * @param {boolean} brick            studded-brick mode — each cell renders as a raised,
 *                                   studded block (bevel + stud) instead of a flat square
 */
export function convertPhoto(imgEl, bitDepth, paletteMode, addOutline, showGridLines, dither = false, brick = false) {
  const paletteInfo = extractPalette(imgEl, bitDepth, paletteMode);
  return renderPixelFrame(imgEl, paletteInfo, paletteMode, addOutline, showGridLines, dither, brick);
}

export const BIT_MODES = [
  { value: 8,   label: '8-BIT',   sub: 'NES' },
  { value: 16,  label: '16-BIT',  sub: 'SNES' },
  { value: 32,  label: '32-BIT',  sub: 'GBA' },
  { value: 64,  label: '64-BIT',  sub: 'DS' },
  { value: 128, label: '128-BIT', sub: 'HD-2D' },
];

/* ── from pixelBoomerang.js ────────────────────────────────────
 * Pixelates a burst of frames against ONE shared palette (extracted from the
 * middle frame) so the resulting loop reads as a clean animated sprite
 * instead of flickering as the palette re-picks itself every frame.
 */
export function pixelateFrames(frames, { bitDepth = 64, paletteMode = 'harvest', addOutline = true, outputSize = 192, brick = false } = {}) {
  if (!frames.length) return [];
  const reference = frames[Math.floor(frames.length / 2)];
  const paletteInfo = extractPalette(reference, bitDepth, paletteMode, outputSize);
  // Flat quantization, not dithered — dithering's per-frame noise pattern
  // would also shift frame to frame, making the loop flicker on top of
  // looking speckled. `brick` (studded-brick mode) is safe to share across
  // frames too — the bevel/stud is a per-cell deterministic function of that
  // cell's own color, so it doesn't introduce any new frame-to-frame flicker.
  return frames.map(f => renderPixelFrame(f, paletteInfo, paletteMode, addOutline, false, false, brick));
}

let gifModulePromise = null;
function loadGif() {
  if (!gifModulePromise) gifModulePromise = import('gif.js').then(m => m.default || m);
  return gifModulePromise;
}

/** Encodes a sequence of same-size canvases into a looping animated GIF Blob. */
export async function encodeGif(canvases, { delay = 100, quality = 10, repeat = 0 } = {}) {
  if (!canvases.length) throw new Error('No frames to encode');
  const GIF = await loadGif();
  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality,
      workerScript: '/gif.worker.js',
      width: canvases[0].width,
      height: canvases[0].height,
      repeat,
    });
    canvases.forEach(c => gif.addFrame(c, { delay, copy: true }));
    gif.on('finished', blob => resolve(blob));
    gif.on('abort', () => reject(new Error('GIF encoding aborted')));
    gif.render();
  });
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/* ── from boomerangCapture.js ──────────────────────────────────
 * Camera burst capture for the "boomerang" step feature — a short forward
 * ↔ reverse looping clip of a recipe step, in the same spirit as
 * Instagram Boomerang. These functions only handle getting raw frames off
 * the camera; pixelating them and encoding the loop is handled above.
 */

export function isCameraSupported() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

/** Opens the camera and resolves to the raw MediaStream. Caller owns the
 *  stream — pass it to closeCamera() when done. */
export async function openCamera({ facingMode = 'environment' } = {}) {
  if (!isCameraSupported()) throw new Error('Camera not supported');
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 640 }, height: { ideal: 640 } },
    audio: false,
  });
}

export function closeCamera(stream) {
  stream?.getTracks().forEach(t => t.stop());
}

/** Grabs the current video frame as a square canvas (center-cropped) —
 *  canvases work anywhere the pixel-art pipeline expects an image source. */
export function grabSquareFrame(video) {
  const size = Math.min(video.videoWidth, video.videoHeight);
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const sx = (video.videoWidth - size) / 2;
  const sy = (video.videoHeight - size) / 2;
  ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
  return canvas;
}

/** Resolves once the video element reports real dimensions (metadata loaded). */
export function waitForVideoReady(video) {
  if (video.videoWidth) return Promise.resolve();
  return new Promise(resolve => { video.onloadedmetadata = () => resolve(); });
}

/**
 * Reorders a forward burst [1,2,3,4,5] into a boomerang loop
 * [1,2,3,4,5,4,3,2] — bounces back without repeating the first/last frame
 * twice in a row, so looping the array is seamless.
 */
export function boomerangOrder(frames) {
  if (frames.length < 3) return frames;
  return frames.concat(frames.slice(1, -1).reverse());
}
