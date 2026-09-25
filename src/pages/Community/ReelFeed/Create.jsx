import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, X, Check, Sparkles, Coins } from 'lucide-react';
import Nav from '../../../components/shell/Nav';
import { STAGES, FLAVORS, FLAVOR_BY_KEY, REELS } from '../../../data/reels.data';
import { NOVA_QUIPS, pickNovaQuip } from '../../../components/social/Reel/novaQuips';
import { publishUserReel, getFoundingSpotsLeft, COINS_PER_UPLOAD, FOUNDING_CAP } from '../../../lib/userReels';
import Reel from '../../../components/social/Reel/index';
import '../../../components/social/Reel/ReelFeed.css';
import './Create.css';

/* ════════════════════════════════════════════════════════════
   CREATE — the reel upload / creator flow.

   The UGC half of the engine. Three steps: describe the dish → capture
   the five beats → preview & publish. There's no video encoder or AI
   frame-picker here, so a "reel" is the same 5-stage card the feed plays,
   optionally with a user photo per beat. Photos are downscaled to small
   JPEG data URLs (localStorage-safe) — swap this whole module for a real
   upload API later and the feed doesn't change.

   Publishing pays Nova Coins and claims a Founding Creator number for the
   first 100 uploaders (see REEL_FIRST_100_INCENTIVE_PLAN).
   ════════════════════════════════════════════════════════════ */

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const CATEGORIES = Object.keys(NOVA_QUIPS);

// Downscale a picked image to a small JPEG data URL so a handful of reels fit
// comfortably in localStorage (no upload backend to stream to).
function fileToThumb(file, maxDim = 720) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { resolve(canvas.toDataURL('image/jpeg', 0.6)); }
      catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')); };
    img.src = url;
  });
}

