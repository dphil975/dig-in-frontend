import html2canvas from 'html2canvas';

/**
 * Renders a DOM element to a PNG data URL.
 * Waits for fonts to be ready so Press Start 2P renders correctly.
 */
export async function captureElement(element, extraOpts = {}) {
  await document.fonts.ready;
  const canvas = await html2canvas(element, {
    scale:           2,        // retina quality
    useCORS:         true,     // allow cross-origin images (Unsplash etc.)
    logging:         false,
    backgroundColor: null,     // preserve transparent/card background
    ...extraOpts,
  });
  return canvas.toDataURL('image/png');
}

/**
 * Shares a PNG (native share sheet on mobile, download on desktop).
 * Returns 'shared' | 'downloaded' | 'cancelled'.
 */
export async function shareOrDownload(dataUrl, { filename = 'dig-in.png', title = 'Dig In', text = 'Made with Dig In — NYC pixel food app' } = {}) {
  const res  = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title, text, files: [file] });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
      // Fall through to download if share API errors out
    }
  }

  // Desktop / unsupported mobile: trigger download
  const a = document.createElement('a');
  a.href     = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return 'downloaded';
}
