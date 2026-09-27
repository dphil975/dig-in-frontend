import { useState } from 'react';
import { capturePhoto } from '../../../../lib/native';
import { convertPhoto, PALETTES } from '../../../../lib/pixelArt';
import { shareOrDownload } from '../../../../utils/shareImage';
import { track } from '../../../../lib/analytics';
import './FinishedDishPixelator.css';

/* FinishedDishPixelator — "what should this look like when it's done?"
   Lets the user snap/upload a reference photo (their own plate, or a stock
   photo of the finished dish) and turns it into pixel art at their choice of
   detail level, using the same engine as the step-snap flow and Pixel
   Creator. Kept per-recipe in localStorage so it survives a refresh. */

const GALLERY_KEY = 'dig_in_pixel_gallery';

function loadImage(src, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function FinishedDishPixelator({ recipeId, recipeImage, dishName }) {
  const storageKey = recipeId ? `dig_in_finished_dish_pixel_${recipeId}` : null;

  const [bitDepth, setBitDepth] = useState(64);
  const [palette, setPalette]   = useState('harvest');
  const [brick, setBrick]       = useState(false);
  const [busy, setBusy]         = useState(false);
  const [notif, setNotif]       = useState(null);
  const [dishPixel, setDishPixel] = useState(() => {
    if (!storageKey) return null;
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; }
  });

  function showNotif(text) {
    setNotif(text);
    setTimeout(() => setNotif(null), 2600);
  }

  async function runPixelate(src, { crossOrigin } = {}) {
    if (busy) return;
    setBusy(true);
    try {
      const img = await loadImage(src, crossOrigin);
      const canvas = convertPhoto(img, bitDepth, palette, true, false, false, brick);
      const dataUrl = canvas.toDataURL('image/png');
      const entry = { dataUrl, bitDepth, palette, brick, createdAt: new Date().toISOString() };
      setDishPixel(entry);
      if (storageKey) { try { localStorage.setItem(storageKey, JSON.stringify(entry)); } catch {} }
      track('finished_dish_pixelated', {
        recipe_id: recipeId, bit_depth: bitDepth, palette, brick,
        source: crossOrigin ? 'recipe_photo' : 'upload',
      });
    } catch {
      showNotif("Couldn't pixelate that photo — try a different one.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload() {
    if (busy) return;
    const dataUrl = await capturePhoto({ source: 'prompt' });
    if (!dataUrl) return;
    runPixelate(dataUrl);
  }

  function handleUseRecipePhoto() {
    if (!recipeImage) return;
    runPixelate(recipeImage, { crossOrigin: true });
  }

  async function handleShare() {
    if (!dishPixel || busy) return;
    try {
      const result = await shareOrDownload(dishPixel.dataUrl, {
        filename: `dig-in-${(dishName || 'dish').replace(/\s+/g, '-').toLowerCase()}-pixel.png`,
        title: `${dishName || 'My dish'} — pixel art`,
        text: `Made this on Dig In! #PixelArt #DigIn`,
      });
      if (result !== 'cancelled') showNotif(result === 'shared' ? 'Shared!' : 'Downloaded!');
    } catch {
      showNotif('Share failed — try again.');
    }
  }

  function saveToGallery() {
    if (!dishPixel) return;
    let gallery = [];
    try { gallery = JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]'); } catch {}
    const entry = {
      id: Date.now(),
      dataUrl: dishPixel.dataUrl,
      label: `${dishName || 'Dish'} ${dishPixel.bitDepth}-bit`,
      palette: dishPixel.palette,
      bitDepth: dishPixel.bitDepth,
      createdAt: dishPixel.createdAt,
    };
    const next = [entry, ...gallery].slice(0, 50);
    try { localStorage.setItem(GALLERY_KEY, JSON.stringify(next)); } catch {}
    showNotif('Saved to Pixel Creator gallery!');
  }

  return (
    <div className="rd-section fdp">
      <div className="rd-title">PIXELATE THE FINISHED DISH</div>
      <p className="rd-sub">
        Snap a photo of what {dishName || 'this dish'} is supposed to look like — or upload a stock
        photo — and Dig In will turn it into pixel art.
      </p>

      <div className="fdp-controls">
        <div className="fdp-control-block">
          <span className="fdp-label">DETAIL</span>
          <div className="fdp-pill-row">
            {[32, 64, 128].map(bd => (
              <button
                key={bd}
                type="button"
                className={`fdp-pill${bitDepth === bd ? ' active' : ''}`}
                onClick={() => setBitDepth(bd)}
                aria-pressed={bitDepth === bd}
              >
                {bd}-BIT
              </button>
            ))}
          </div>
        </div>
        <div className="fdp-control-block">
          <span className="fdp-label">STYLE</span>
          <div className="fdp-pal-row">
            {Object.entries(PALETTES).map(([key, pal]) => (
              <button
                key={key}
                type="button"
                className={`fdp-pal-btn${palette === key ? ' active' : ''}`}
                onClick={() => { setPalette(key); if (key === 'blocks') setBrick(true); }}
                title={pal.label}
                aria-pressed={palette === key}
              >
                {pal.shades.slice(0, 3).map((c, i) => (
                  <span key={i} className="fdp-swatch" style={{ background: c }} />
                ))}
              </button>
            ))}
          </div>
        </div>
        <div className="fdp-control-block">
          <span className="fdp-label">SHAPE</span>
          <button
            type="button"
            className={`fdp-brick-toggle${brick ? ' active' : ''}`}
            onClick={() => setBrick(b => !b)}
            aria-pressed={brick}
            title="Render each block as a raised, studded brick"
          >
            🧱 {brick ? 'BRICK MODE ON' : 'Flat pixels'}
          </button>
        </div>
      </div>

      <div className="fdp-body">
        <div className="fdp-frame">
          {dishPixel
            ? <img src={dishPixel.dataUrl} alt={`Pixel art of ${dishName || 'the finished dish'}`} className="fdp-result-img" />
            : <span className="fdp-frame-ph">{busy ? 'Pixelating…' : 'No pixel art yet'}</span>}
          {dishPixel && (
            <span className="fdp-frame-badge">
              {dishPixel.bitDepth}-BIT · {PALETTES[dishPixel.palette]?.label}{dishPixel.brick ? ' · 🧱 Brick' : ''}
            </span>
          )}
        </div>

        <div className="fdp-actions">
          <button type="button" className="fdp-btn fdp-btn-primary" onClick={handleUpload} disabled={busy}>
            {busy ? '···' : dishPixel ? '↻ Retake / Upload' : '📷 Snap or Upload Photo'}
          </button>
          {recipeImage && (
            <button type="button" className="fdp-btn" onClick={handleUseRecipePhoto} disabled={busy}>
              Use this recipe's photo
            </button>
          )}
          {dishPixel && (
            <>
              <button type="button" className="fdp-btn" onClick={handleShare}>Share</button>
              <button type="button" className="fdp-btn" onClick={saveToGallery}>Save to Gallery</button>
            </>
          )}
        </div>
      </div>

      {notif && <div className="fdp-toast">{notif}</div>}
    </div>
  );
}
