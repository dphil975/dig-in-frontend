/* NovaSprite — Nova as an authored pixel doll, early-2000s toy aesthetic.

   The look is a deliberate mash-up of three Y2K references:
     · Pixel Chix   — chunky, black-outlined pixel body on a fixed grid
     · Space Channel 5 (Ulala) — pink pigtails, headset, vinyl mini-dress,
       platform boots, and an outfit palette that swaps by "level"
     · Bratz Vinyl Babyz — the glossy, saturated, sporty-futuristic energy

   She's drawn as a 16×22 pixel grid of rectangles, built from an explicit
   symmetric part list (every left part has its hand-mirrored right twin). Two
   render passes: a black OUTLINE pass (each body part inflated 1px) draws the
   Pixel-Chix rim and hides seams between adjacent parts, then the COLOUR pass
   paints front-to-back. Face details (eyes/blush/mouth/emblem) skip the outline
   pass so they don't get a black halo. `look` picks the vinyl-outfit palette;
   skin, hair and face stay constant across every growth stage. */

const GRID_W = 16;
const GRID_H = 22;
const OUTLINE = '#1b1526';

// Constant across all stages — skin, the signature pink hair, face, hardware.
const BASE = {
  H: '#ff4f9a', // pigtail pink
  S: '#ffd9c0', // skin
  E: '#241d33', // eyes
  B: '#ff9ec4', // blush
  M: '#e0567f', // smile
  G: '#c9cad8', // headset grey
  W: '#ffffff', // gloves / collar / white trim
};

// The Ulala costume run — dress (D), trim accent (C), boot (K), platform (P).
const LOOKS = {
  blush:  { D: '#ffd0e6', C: '#ff9ec4', K: '#ff9ec4', P: '#e86fa4' },
  pink:   { D: '#ff4f8f', C: '#ffffff', K: '#ffffff', P: '#d63384' },
  orange: { D: '#ff7a1a', C: '#ffd24a', K: '#ffb066', P: '#e85d00' },
  blue:   { D: '#2ea3ff', C: '#ffffff', K: '#ffffff', P: '#0d6efd' },
  white:  { D: '#eef0f7', C: '#c7ccdc', K: '#dcdfea', P: '#a9adc4' },
  silver: { D: '#c1e4ff', C: '#ffffff', K: '#e9f5ff', P: '#7fb8e6' },
};

/* Part list. `k` = colour key, `d` = face detail (skip outline pass).
   Order is back-to-front for the colour pass. Right-side twins are the
   hand-mirror of the left (x' = 16 − x − w). */
const PARTS = [
  // ── pigtails (behind head) ──
  { x: 1, y: 5, w: 3, h: 5, k: 'H' }, { x: 12, y: 5, w: 3, h: 5, k: 'H' },
  { x: 0, y: 6, w: 1, h: 3, k: 'H' }, { x: 15, y: 6, w: 1, h: 3, k: 'H' },
  { x: 3, y: 4, w: 2, h: 2, k: 'H' }, { x: 11, y: 4, w: 2, h: 2, k: 'H' },
  // ── hair crown + sideburns ──
  { x: 5, y: 2, w: 6, h: 2, k: 'H' },
  { x: 4, y: 3, w: 1, h: 3, k: 'H' }, { x: 11, y: 3, w: 1, h: 3, k: 'H' },
  // ── headset earpieces ──
  { x: 4, y: 6, w: 1, h: 2, k: 'G' }, { x: 11, y: 6, w: 1, h: 2, k: 'G' },
  // ── face ──
  { x: 5, y: 4, w: 6, h: 5, k: 'S' },
  // ── fringe (over forehead) ──
  { x: 5, y: 4, w: 6, h: 1, k: 'H' },
  { x: 5, y: 5, w: 1, h: 1, k: 'H' }, { x: 10, y: 5, w: 1, h: 1, k: 'H' },
  // ── face details (no outline) ──
  { x: 6, y: 6, w: 1, h: 1, k: 'E', d: 1 }, { x: 9, y: 6, w: 1, h: 1, k: 'E', d: 1 },
  { x: 6, y: 7, w: 1, h: 1, k: 'B', d: 1 }, { x: 9, y: 7, w: 1, h: 1, k: 'B', d: 1 },
  { x: 7, y: 7, w: 2, h: 1, k: 'M', d: 1 },
  // ── neck ──
  { x: 7, y: 9, w: 2, h: 1, k: 'S' },
  // ── arms out + gloves ──
  { x: 1, y: 11, w: 4, h: 1, k: 'S' }, { x: 11, y: 11, w: 4, h: 1, k: 'S' },
  { x: 0, y: 11, w: 1, h: 1, k: 'W' }, { x: 15, y: 11, w: 1, h: 1, k: 'W' },
  // ── dress torso + collar + emblem ──
  { x: 5, y: 10, w: 6, h: 3, k: 'D' },
  { x: 6, y: 10, w: 4, h: 1, k: 'W' },
  { x: 7, y: 11, w: 2, h: 1, k: 'C', d: 1 },
  // ── flared skirt ──
  { x: 4, y: 13, w: 8, h: 2, k: 'D' },
  { x: 3, y: 14, w: 1, h: 1, k: 'D' }, { x: 12, y: 14, w: 1, h: 1, k: 'D' },
  // ── legs ──
  { x: 6, y: 15, w: 1, h: 2, k: 'S' }, { x: 9, y: 15, w: 1, h: 2, k: 'S' },
  // ── platform boots ──
  { x: 5, y: 17, w: 2, h: 3, k: 'K' }, { x: 9, y: 17, w: 2, h: 3, k: 'K' },
  { x: 5, y: 19, w: 2, h: 1, k: 'P' }, { x: 9, y: 19, w: 2, h: 1, k: 'P' },
];

/**
 * @param {string} look  one of LOOKS (defaults to hot pink)
 * @param {number} h     rendered height in px (width scales to keep the ratio)
 */
export default function NovaSprite({ look = 'pink', h = 56, className = '', title = 'Nova' }) {
  const pal = { ...BASE, ...(LOOKS[look] || LOOKS.pink) };
  const w = Math.round((h * GRID_W) / GRID_H);
  const outlineParts = PARTS.filter(p => !p.d);

  return (
    <svg
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${GRID_W} ${GRID_H}`}
      role="img"
      aria-label={title}
      style={{ shapeRendering: 'crispEdges', imageRendering: 'pixelated', overflow: 'visible' }}
    >
      {/* outline pass — Pixel-Chix black rim, seams hidden by the colour pass */}
      {outlineParts.map((p, i) => (
        <rect key={`o${i}`} x={p.x - 1} y={p.y - 1} width={p.w + 2} height={p.h + 2} fill={OUTLINE} />
      ))}
      {/* colour pass — front-to-back over the outline */}
      {PARTS.map((p, i) => (
        <rect key={`c${i}`} x={p.x} y={p.y} width={p.w} height={p.h} fill={pal[p.k]} />
      ))}
    </svg>
  );
}

export { LOOKS };
