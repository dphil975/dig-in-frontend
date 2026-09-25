/**
 * Camera burst capture for the "boomerang" step feature — a short forward
 * ↔ reverse looping clip of a recipe step, in the same spirit as
 * Instagram Boomerang. This module only handles getting raw frames off the
 * camera; pixelating them and encoding the loop lives in pixelBoomerang.js.
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
