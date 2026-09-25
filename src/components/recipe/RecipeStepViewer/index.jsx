import { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import { capturePhoto } from '../../../lib/native';
import { convertPhoto } from '../../../lib/pixelArt';
import { critiqueStepLLM } from '../../../services/novaAI';
import NovaSprite from '../../nova/NovaSprite';
import StepBoomerang from '../StepBoomerang';
import './RecipeStepViewer.css';

/* RecipeStepViewer — bento step card with an Apple-smooth "preview → flash →
   reveal" transition, in the Dig In pixel style.

   Layout (per spec):
     ┌ bento ─────────────────────────────────┐
     │ [step img][ad]   ┌──────────────┐       │
     │ [  preview   ]   │  STEP TEXT   │       │  ← tall upright = main display
     └──────────────────└──────────────┘───────┘
       ▭ ▭ ▭ ▭ ▭ ▭ ▭ …   ← carousel, one rectangle per step (grows)

   Props:
     steps       string[]  — the recipe method steps
     image       string    — recipe image (fallback for the step square)
     stepImages  string[]  — optional per-step images
     recipeName  string    — optional, shown as an eyebrow
     stepHelp    string[]  — optional, same length/order as `steps`; when a
                             step has help text a "?" button reveals it, for
                             anyone unsure what a step actually means
*/

function snippet(text, words = 6) {
  const w = String(text || '').trim().split(/\s+/);
  return w.slice(0, words).join(' ') + (w.length > words ? '…' : '');
}

export default function RecipeStepViewer({ steps = [], image, stepImages = [], recipeName = '', groups = [], stepHelp = [], recipeId }) {
  const list = steps.filter(Boolean);
  // Keep help text aligned to `list`'s indices — steps and stepHelp arrive as
  // parallel arrays, so drop the same (empty-step) slots from stepHelp too.
  const helpList = steps.reduce((acc, s, idx) => { if (s) acc.push(stepHelp[idx]); return acc; }, []);
  const total = list.length;
  const [i, setI] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const chipRefs = useRef([]);

  // "Snap your step" — the user photographs the dish at the step they're on
  // and it's turned into pixel art, Cooking-Mama style. Kept per-recipe in
  // localStorage so the scrapbook survives a refresh/reopen.
  const photosKey = recipeId ? `dig_in_step_pixel_photos_${recipeId}` : null;
  const [stepPhotos, setStepPhotos] = useState(() => {
    if (!photosKey) return {};
    try { return JSON.parse(localStorage.getItem(photosKey) || '{}'); } catch { return {}; }
  });
  const [snapping, setSnapping] = useState(false);

  // "Nova, check my step" — the user photographs the step they're on and Nova
  // (gpt-4o vision) says whether it looks right, flags problems, and gives the
  // next action. Kept per step in component state (a live coaching moment, not
  // a saved scrapbook). If she spots a problem she pops up over the step.
  const [critiques, setCritiques] = useState({});   // stepIdx → { match, texture, tip } | { unavailable }
  const [checking, setChecking] = useState(false);

  async function handleCheckStep() {
    if (checking) return;
    const image = await capturePhoto({ source: 'prompt' });
    if (!image) return;
    setChecking(true);
    try {
      const result = await critiqueStepLLM({ image, step: list[i], recipe: recipeName });
      setCritiques(prev => ({ ...prev, [i]: result }));
    } catch {
      setCritiques(prev => ({ ...prev, [i]: { unavailable: true } }));
    } finally {
      setChecking(false);
    }
  }

  // Detail level for the "snap your progress" flow — remembered across
  // recipes since it's a device/taste preference, not a per-recipe one.
  const SNAP_BIT_KEY = 'dig_in_step_pixel_bitdepth';
  const [snapBitDepth, setSnapBitDepth] = useState(() => {
    const saved = Number(localStorage.getItem(SNAP_BIT_KEY));
    return [32, 64, 128].includes(saved) ? saved : 64;
  });
  function chooseSnapBitDepth(bd) {
    setSnapBitDepth(bd);
    try { localStorage.setItem(SNAP_BIT_KEY, String(bd)); } catch {}
  }

  // Boomerang ("show the completed step as a looping gif") — captured the
  // moment the cook hits NEXT on a step, i.e. exactly when that step is
  // "done". Kept alongside the static snap photos, per-recipe.
  const boomerangKey = recipeId ? `dig_in_step_boomerangs_${recipeId}` : null;
  const skipKey = recipeId ? `dig_in_step_boomerang_skipped_${recipeId}` : null;
  const [boomerangs, setBoomerangs] = useState(() => {
    if (!boomerangKey) return {};
    try { return JSON.parse(localStorage.getItem(boomerangKey) || '{}'); } catch { return {}; }
  });
  const [skippedBoomerangs, setSkippedBoomerangs] = useState(() => {
    if (!skipKey) return {};
    try { return JSON.parse(localStorage.getItem(skipKey) || '{}'); } catch { return {}; }
  });
  const [boomerangStep, setBoomerangStep] = useState(null); // step index currently being prompted

  function handleBoomerangSave(dataUrl) {
    const stepIdx = boomerangStep;
    setBoomerangs(prev => {
      const next = { ...prev, [stepIdx]: { dataUrl, createdAt: new Date().toISOString() } };
      if (boomerangKey) { try { localStorage.setItem(boomerangKey, JSON.stringify(next)); } catch {} }
      return next;
    });
    setBoomerangStep(null);
    go(stepIdx + 1);
  }

  function handleBoomerangSkip() {
    const stepIdx = boomerangStep;
    setSkippedBoomerangs(prev => {
      const next = { ...prev, [stepIdx]: true };
      if (skipKey) { try { localStorage.setItem(skipKey, JSON.stringify(next)); } catch {} }
      return next;
    });
    setBoomerangStep(null);
    go(stepIdx + 1);
  }

  // "NEXT ►" means the current step is done — that's the moment to offer a
  // boomerang of it, once per step (skipping stays skipped on revisit).
  function handleNextStep() {
    const nextIdx = i + 1;
    if (nextIdx < total && !boomerangs[i] && !skippedBoomerangs[i]) {
      setBoomerangStep(i);
      return;
    }
    go(nextIdx);
  }

  async function handleSnapStep() {
    if (snapping) return;
    setSnapping(true);
    try {
      const dataUrl = await capturePhoto({ source: 'prompt' });
      if (!dataUrl) return;
      const pixelUrl = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = convertPhoto(img, snapBitDepth, 'harvest', true, false);
            resolve(canvas.toDataURL('image/png'));
          } catch (err) { reject(err); }
        };
        img.onerror = reject;
        img.src = dataUrl;
      });
      setStepPhotos(prev => {
        const next = { ...prev, [i]: pixelUrl };
        if (photosKey) { try { localStorage.setItem(photosKey, JSON.stringify(next)); } catch {} }
        return next;
      });
    } catch {
      // camera cancelled/denied, or conversion failed — leave the step as-is
    } finally {
      setSnapping(false);
    }
  }

  // Map each step to its phase (e.g. "Pastry Cream Filling · step 2 of 5") so
  // the walkthrough reads logically, component by component. Only used when the
  // groups line up with the flat step list.
  const phases = useMemo(() => {
    if (!groups?.length) return null;
    const map = [];
    for (const g of groups) {
      const cnt = (g.steps || []).length;
      for (let k = 0; k < cnt; k++) map.push({ title: g.title, idx: k, count: cnt });
    }
    return map.length === total ? map : null;
  }, [groups, total]);

  const go = (n) => setI(Math.max(0, Math.min(total - 1, n)));

  // Keep the active carousel rectangle scrolled into view (Apple-style).
  useEffect(() => {
    chipRefs.current[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [i]);

  // Close any open help callout when the step changes — it's specific to
  // the step you were confused about, not the one you're moving to.
  useEffect(() => { setShowHelp(false); }, [i]);

  // Arrow-key navigation.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(i + 1);
      if (e.key === 'ArrowLeft') go(i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, total]);

  if (!total) return <p className="rsv-empty">No steps available for this recipe.</p>;

  const stepText = list[i];
  const img = stepImages[i] || image;

  return (
    <div className="rsv">
      <div className="rsv-bento">
        {/* Left column — two squares on top, a preview rectangle beneath them */}
        <div className="rsv-left">
          <div className="rsv-squares">
            {/* Square 1 — image of the step the user is on, or their own
                snapped-and-pixelated progress photo once they've taken one */}
            <div className="rsv-square rsv-img" key={`img-${i}`}>
              {boomerangs[i]
                ? <img src={boomerangs[i].dataUrl} alt={`Your boomerang, step ${i + 1}`} draggable="false" className="rsv-pixel-photo" />
                : stepPhotos[i]
                  ? <img src={stepPhotos[i]} alt={`Your pixel art, step ${i + 1}`} draggable="false" className="rsv-pixel-photo" />
                  : img
                    ? <img src={img} alt={`Step ${i + 1}`} draggable="false" />
                    : <span className="rsv-img-ph">{i + 1}</span>}
              <span className="rsv-square-tag">
                {boomerangs[i] ? '⟲ BOOMERANG' : stepPhotos[i] ? 'YOUR PIXEL ART' : `STEP ${i + 1}`}
              </span>
              <div className="rsv-bit-picker" role="group" aria-label="Pixel detail level">
                {[32, 64, 128].map(bd => (
                  <button
                    key={bd}
                    type="button"
                    className={`rsv-bit-pill${snapBitDepth === bd ? ' active' : ''}`}
                    onClick={() => chooseSnapBitDepth(bd)}
                    aria-pressed={snapBitDepth === bd}
                    title={`${bd}-bit detail`}
                  >
                    {bd}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`rsv-snap-btn${snapping ? ' busy' : ''}`}
                onClick={handleSnapStep}
                disabled={snapping}
                aria-label={stepPhotos[i] ? 'Retake pixel art of this step' : 'Snap a photo of your progress'}
                title={stepPhotos[i] ? 'Retake' : 'Snap & pixelate'}
              >
                {snapping ? '···' : stepPhotos[i] ? '↻' : '+'}
              </button>
            </div>
            {/* Square 2 — ad placeholder */}
            <div className="rsv-square rsv-ad">
              <span className="rsv-ad-tag">AD</span>
              <span className="rsv-ad-sub">your spot</span>
            </div>
          </div>

          {/* Nudge to document progress on this step, snap or boomerang */}
          <div className={`rsv-progress-nudge${(stepPhotos[i] || boomerangs[i]) ? ' done' : ''}`}>
            {boomerangs[i]
              ? '⟲ Boomerang saved for this step.'
              : stepPhotos[i]
                ? '✓ Progress photo saved for this step.'
                : '📸 Snap a photo of your progress on this step — or hit NEXT to record a boomerang.'}
          </div>

          {/* Wide rectangle — the preview of what's about to be said */}
          <div className="rsv-wide" key={`wide-${i}`}>
            <span className="rsv-wide-label">UP NOW</span>
            <span className="rsv-wide-preview">{snippet(stepText)}</span>
            <div className="rsv-progress"><span style={{ width: `${((i + 1) / total) * 100}%` }} /></div>
          </div>
        </div>

        {/* Right column — the tall upright rectangle; step text flashes in */}
        <div className="rsv-main" key={`main-${i}`}>
          <div className="rsv-flash" aria-hidden="true" />
          {recipeName && <span className="rsv-eyebrow">{recipeName}</span>}
          {phases && (
            <span className="rsv-phase">
              {phases[i].title} · step {phases[i].idx + 1} of {phases[i].count}
            </span>
          )}
          <div className="rsv-main-num-row">
            <span className="rsv-main-num">{String(i + 1).padStart(2, '0')}<i>/{String(total).padStart(2, '0')}</i></span>
            {helpList[i] && (
              <button
                type="button"
                className={`rsv-help-btn${showHelp ? ' active' : ''}`}
                onClick={() => setShowHelp(h => !h)}
                aria-label="Need help with this step?"
              >
                ?
              </button>
            )}
          </div>
          <p className="rsv-main-text">{stepText}</p>
          {showHelp && helpList[i] && (
            <div className="rsv-help-box">
              <span className="rsv-help-label">CONFUSED? HERE'S THE WHY</span>
              <p>{helpList[i]}</p>
            </div>
          )}

          {/* Nova, check my step — snap the current step and get live coaching */}
          {(() => {
            const crit = critiques[i];
            const fields = crit && !crit.unavailable
              ? [crit.match, crit.texture, crit.tip].filter(f => f && (f.text || f.label))
              : [];
            const hasDanger = fields.some(f => f?.type === 'danger');
            return (
              <div className="rsv-nova-check">
                <button
                  type="button"
                  className={`rsv-nova-btn${checking ? ' busy' : ''}`}
                  onClick={handleCheckStep}
                  disabled={checking}
                >
                  {checking ? 'Nova’s looking…' : crit ? '↻ Nova, check again' : '🔍 Nova, check my step'}
                </button>

                {crit?.unavailable && (
                  <div className="rsv-nova-note">
                    Nova needs the kitchen AI switched on to eyeball your photo — set <code>OPENAI_API_KEY</code> (or run <code>npm run dev:ai</code>) and try again.
                  </div>
                )}

                {hasDanger && (
                  <div className="rsv-nova-popup" role="alert">
                    <NovaSprite look="pink" h={40} title="Nova" />
                    <div>
                      <div className="rsv-nova-popup-title">Hold up — I see a problem</div>
                      <div className="rsv-nova-popup-text">
                        {fields.find(f => f.type === 'danger').text}
                      </div>
                    </div>
                  </div>
                )}

                {fields.length > 0 && (
                  <div className="rsv-crit-cards">
                    {fields.map((f, n) => (
                      <div key={n} className={`rsv-crit rsv-crit-${f.type || 'info'}`}>
                        <span className="rsv-crit-label">{f.label}</span>
                        <span className="rsv-crit-text">{f.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="rsv-nav">
            <button className="rsv-btn" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous step">◄ BACK</button>
            <button className="rsv-btn rsv-btn-next" onClick={handleNextStep} disabled={i === total - 1} aria-label="Next step">NEXT ►</button>
          </div>
        </div>
      </div>

      {/* Carousel — one rectangle per step, with a label at each phase start */}
      <div className="rsv-rail">
        {list.map((s, n) => (
          <Fragment key={n}>
            {phases && phases[n].idx === 0 && (
              <span className="rsv-rail-group">{phases[n].title}</span>
            )}
            <button
              ref={(el) => (chipRefs.current[n] = el)}
              className={`rsv-chip${n === i ? ' is-active' : ''}${n < i ? ' is-done' : ''}`}
              onClick={() => go(n)}
              aria-label={`Go to step ${n + 1}`}
              aria-current={n === i ? 'step' : undefined}
            >
              <span className="rsv-chip-num">{n + 1}</span>
              <span className="rsv-chip-prev">{snippet(s, 4)}</span>
            </button>
          </Fragment>
        ))}
      </div>

      {boomerangStep !== null && (
        <StepBoomerang
          stepLabel={snippet(list[boomerangStep], 10)}
          onSave={handleBoomerangSave}
          onSkip={handleBoomerangSkip}
        />
      )}
    </div>
  );
}
