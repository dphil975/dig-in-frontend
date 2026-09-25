import { useState, useEffect } from 'react';
import { convertPhoto } from '../../../lib/pixelArt';
import './DishPixelPreview.css';

/* DishPixelPreview — auto-pixelates a recipe's photo into "what the finished
   dish looks like" pixel art. Shares the same localStorage entry
   (`dig_in_finished_dish_pixel_<id>`) as FinishedDishPixelator on the full
   recipe page, so whichever surface renders first "wins" and the other
   reuses it instead of re-converting. */

const STORAGE_PREFIX = 'dig_in_finished_dish_pixel_';

export default function DishPixelPreview({ recipe, bitDepth = 64, paletteMode = 'harvest' }) {
  const storageKey = recipe?.id ? `${STORAGE_PREFIX}${recipe.id}` : null;

  const [pixelUrl, setPixelUrl] = useState(() => {
    if (!storageKey) return null;
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null')?.dataUrl || null; } catch { return null; }
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (pixelUrl || !recipe?.image) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = convertPhoto(img, bitDepth, paletteMode, true, false);
        const dataUrl = canvas.toDataURL('image/png');
        setPixelUrl(dataUrl);
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify({
              dataUrl, bitDepth, palette: paletteMode, createdAt: new Date().toISOString(),
            }));
          } catch {}
        }
      } catch {
        setFailed(true);
      }
    };
    img.onerror = () => { if (!cancelled) setFailed(true); };
    img.src = recipe.image;
    return () => { cancelled = true; };
  }, [recipe?.image, recipe?.id, storageKey, pixelUrl, bitDepth, paletteMode]);

  return (
    <div className="dish-pixel-preview">
      {pixelUrl
        ? <img src={pixelUrl} alt={`Pixel art of ${recipe?.name || 'the finished dish'}`} className="dpp-img" />
        : (failed || !recipe?.image)
          ? <div className="dpp-empty">NO PHOTO YET</div>
          : <div className="dpp-loading">PIXELATING…</div>}
    </div>
  );
}
