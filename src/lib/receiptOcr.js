/* receiptOcr.js — pure image-prep helpers for receipt OCR, extracted out of
   Pantry/index.jsx (which was pushing 1,200+ lines). No React, no state —
   just canvas transforms consumed by Pantry's receipt-import flow before
   handing the result to tesseract.js. */

// Shrink a receipt photo before OCR — a full-res phone photo is slow to read and
// gains no accuracy over ~1600px wide. Returns a canvas Tesseract reads directly.
export function downscaleImage(file, maxW = 1600) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}

// Pre-clean for OCR: desaturate to luminance and stretch contrast. Faint thermal
// receipt ink and phone-camera glare read far more reliably as high-contrast
// grayscale. A soft contrast stretch (not a hard threshold) survives the uneven
// lighting you get from a hand-held photo. Mutates + returns the same canvas.
export function preprocessForOcr(canvas, contrast = 1.5) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const intercept = 128 * (1 - contrast);
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let v = g * contrast + intercept;
    v = v < 0 ? 0 : v > 255 ? 255 : v;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Self-hosted OCR assets (see public/tesseract) so photo scanning needs no CDN
// and works offline. If they're ever missing we retry against the default CDN.
export const OCR_LOCAL = {
  workerPath: '/tesseract/worker.min.js',
  // Directory (not a specific file) so Tesseract's own SIMD/relaxed-SIMD feature
  // detection picks the matching core — all three LSTM variants are vendored.
  corePath: '/tesseract/core',
  langPath: '/tesseract/lang',
};
