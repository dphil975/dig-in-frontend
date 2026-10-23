import { useState, useEffect } from 'react';
import { convertPhoto } from '../../../../lib/pixelArt';
import { getCachedPixel, setCachedPixel } from '../../../../lib/visual/pixelCache';
import './DishPixelPreview.css';

/* DishPixelPreview — shows a pixel-art version of the recipe photo on the
   recipe card. Checks IndexedDB first for an instant hit; on a miss, shows
   the original photo with CSS pixelation as a placeholder while the real
   conversion runs in the background, then caches the result for future loads. */

const CACHE_PREFIX = 'dpp_v2_';

export default function DishPixelPreview({ recipe, bitDepth = 32, paletteMode = 'natural' }) {
  const cacheKey = recipe?.id ? `${CACHE_PREFIX}${recipe.id}_${bitDepth}_${paletteMode}` : null;

  const [pixelUrl, setPixelUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!recipe?.image || !cacheKey) return;
    let cancelled = false;

    (async () => {
      const cached = await getCachedPixel(cacheKey);
      if (cached && !cancelled) { setPixelUrl(cached); return; }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelled) return;
        try {
          const canvas = convertPhoto(img, bitDepth, paletteMode, true, false);
          const dataUrl = canvas.toDataURL('image/png');
          setPixelUrl(dataUrl);
          setCachedPixel(cacheKey, dataUrl);
        } catch { setFailed(true); }
      };
      img.onerror = () => { if (!cancelled) setFailed(true); };
      img.src = recipe.image;
    })();

    return () => { cancelled = true; };
  }, [recipe?.image, recipe?.id, cacheKey, bitDepth, paletteMode]);

  if (!recipe?.image) return <div className="dish-pixel-preview"><div className="dpp-empty">NO PHOTO YET</div></div>;

  return (
    <div className="dish-pixel-preview">
      {pixelUrl
        ? <img src={pixelUrl} alt={`Pixel art of ${recipe?.name || 'the finished dish'}`} className="dpp-img" />
        : failed
          ? <div className="dpp-empty">NO PHOTO YET</div>
          : <img src={recipe.image} alt={recipe?.name || 'dish'} className="dpp-img dpp-placeholder" crossOrigin="anonymous" />}
    </div>
  );
}
