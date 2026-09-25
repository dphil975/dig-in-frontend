import { extractPalette, renderPixelFrame } from './pixelArt';

/**
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