function StageCapture({ stage, index, photo, onSet, onClear }) {
  const inputRef = useRef(null);
  return (
    <div className={`cr-stage${photo ? ' has-photo' : ''}`}>
      <div className="cr-stage-head">
        <span className="cr-stage-num">{index + 1}</span>
        <div>
          <p className="cr-stage-word">{stage.word}</p>
          <p className="cr-stage-sub">{stage.sub}</p>
        </div>
      </div>
      {photo ? (
        <div className="cr-stage-thumb">
          <img src={photo} alt={`${stage.word} beat`} />
          <button className="cr-stage-clear" onClick={onClear} aria-label="Remove photo"><X size={14} /></button>
        </div>
      ) : (
        <button className="cr-stage-add" onClick={() => inputRef.current?.click()}>
          <Camera size={18} /> Add photo
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) { try { onSet(await fileToThumb(file)); } catch { /* ignore */ } }
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function CreateReel() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [dish, setDish] = useState('');
  const [flavorKey, setFlavorKey] = useState('rich');
  const [category, setCategory] = useState('comfort');
  const [time, setTime] = useState('25');
  const [cost, setCost] = useState('14.00');
  const [difficulty, setDifficulty] = useState('EASY');
  const [username, setUsername] = useState(() => localStorage.getItem('dig_in_handle') || '@you');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('homemade, digin');
  const [photos, setPhotos] = useState(() => Array(STAGES.length).fill(null));
  const [baseRecipe, setBaseRecipe] = useState(null);
  const [result, setResult] = useState(null); // set after publish

  const spotsLeft = useMemo(getFoundingSpotsLeft, []);
  const flavor = FLAVOR_BY_KEY[flavorKey];

  // Prefill from a built-in recipe so a user can reel a dish they just cooked.
  function applyBase(id) {
    const src = REELS.find(r => r.id === id);
    if (!src) { setBaseRecipe(null); return; }
    setBaseRecipe(src.recipe);
    setDish(src.dish);
    setFlavorKey(FLAVORS.find(f => f.label === src.flavor)?.key || 'rich');
    setCategory(src.quipCategory || 'comfort');
    setTime(String(src.time));
    setCost(src.cost);
    setDifficulty(src.difficulty.toUpperCase());
  }

  const draft = useMemo(() => ({
    id: 'draft',
    dish: dish.trim() || 'Your Dish',
    username: username.trim() || '@you',
    flavor: flavor.label,
    tint: flavor.tint,
    tint2: flavor.tint2,
    time: time.trim(),
    cost: cost.trim(),
    difficulty,
    likes: 0,
    novaCaption: caption.trim(),
    novaQuip: pickNovaQuip(category, 'Boom. You did that.'),
    quipCategory: category,
    hashtags: hashtags.split(/[,\s]+/).map(h => h.replace(/^#/, '').trim()).filter(Boolean),
    stagePhotos: photos,
    recipe: baseRecipe || { name: dish.trim() || 'Your Dish', time: time.trim(), cost: cost.trim(), difficulty, ingredients: [], steps: [] },
  }), [dish, username, flavor, time, cost, difficulty, caption, category, hashtags, photos, baseRecipe]);

  const canPublish = dish.trim().length > 0;

  function publish() {
    try { localStorage.setItem('dig_in_handle', username.trim() || '@you'); } catch { /* ignore */ }
    const out = publishUserReel({ ...draft, id: undefined });
    setResult(out);
  }

  // ── Success screen ────────────────────────────────────────────
  if (result) {
    const { foundingNumber, coinsEarned, spotsLeft: left } = result;
    return (
      <div className="reel-page cr-page">
        <Nav />
        <div className="cr-done">
          <Sparkles className="cr-done-spark" size={40} />
          <p className="cr-done-nova">NOVA</p>
          <h1 className="cr-done-title">
            {foundingNumber
              ? "You just became a Nova Creator. That's not cooking anymore — that's art. I'm so proud."
              : "That's a reel. The feed's better because you showed up."}
          </h1>
          <div className="cr-done-rewards">
            <div className="cr-reward"><Coins size={20} /> +{coinsEarned} Nova Coins</div>
            {foundingNumber && (
              <div className="cr-reward cr-reward-founding">
                FOUNDING CREATOR #{foundingNumber}
                <span>of {FOUNDING_CAP} · {left} spots left</span>
              </div>
            )}
          </div>
          <div className="cr-done-actions">
            <button className="cr-btn cr-btn-primary" onClick={() => navigate('/reels')}>SEE IT IN THE FEED</button>
            <button className="cr-btn" onClick={() => { setResult(null); setPhotos(Array(STAGES.length).fill(null)); setDish(''); setCaption(''); setStep(1); }}>
              MAKE ANOTHER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reel-page cr-page">
      <Nav />

      <header className="cr-topbar">
        <button className="cr-back" onClick={() => (step === 1 ? navigate('/reels') : setStep(step - 1))} aria-label="Back">
          <ChevronLeft size={20} />
        </button>
        <div className="cr-steps">
          {[1, 2, 3].map(n => <span key={n} className={`cr-step-dot${n === step ? ' is-on' : ''}${n < step ? ' is-done' : ''}`} />)}
        </div>
        <div className="cr-founding-pill">{spotsLeft} / {FOUNDING_CAP} spots left</div>
      </header>

      <div className="cr-body">
        {/* ── Step 1 — describe the dish ── */}
        {step === 1 && (
          <div className="cr-form">
            <h1 className="cr-h1">What did you make?</h1>

            <label className="cr-label">Start from a recipe <span>(optional)</span></label>
            <select className="cr-input" value={baseRecipe ? REELS.find(r => r.recipe === baseRecipe)?.id : ''} onChange={e => applyBase(e.target.value)}>
              <option value="">Freestyle — my own dish</option>
              {REELS.map(r => <option key={r.id} value={r.id}>{r.dish}</option>)}
            </select>

            <label className="cr-label">Dish name</label>
            <input className="cr-input" value={dish} onChange={e => setDish(e.target.value)} placeholder="Crispy Chili Noodles" maxLength={48} />

            <label className="cr-label">Flavor <span>(sets the reel's color)</span></label>
            <div className="cr-flavors">
              {FLAVORS.map(f => (
                <button
                  key={f.key}
                  className={`cr-flavor${flavorKey === f.key ? ' is-on' : ''}`}
                  style={{ '--c': f.tint }}
                  onClick={() => { setFlavorKey(f.key); setCategory(f.category); }}
                >{f.label}</button>
              ))}
            </div>

            <label className="cr-label">Nova's vibe <span>(which voice lines she reacts with)</span></label>
            <div className="cr-chips">
              {CATEGORIES.map(c => (
                <button key={c} className={`cr-chip${category === c ? ' is-on' : ''}`} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>

            <div className="cr-row3">
              <div><label className="cr-label">Time (min)</label><input className="cr-input" value={time} onChange={e => setTime(e.target.value)} inputMode="numeric" /></div>
              <div><label className="cr-label">Cost ($)</label><input className="cr-input" value={cost} onChange={e => setCost(e.target.value)} inputMode="decimal" /></div>
              <div><label className="cr-label">Difficulty</label>
                <select className="cr-input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <label className="cr-label">Your handle</label>
            <input className="cr-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="@you" maxLength={24} />

            <label className="cr-label">Caption <span>(optional)</span></label>
            <input className="cr-input" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Five ingredients, zero regrets." maxLength={80} />

            <label className="cr-label">Hashtags</label>
            <input className="cr-input" value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="quickdinner, spicy" />

            <button className="cr-btn cr-btn-primary cr-next" disabled={!dish.trim()} onClick={() => setStep(2)}>
              NEXT: CAPTURE THE 7 SECONDS
            </button>
          </div>
        )}

        {/* ── Step 2 — capture the five beats ── */}
        {step === 2 && (
          <div className="cr-form">
            <h1 className="cr-h1">Capture the arc</h1>
            <p className="cr-sub">One shot per beat — raw to plated. Skip any beat and Nova fills it with the tinted card. Every beat is optional.</p>
            <div className="cr-stages">
              {STAGES.map((s, i) => (
                <StageCapture
                  key={s.word}
                  stage={s}
                  index={i}
                  photo={photos[i]}
                  onSet={(p) => setPhotos(prev => prev.map((x, idx) => idx === i ? p : x))}
                  onClear={() => setPhotos(prev => prev.map((x, idx) => idx === i ? null : x))}
                />
              ))}
            </div>
            <button className="cr-btn cr-btn-primary cr-next" onClick={() => setStep(3)}>NEXT: PREVIEW</button>
          </div>
        )}

        {/* ── Step 3 — preview & publish ── */}
        {step === 3 && (
          <div className="cr-preview-wrap">
            <h1 className="cr-h1">Your 7-second reel</h1>
            <p className="cr-sub">This is exactly how it drops in the feed. Loops forever — watch a full arc before you publish.</p>
            <div className="cr-preview">
              <Reel reel={draft} active preview />
            </div>
            <div className="cr-publish-bar">
              <div className="cr-publish-reward"><Coins size={16} /> +{COINS_PER_UPLOAD} on publish</div>
              <button className="cr-btn cr-btn-primary" disabled={!canPublish} onClick={publish}>
                <Check size={16} /> PUBLISH REEL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
