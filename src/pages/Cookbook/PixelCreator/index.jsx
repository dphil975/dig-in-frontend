import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import Nav from '../../../components/shell/Nav';
import { shareOrDownload } from '../../../utils/shareImage';
import { track } from '../../../lib/analytics';
import {
  GRID, PALETTES, BIT_MODES, FOODS,
  cell, row, drawGrid, drawOutline, convertPhoto,
} from './pixelEngine';
import {
  buildVoxelGrid, buildScene, buildBlockChef, buildRevealSchedule, updateSceneAtTime,
} from '../../../lib/voxelArt';
import { encodeGif, blobToDataUrl } from '../../../lib/pixelBoomerang';
import './PixelCreator.css';

const CANVAS_SIZE = 384;
const VOXEL_SECONDS = 5;
const VOXEL_FPS = 10;

// ── Thumbnail canvas for food picker ──────────────────────────────────────
function FoodThumb({ food, palette, active, onClick }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pal = PALETTES[palette] || PALETTES.rpg;
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, 64, 64);
    const s = 64 / GRID;
    food.fn(ctx, s, pal);
  }, [food, palette]);
  return (
    <button className={`pc2-food-thumb${active ? ' active' : ''}`} onClick={onClick} title={food.label}>
      <canvas ref={ref} width={64} height={64} style={{ imageRendering: 'pixelated' }} />
      <span>{food.label}</span>
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function PixelCreator({ embedded = false } = {}) {
  const [tab, setTab]             = useState('studio');
  const [activeFood, setActiveFood] = useState('burger');
  const [bitDepth, setBitDepth]   = useState(16);
  const [palette, setPalette]     = useState('rpg');
  const [showGrid, setShowGrid]   = useState(false);
  const [addOutline, setAddOutline] = useState(true);
  // Studded-brick render — only meaningful for Photo Pixelate (the hand-
  // drawn Food Studio doesn't route through convertPhoto's per-cell renderer),
  // so the toggle is scoped to that tab (see pc2-toggles below).
  const [brick, setBrick] = useState(false);
  const [sharing, setSharing]     = useState(false);
  const [notification, setNotif] = useState(null);
  const [notifVisible, setNotifVisible] = useState(false);

  // Photo tab
  const [uploadedSrc, setUploadedSrc] = useState(null);
  const [converting, setConverting]   = useState(false);
  const [converted, setConverted]     = useState(null); // data URL
  const fileRef = useRef(null);

  // 3D Voxel Chef tab
  const [voxelBusy, setVoxelBusy]         = useState(false);
  const [voxelProgress, setVoxelProgress] = useState(0);
  const [voxelResult, setVoxelResult]     = useState(null); // { dataUrl }
  const [voxelError, setVoxelError]       = useState(null);
  const voxelCanvasRef  = useRef(null);
  const voxelRuntimeRef = useRef(null); // { renderer, sceneInfo, chef, schedule, rafId }

  // Gallery
  const [gallery, setGallery] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dig_in_pixel_gallery') || '[]'); }
    catch { return []; }
  });

  // Canvases
  const studioRef = useRef(null);
  const photoRef  = useRef(null);
  const voxelFileRef = useRef(null);

  // ── Studio renderer ──────────────────────────────────────────────────────
  const renderStudio = useCallback(() => {
    const canvas = studioRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const pal    = PALETTES[palette] || PALETTES.rpg;
    const s      = CANVAS_SIZE / GRID;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const food = FOODS.find(f => f.id === activeFood);
    if (food) food.fn(ctx, s, pal);

    // Bit-depth simulation: pixelate by re-downscaling
    const cellSize = { 8: 24, 16: 12, 32: 8, 64: 6, 128: 3 }[bitDepth] || 12;
    if (cellSize !== s) {
      const tmpW = Math.floor(CANVAS_SIZE / cellSize);
      const tmp = document.createElement('canvas');
      tmp.width = tmpW; tmp.height = tmpW;
      const tctx = tmp.getContext('2d');
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(canvas, 0, 0, tmpW, tmpW);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    if (addOutline) drawOutline(ctx, CANVAS_SIZE, cellSize, pal.outline, pal.bg);
    if (showGrid)   drawGrid(ctx, CANVAS_SIZE, cellSize);
  }, [activeFood, bitDepth, palette, showGrid, addOutline]);

  useEffect(() => { if (tab === 'studio') renderStudio(); }, [tab, renderStudio]);

  // ── Photo converter ──────────────────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedSrc(url);
    setConverted(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setUploadedSrc(url);
    setConverted(null);
  }

  function runConvert() {
    if (!uploadedSrc) return;
    setConverting(true);
    const img = new Image();
    img.onload = () => {
      try {
        const outCanvas = convertPhoto(img, bitDepth, palette, addOutline, showGrid, false, brick);
        const dataUrl = outCanvas.toDataURL('image/png');
        setConverted(dataUrl);

        // Draw onto visible canvas
        const canvas = photoRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(outCanvas, 0, 0);
        }
      } finally {
        setConverting(false);
      }
    };
    img.src = uploadedSrc;
  }

  // ── 3D Voxel Chef — real, deterministic Three.js scene, not a generative
  // render. `t` is an explicit seconds value everywhere so the exact same
  // updater drives both the live requestAnimationFrame preview and the
  // frame-by-frame GIF capture below. ──────────────────────────────────────
  function disposeObject3D(root) {
    root.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => { if (m.gradientMap) m.gradientMap.dispose(); m.dispose(); });
      }
    });
  }

  function startLiveLoop(rt) {
    const tick = (now) => {
      const t = ((now - rt.startedAt) / 1000) % VOXEL_SECONDS;
      updateSceneAtTime(rt.sceneInfo, rt.chef, rt.schedule, t, VOXEL_SECONDS);
      rt.renderer.render(rt.sceneInfo.scene, rt.sceneInfo.camera);
      rt.rafId = requestAnimationFrame(tick);
    };
    rt.rafId = requestAnimationFrame(tick);
  }

  function stopVoxelPreview() {
    const rt = voxelRuntimeRef.current;
    if (!rt) return;
    if (rt.rafId) cancelAnimationFrame(rt.rafId);
    disposeObject3D(rt.sceneInfo.scene);
    rt.renderer.dispose();
    voxelRuntimeRef.current = null;
  }

  function startVoxelPreview(img) {
    stopVoxelPreview();
    const canvas = voxelCanvasRef.current;
    if (!canvas) return;
    try {
      const voxelGrid = buildVoxelGrid(img, bitDepth, palette);
      const sceneInfo = buildScene(voxelGrid);
      const chef      = buildBlockChef(sceneInfo);
      const schedule  = buildRevealSchedule(voxelGrid.voxels, VOXEL_SECONDS, 7);
      const renderer  = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(CANVAS_SIZE, CANVAS_SIZE, false);
      renderer.setPixelRatio(1);
      sceneInfo.camera.aspect = 1;
      sceneInfo.camera.updateProjectionMatrix();
      setVoxelError(null);
      const rt = { renderer, sceneInfo, chef, schedule, rafId: null, startedAt: performance.now() };
      voxelRuntimeRef.current = rt;
      startLiveLoop(rt);
    } catch {
      setVoxelError('Could not build a 3D preview from this photo — try a different one.');
    }
  }

  useEffect(() => {
    if (tab !== 'voxel' || !uploadedSrc) return;
    const img = new Image();
    img.onload  = () => startVoxelPreview(img);
    img.onerror = () => setVoxelError('Could not load that photo.');
    img.src = uploadedSrc;
    return () => stopVoxelPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, uploadedSrc, bitDepth, palette]);

  async function buildVoxelGif() {
    const rt = voxelRuntimeRef.current;
    if (!rt || voxelBusy) return;
    setVoxelBusy(true);
    setVoxelProgress(0);
    setVoxelResult(null);
    setVoxelError(null);
    if (rt.rafId) { cancelAnimationFrame(rt.rafId); rt.rafId = null; }
    try {
      const totalFrames = Math.round(VOXEL_SECONDS * VOXEL_FPS);
      const frames = [];
      for (let i = 0; i < totalFrames; i++) {
        const t = (i / totalFrames) * VOXEL_SECONDS;
        updateSceneAtTime(rt.sceneInfo, rt.chef, rt.schedule, t, VOXEL_SECONDS);
        rt.renderer.render(rt.sceneInfo.scene, rt.sceneInfo.camera);
        // Snapshot into a brand-new canvas each frame — reusing/pushing the
        // same canvas reference here would make every GIF frame identical.
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = CANVAS_SIZE;
        frameCanvas.height = CANVAS_SIZE;
        frameCanvas.getContext('2d').drawImage(rt.renderer.domElement, 0, 0);
        frames.push(frameCanvas);
        setVoxelProgress(Math.round(((i + 1) / totalFrames) * 100));
        if (i % 4 === 0) await new Promise(r => setTimeout(r, 0));
      }
      const blob    = await encodeGif(frames, { delay: Math.round(1000 / VOXEL_FPS), quality: 12, repeat: 0 });
      const dataUrl = await blobToDataUrl(blob);
      setVoxelResult({ dataUrl });
      track('voxel_chef_built', { bit_depth: bitDepth, palette, frames: totalFrames });
      showNotif('BUILT', "Your Block Chef's done!", 'Watch it below, then save or share the build.');
    } catch {
      setVoxelError('Something went wrong building the animation — try again.');
    } finally {
      setVoxelBusy(false);
      const liveRt = voxelRuntimeRef.current;
      if (liveRt === rt) { rt.startedAt = performance.now(); startLiveLoop(rt); }
    }
  }

  async function shareVoxel() {
    if (!voxelResult || sharing) return;
    setSharing(true);
    try {
      const result = await shareOrDownload(voxelResult.dataUrl, {
        filename: `dig-in-voxel-chef-${bitDepth}bit.gif`,
        title:    'My Block Chef build — Dig In',
        text:     'Watch my dish get built block by block! #PixelArt #DigIn #BlockChef',
      });
      if (result !== 'cancelled') {
        track('pixel_art_exported', { kind: 'voxel-gif', method: result });
        showNotif('SENT', result === 'shared' ? 'Shared!' : 'Downloaded!',
          result === 'shared' ? 'Your build is out in the world.' : 'Saved to your device.');
      }
    } catch {
      showNotif('FAIL', 'Share failed', 'Try again.');
    } finally {
      setSharing(false);
    }
  }

  function saveVoxelToGallery() {
    if (!voxelResult) return;
    const entry = {
      id: Date.now(),
      dataUrl: voxelResult.dataUrl,
      label: `Voxel Chef ${bitDepth}-bit`,
      palette,
      bitDepth,
      kind: 'voxel-gif',
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...gallery].slice(0, 50);
    setGallery(next);
    localStorage.setItem('dig_in_pixel_gallery', JSON.stringify(next));
    showNotif('SAVED', 'Saved to Gallery!', 'Find your build in the My Gallery tab.');
  }

  // ── Sharing ──────────────────────────────────────────────────────────────
  async function handleShare() {
    const canvas = tab === 'photo' ? photoRef.current : studioRef.current;
    if (!canvas || sharing) return;
    setSharing(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const result  = await shareOrDownload(dataUrl, {
        filename: `dig-in-pixel-${activeFood}-${bitDepth}bit.png`,
        title:    `${bitDepth}-bit pixel art — Dig In`,
        text:     `Check out this pixel art I made on Dig In! #PixelArt #DigIn #NYC`,
      });
      if (result !== 'cancelled') {
        track('pixel_art_exported', { food: activeFood, bit_depth: bitDepth, method: result });
        showNotif('SENT', result === 'shared' ? 'Shared!' : 'Downloaded!',
          result === 'shared' ? 'Your pixel art is out in the world.' : 'Saved to your device.');
      }
    } catch {
      showNotif('FAIL', 'Share failed', 'Try again.');
    } finally {
      setSharing(false);
    }
  }

  // ── Gallery ──────────────────────────────────────────────────────────────
  function saveToGallery() {
    const canvas = tab === 'photo' ? photoRef.current : studioRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const food    = FOODS.find(f => f.id === activeFood);
    const entry   = {
      id:        Date.now(),
      dataUrl,
      label:     tab === 'photo' ? `Photo ${bitDepth}-bit` : `${food?.label || 'Art'} ${bitDepth}-bit`,
      palette,
      bitDepth,
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...gallery].slice(0, 50);
    setGallery(next);
    localStorage.setItem('dig_in_pixel_gallery', JSON.stringify(next));
    showNotif('SAVED', 'Saved to Gallery!', 'Find it in the My Gallery tab.');
  }

  function deleteFromGallery(id) {
    const next = gallery.filter(g => g.id !== id);
    setGallery(next);
    localStorage.setItem('dig_in_pixel_gallery', JSON.stringify(next));
  }

  async function shareFromGallery(entry) {
    const result = await shareOrDownload(entry.dataUrl, {
      filename: `dig-in-${entry.label.replace(/\s+/g, '-').toLowerCase()}.png`,
      title:    `${entry.label} — Dig In`,
      text:     `Pixel art made on Dig In #PixelArt #DigIn`,
    });
    if (result !== 'cancelled') showNotif('SENT', 'Shared!', '');
  }

  // ── Notification helper ──────────────────────────────────────────────────
  function showNotif(icon, title, desc) {
    setNotif({ icon, title, desc });
    setNotifVisible(true);
    setTimeout(() => {
      setNotifVisible(false);
      setTimeout(() => setNotif(null), 500);
    }, 2800);
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const currentPal = PALETTES[palette] || PALETTES.rpg;

  return (
    <div className="pc2-page" style={{ '--pc-bg': currentPal.bg, '--pc-outline': currentPal.outline }}>
      {!embedded && <Nav />}

      <div className="pc2-container">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="pc2-header">
          <h1 className="pc2-title">PIXEL CREATOR</h1>
          <p className="pc2-sub">RPG food art · {bitDepth}-bit · {currentPal.label} palette</p>
        </header>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="pc2-tabs">
          {[
            { id: 'studio', label: 'Food Studio' },
            { id: 'photo',  label: 'Photo Pixelate' },
            { id: 'voxel',  label: '🧱 3D Voxel Chef' },
            { id: 'gallery',label: `My Gallery${gallery.length ? ` (${gallery.length})` : ''}` },
          ].map(t => (
            <button
              key={t.id}
              className={`pc2-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >{t.label}</button>
          ))}
        </div>

        {/* ── Shared controls ─────────────────────────────────────────── */}
        <div className="pc2-shared-controls">
          {/* Bit depth */}
          <div className="pc2-control-block">
            <span className="pc2-control-label">BIT DEPTH</span>
            <div className="pc2-bit-row">
              {BIT_MODES.map(m => (
                <button
                  key={m.value}
                  className={`pc2-bit-btn${bitDepth === m.value ? ' active' : ''}`}
                  onClick={() => setBitDepth(m.value)}
                >
                  <span className="pc2-bit-label">{m.label}</span>
                  <span className="pc2-bit-sub">{m.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Palette */}
          <div className="pc2-control-block">
            <span className="pc2-control-label">PALETTE</span>
            <div className="pc2-palette-row">
              {Object.entries(PALETTES).map(([key, pal]) => (
                <button
                  key={key}
                  className={`pc2-pal-btn${palette === key ? ' active' : ''}`}
                  onClick={() => { setPalette(key); if (key === 'blocks' && tab === 'photo') setBrick(true); }}
                  title={pal.label}
                >
                  <span className="pc2-pal-swatches">
                    {pal.shades.slice(0, 5).map((c, i) => (
                      <span key={i} className="pc2-swatch" style={{ background: c }} />
                    ))}
                  </span>
                  <span>{pal.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="pc2-toggles">
            <label className="pc2-toggle">
              <input type="checkbox" checked={addOutline} onChange={e => setAddOutline(e.target.checked)} />
              <span>Dark Outlines</span>
            </label>
            <label className="pc2-toggle">
              <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
              <span>Pixel Grid</span>
            </label>
            {tab === 'photo' && (
              <label className="pc2-toggle" title="Render each block as a raised, studded brick">
                <input type="checkbox" checked={brick} onChange={e => setBrick(e.target.checked)} />
                <span>🧱 Brick Mode</span>
              </label>
            )}
          </div>
        </div>

        {/* ══ FOOD STUDIO TAB ══════════════════════════════════════════ */}
        {tab === 'studio' && (
          <div className="pc2-studio-layout">
            {/* Food picker */}
            <aside className="pc2-food-picker">
              <div className="pc2-section-label">CHOOSE FOOD</div>
              <div className="pc2-food-grid">
                {FOODS.map(food => (
                  <FoodThumb
                    key={food.id}
                    food={food}
                    palette={palette}
                    active={activeFood === food.id}
                    onClick={() => setActiveFood(food.id)}
                  />
                ))}
              </div>
            </aside>

            {/* Canvas + actions */}
            <div className="pc2-canvas-area">
              <div className="pc2-canvas-frame">
                <canvas
                  ref={studioRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="pc2-canvas"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div className="pc2-canvas-badge">{bitDepth}-BIT</div>
              </div>
              <div className="pc2-canvas-actions">
                <button className="pc2-action-btn pc2-render-btn" onClick={renderStudio}>
                  Re-Render
                </button>
                <button className="pc2-action-btn pc2-save-btn" onClick={saveToGallery}>
                  Save
                </button>
                <button
                  className={`pc2-action-btn pc2-share-btn${sharing ? ' busy' : ''}`}
                  onClick={handleShare}
                  disabled={sharing}
                >
                  {sharing ? 'Sharing…' : 'Share'}
                </button>
              </div>
            </div>

            {/* Style info panel */}
            <aside className="pc2-style-panel">
              <div className="pc2-section-label">STYLE GUIDE</div>
              <div className="pc2-style-card">
                <div className="pc2-style-row">
                  <span>Mode</span>
                  <strong>{BIT_MODES.find(m => m.value === bitDepth)?.sub} Style</strong>
                </div>
                <div className="pc2-style-row">
                  <span>Palette</span>
                  <strong>{currentPal.label}</strong>
                </div>
                <div className="pc2-style-row">
                  <span>Grid</span>
                  <strong>{CANVAS_SIZE / ({ 8: 24, 16: 12, 32: 8, 64: 6, 128: 3 }[bitDepth] || 12)}×{CANVAS_SIZE / ({ 8: 24, 16: 12, 32: 8, 64: 6, 128: 3 }[bitDepth] || 12)} px</strong>
                </div>
                <div className="pc2-style-row">
                  <span>Colors</span>
                  <strong>Max {bitDepth}</strong>
                </div>
              </div>

              <div className="pc2-section-label" style={{ marginTop: 20 }}>COLOUR PALETTE</div>
              <div className="pc2-full-palette">
                {currentPal.shades.map((c, i) => (
                  <div key={i} className="pc2-big-swatch" style={{ background: c }} title={c} />
                ))}
              </div>

              <div className="pc2-bit-explainer">
                {bitDepth === 8   && <p><strong>8-BIT</strong> — Chunky pixels, up to 8 colours. The classic retro-arcade aesthetic.</p>}
                {bitDepth === 16  && <p><strong>16-BIT</strong> — Balanced detail. The classic 16-bit RPG food-icon style.</p>}
                {bitDepth === 32  && <p><strong>32-BIT</strong> — Smooth gradients, richer shading. Late-handheld era.</p>}
                {bitDepth === 64  && <p><strong>64-BIT</strong> — Maximum detail, flat clean shading. Modern indie pixel art.</p>}
                {bitDepth === 128 && <p><strong>128-BIT</strong> — Near-photographic clarity, crisp flat colour blocks. Modern high-def 2D style.</p>}
              </div>
            </aside>
          </div>
        )}

        {/* ══ PHOTO PIXELATE TAB ═══════════════════════════════════════ */}
        {tab === 'photo' && (
          <div className="pc2-photo-layout">
            {/* Upload */}
            <div className="pc2-photo-left">
              <div className="pc2-section-label">UPLOAD PHOTO</div>
              <div
                className={`pc2-dropzone${uploadedSrc ? ' has-image' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
              >
                {uploadedSrc
                  ? <img src={uploadedSrc} alt="upload" className="pc2-upload-preview" />
                  : (
                    <div className="pc2-dropzone-inner">
                      <div className="pc2-drop-icon">PHOTO</div>
                      <p>Drop a food photo here</p>
                      <p className="pc2-drop-sub">or click to browse</p>
                    </div>
                  )
                }
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {uploadedSrc && (
                <button className="pc2-change-photo" onClick={() => { setUploadedSrc(null); setConverted(null); }}>
                  ✕ Remove photo
                </button>
              )}

              <button
                className={`pc2-convert-btn${!uploadedSrc ? ' disabled' : ''}`}
                onClick={runConvert}
                disabled={!uploadedSrc || converting}
              >
                {converting ? 'Converting…' : `Pixelate to ${bitDepth}-bit`}
              </button>

              <div className="pc2-photo-style-info">
                <div className="pc2-style-row"><span>Bit mode</span><strong>{BIT_MODES.find(m => m.value === bitDepth)?.sub} ({bitDepth}-bit)</strong></div>
                <div className="pc2-style-row"><span>Palette</span><strong>{currentPal.label}</strong></div>
                <div className="pc2-style-row"><span>Pixel size</span><strong>{ { 8: 20, 16: 12, 32: 8, 64: 5, 128: 2 }[bitDepth] }px cells</strong></div>
                <div className="pc2-style-row"><span>Colours</span><strong>Max {bitDepth} tones</strong></div>
              </div>
            </div>

            {/* Output */}
            <div className="pc2-photo-right">
              <div className="pc2-section-label">PIXEL ART OUTPUT</div>
              <div className={`pc2-canvas-frame${!converted ? ' empty' : ''}`}>
                <canvas
                  ref={photoRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="pc2-canvas"
                  style={{ imageRendering: 'pixelated', opacity: converted ? 1 : 0.25 }}
                />
                {!converted && (
                  <div className="pc2-canvas-placeholder">
                    <span>Upload a photo</span>
                    <span>and hit Pixelate</span>
                  </div>
                )}
                {converted && <div className="pc2-canvas-badge">{bitDepth}-BIT</div>}
              </div>
              {converted && (
                <div className="pc2-canvas-actions">
                  <button className="pc2-action-btn pc2-save-btn" onClick={saveToGallery}>
                    Save to Gallery
                  </button>
                  <button
                    className={`pc2-action-btn pc2-share-btn${sharing ? ' busy' : ''}`}
                    onClick={handleShare}
                    disabled={sharing}
                  >
                    {sharing ? 'Sharing…' : 'Share'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ 3D VOXEL CHEF TAB ════════════════════════════════════════ */}
        {tab === 'voxel' && (
          <div className="pc2-photo-layout">
            {/* Upload + build */}
            <div className="pc2-photo-left">
              <div className="pc2-section-label">UPLOAD PHOTO</div>
              <div
                className={`pc2-dropzone${uploadedSrc ? ' has-image' : ''}`}
                onClick={() => voxelFileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
              >
                {uploadedSrc
                  ? <img src={uploadedSrc} alt="upload" className="pc2-upload-preview" />
                  : (
                    <div className="pc2-dropzone-inner">
                      <div className="pc2-drop-icon">PHOTO</div>
                      <p>Drop a food photo here</p>
                      <p className="pc2-drop-sub">or click to browse</p>
                    </div>
                  )
                }
              </div>
              <input
                ref={voxelFileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {uploadedSrc && (
                <button className="pc2-change-photo" onClick={() => { setUploadedSrc(null); setVoxelResult(null); setVoxelError(null); }}>
                  ✕ Remove photo
                </button>
              )}

              <button
                className={`pc2-convert-btn${!uploadedSrc || voxelBusy ? ' disabled' : ''}`}
                onClick={buildVoxelGif}
                disabled={!uploadedSrc || voxelBusy}
              >
                {voxelBusy ? `Building… ${voxelProgress}%` : "Build the Chef's Creation 🎬"}
              </button>
              {voxelBusy && (
                <div className="pc2-voxel-progress">
                  <div className="pc2-voxel-progress-bar" style={{ width: `${voxelProgress}%` }} />
                </div>
              )}
              {voxelError && <p className="pc2-voxel-error">{voxelError}</p>}

              <div className="pc2-photo-style-info">
                <div className="pc2-style-row"><span>Palette</span><strong>{currentPal.label}</strong></div>
                <div className="pc2-style-row"><span>Clip</span><strong>{VOXEL_SECONDS}s loop · {VOXEL_FPS}fps</strong></div>
                <div className="pc2-style-row"><span>How it's made</span><strong>Real 3D — colors + height from your photo, no AI render</strong></div>
              </div>
            </div>

            {/* Live preview + result */}
            <div className="pc2-photo-right">
              <div className="pc2-section-label">3D LIVE PREVIEW</div>
              <div className={`pc2-canvas-frame${!uploadedSrc ? ' empty' : ''}`}>
                <canvas
                  ref={voxelCanvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="pc2-canvas"
                />
                {!uploadedSrc && (
                  <div className="pc2-canvas-placeholder">
                    <span>Upload a photo</span>
                    <span>to preview the 3D build</span>
                  </div>
                )}
                {uploadedSrc && <div className="pc2-canvas-badge">LIVE</div>}
              </div>

              {voxelResult && (
                <>
                  <div className="pc2-section-label" style={{ marginTop: 8 }}>FINISHED GIF</div>
                  <div className="pc2-canvas-frame">
                    <img
                      src={voxelResult.dataUrl}
                      alt="Voxel chef build"
                      className="pc2-canvas"
                      style={{ objectFit: 'contain' }}
                    />
                    <div className="pc2-canvas-badge">GIF</div>
                  </div>
                  <div className="pc2-canvas-actions">
                    <button className="pc2-action-btn pc2-save-btn" onClick={saveVoxelToGallery}>
                      Save to Gallery
                    </button>
                    <button
                      className={`pc2-action-btn pc2-share-btn${sharing ? ' busy' : ''}`}
                      onClick={shareVoxel}
                      disabled={sharing}
                    >
                      {sharing ? 'Sharing…' : 'Share'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ GALLERY TAB ══════════════════════════════════════════════ */}
        {tab === 'gallery' && (
          <div className="pc2-gallery-section">
            {gallery.length === 0 ? (
              <div className="pc2-gallery-empty">
                <div className="pc2-gallery-empty-icon">ART</div>
                <h3>No pixel art yet</h3>
                <p>Create something in Food Studio or Photo Pixelate, then hit Save.</p>
                <button className="pc2-action-btn pc2-render-btn" onClick={() => setTab('studio')}>
                  Open Food Studio →
                </button>
              </div>
            ) : (
              <>
                <div className="pc2-gallery-header">
                  <span className="pc2-section-label">{gallery.length} PIECE{gallery.length !== 1 ? 'S' : ''}</span>
                </div>
                <div className="pc2-gallery-grid">
                  {gallery.map(entry => (
                    <div key={entry.id} className="pc2-gallery-card">
                      <img
                        src={entry.dataUrl}
                        alt={entry.label}
                        className="pc2-gallery-img"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="pc2-gallery-meta">
                        <span className="pc2-gallery-name">{entry.label}</span>
                        <span className="pc2-gallery-pal">{PALETTES[entry.palette]?.label || entry.palette}</span>
                      </div>
                      <div className="pc2-gallery-actions">
                        <button className="pc2-gal-btn" onClick={() => shareFromGallery(entry)} title="Share">SHARE</button>
                        <a
                          href={entry.dataUrl}
                          download={`dig-in-${entry.label.replace(/\s+/g, '-').toLowerCase()}.png`}
                          className="pc2-gal-btn"
                          title="Download"
                        >⬇</a>
                        <button
                          className="pc2-gal-btn pc2-gal-delete"
                          onClick={() => deleteFromGallery(entry.id)}
                          title="Delete"
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Toast notification ─────────────────────────────────────── */}
      {notification && (
        <div
          className="pc2-toast"
          style={{ opacity: notifVisible ? 1 : 0, transform: notifVisible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <span className="pc2-toast-icon">{notification.icon}</span>
          <div>
            <div className="pc2-toast-title">{notification.title}</div>
            {notification.desc && <div className="pc2-toast-desc">{notification.desc}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
