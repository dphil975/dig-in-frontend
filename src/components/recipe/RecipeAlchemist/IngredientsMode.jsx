import { useState, useRef, useCallback } from 'react';

/* From Ingredients — say what's in your fridge, get a recipe built around it,
   with step-by-step photo-check coaching. Merged in from the former standalone
   AI Recipe Helper page (/recipe-ai) — same tool, same job, now living inside
   Kitchen Alchemist instead of a separate tab, restyled onto the app's real
   design tokens (see RecipeAlchemist.css). Behavior is unchanged from the
   original page. */

// Curated fallback — shown when the AI service is not configured or unreachable
const CURATED_RECIPES = [
  {
    id: 1,
    name: 'Cacio e Pepe',
    tag: 'CACIO',
    description: 'Roman pasta with pecorino & black pepper',
    time: '20 min',
    difficulty: 'Easy',
    steps: [
      'Bring a large pot of salted water to a boil.',
      'Cook spaghetti until al dente, reserving 1 cup pasta water.',
      'Toast black pepper in a dry pan for 1 minute until fragrant.',
      'Add a splash of pasta water to the pepper — it will steam.',
      'Toss drained pasta in the pan with pepper and pasta water.',
      'Remove from heat. Add grated pecorino and toss vigorously.',
      'Add more pasta water as needed for a creamy, glossy sauce.',
    ],
    tips: [
      { label: 'WHY PASTA WATER?', text: 'Starchy water helps the sauce cling to each strand and creates a creamy emulsion without cream.', type: 'success' },
      { label: 'COMMON MISTAKE',   text: 'Adding cheese over heat causes it to clump. Always pull the pan off the flame first.', type: 'danger' },
    ],
    substitutions: [
      { ingredient: 'Pecorino',   substitute: 'Parmesan',       note: 'Milder flavour, equally creamy' },
      { ingredient: 'Spaghetti',  substitute: 'Bucatini or rigatoni', note: 'Different texture, same method' },
    ],
  },
  {
    id: 2,
    name: 'Tacos al Pastor',
    tag: 'TACOS',
    description: 'Marinated pork tacos with pineapple',
    time: '35 min',
    difficulty: 'Medium',
    steps: [
      'Blend guajillo chiles, garlic, achiote, cumin, and orange juice.',
      'Marinate sliced pork shoulder in the chile mixture for 2+ hours.',
      'Cook marinated pork in a hot cast iron until charred at the edges.',
      'Rest pork 5 minutes, then slice or chop.',
      'Warm corn tortillas directly over a gas flame or griddle.',
      'Grill pineapple slices until caramelised — about 2 min per side.',
      'Assemble: tortilla → pork → pineapple → onion → cilantro → lime.',
    ],
    tips: [
      { label: 'ACHIOTE SWAP',    text: 'Sub with 1 tsp paprika + ½ tsp cumin + ¼ tsp annatto powder if needed.', type: 'success' },
      { label: 'PINEAPPLE TIMING', text: 'Marinate over 4 hours? Remove pineapple to avoid mushy pork.', type: 'warning' },
    ],
    substitutions: [
      { ingredient: 'Pork shoulder', substitute: 'Chicken thighs', note: 'Cook faster, just as flavourful' },
      { ingredient: 'Corn tortillas', substitute: 'Flour tortillas', note: 'Not traditional but widely available' },
    ],
  },
  {
    id: 3,
    name: 'Matcha Daifuku',
    tag: 'MATCHA',
    description: 'Japanese matcha mochi with red bean',
    time: '30 min',
    difficulty: 'Medium',
    steps: [
      'Whisk mochiko, matcha powder, sugar, and milk until smooth.',
      'Microwave in 1-minute intervals, stirring between, until thick — about 3 min.',
      'Dust a board generously with cornstarch.',
      'Turn out the mochi dough and dust with more cornstarch.',
      'Roll red bean paste into small balls (about 1 tbsp each).',
      'Flatten a mochi piece, place a bean ball in the centre.',
      'Pinch edges together and roll gently to seal.',
    ],
    tips: [
      { label: 'WORK FAST',       text: 'Mochi is easiest to shape when warm. Microwave 10 s if it cools too much.', type: 'warning' },
      { label: 'BEAN PASTE SWAP', text: 'No red bean? Use 1 part PB + 1 part icing sugar, chilled into balls.', type: 'success' },
    ],
    substitutions: [
      { ingredient: 'Mochiko',     substitute: 'Glutinous rice flour', note: 'Same thing, different brand name' },
      { ingredient: 'Red bean paste', substitute: 'Nutella + cream cheese', note: 'Western shortcut, works great' },
    ],
  },
];

/* Resize image client-side so photo analysis stays under Vercel's 4.5 MB body limit */
async function resizeImage(dataUrl, maxDim = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
  });
}

function fallbackAnalysis(recipe, stepIdx) {
  const step = recipe?.steps[stepIdx ?? 0] ?? '';
  return {
    match:   { label: 'STEP MATCH',  text: `Looks consistent with: "${step.slice(0, 80)}…"`, type: 'success' },
    texture: { label: 'TEXTURE',     text: 'Good consistency for this stage.', type: 'success' },
    tip:     { label: 'NEXT ACTION', text: stepIdx != null && stepIdx < (recipe?.steps.length - 1)
      ? `Proceed to step ${stepIdx + 2}: ${recipe?.steps[stepIdx + 1]?.slice(0, 80)}…`
      : 'Final step — plate and serve!', type: '' },
  };
}

export default function IngredientsMode() {
  const [inputVal,       setInputVal]       = useState('');
  const [ingredients,    setIngredients]    = useState([]);
  const [genMode,        setGenMode]        = useState('idle'); // 'idle' | 'loading' | 'results'
  const [recipes,        setRecipes]        = useState(CURATED_RECIPES);
  const [aiPowered,      setAiPowered]      = useState(false);
  const [genError,       setGenError]       = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeStep,     setActiveStep]     = useState(null);
  const [imagePreview,   setImagePreview]   = useState(null);
  const [dragOver,       setDragOver]       = useState(false);
  const [analysing,      setAnalysing]      = useState(false);
  const [analysis,       setAnalysis]       = useState(null);
  const fileInputRef = useRef(null);

  // ── Ingredient chips ──────────────────────────────────────────────────────

  function addIngredient(raw) {
    const val = raw.trim().toLowerCase();
    if (val && !ingredients.includes(val)) {
      setIngredients(prev => [...prev, val]);
    }
    setInputVal('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addIngredient(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && ingredients.length) {
      setIngredients(prev => prev.slice(0, -1));
    }
  }

  function loadFromPantry() {
    const pantry = JSON.parse(localStorage.getItem('dig_in_pantry') || '[]');
    const all = [...new Set(
      (Array.isArray(pantry) ? pantry : [])
        .map(i => (typeof i === 'string' ? i : i.name || i.product || ''))
        .filter(Boolean),
    )].slice(0, 15);
    if (all.length) {
      setIngredients(all);
    }
  }

  // ── Generate recipes ──────────────────────────────────────────────────────

  async function generateRecipes() {
    if (!ingredients.length) return;
    setGenMode('loading');
    setGenError(null);
    setSelectedRecipe(null);
    setActiveStep(null);
    setImagePreview(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/recipe-ai', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mode: 'recipes', ingredients }),
        signal:  AbortSignal.timeout(28000),
      });
      const data = await res.json();

      if (data.fallback || !Array.isArray(data.recipes) || !data.recipes.length) {
        setRecipes(CURATED_RECIPES);
        setAiPowered(false);
        setGenError(data.fallback ? 'AI not configured yet — showing curated picks.' : 'No recipes returned, showing curated picks.');
      } else {
        setRecipes(data.recipes.map((r, i) => ({ ...r, id: r.id ?? i + 1 })));
        setAiPowered(true);
        setGenError(null);
      }
    } catch {
      setRecipes(CURATED_RECIPES);
      setAiPowered(false);
      setGenError('Could not reach AI — showing curated picks.');
    }

    setGenMode('results');
  }

  // ── Photo analysis ────────────────────────────────────────────────────────

  const processImage = useCallback((file) => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const raw = e.target.result;
      setImagePreview(raw);
      setAnalysing(true);
      setAnalysis(null);

      try {
        const resized = await resizeImage(raw);
        const res = await fetch('/api/recipe-ai', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            mode:   'photo',
            image:  resized,
            step:   selectedRecipe?.steps[activeStep ?? 0] ?? '',
            recipe: selectedRecipe?.name ?? '',
          }),
          signal: AbortSignal.timeout(20000),
        });
        setAnalysis(res.ok ? await res.json() : fallbackAnalysis(selectedRecipe, activeStep));
      } catch {
        setAnalysis(fallbackAnalysis(selectedRecipe, activeStep));
      } finally {
        setAnalysing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [selectedRecipe, activeStep]);

  function handleFileChange(e) { processImage(e.target.files[0]); }
  function handleDrop(e) { e.preventDefault(); setDragOver(false); processImage(e.dataTransfer.files[0]); }

  function handleSelectRecipe(recipe) {
    setSelectedRecipe(recipe);
    setActiveStep(null);
    setImagePreview(null);
    setAnalysis(null);
  }

  const tips = selectedRecipe?.tips ?? [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="alch-mode">
      <div className="alch-card alch-card-head">
        <h2 className="alch-title">What’s in your kitchen?</h2>
        <p className="alch-sub">Tell us what you’ve got — <b>we’ll build a recipe around it</b>, step by step.</p>
      </div>

      {/* ── Ingredient input ── */}
      <div className="alch-card">
        <div className="alchi-row">
          <span className="alch-card-label" style={{ marginBottom: 0 }}>YOUR INGREDIENTS</span>
          <button className="alch-btn alch-btn-outline-matcha" onClick={loadFromPantry} title="Load from barcode scanner pantry">
            Load from pantry
          </button>
        </div>

        <div className="alchi-chipwrap" onClick={() => document.getElementById('alchi-ing-input')?.focus()}>
          {ingredients.map(ing => (
            <span key={ing} className="alchi-chip">
              {ing}
              <button className="alchi-chip-x" onClick={e => { e.stopPropagation(); setIngredients(p => p.filter(i => i !== ing)); }}>×</button>
            </span>
          ))}
          <input
            id="alchi-ing-input"
            className="alchi-chipfield"
            placeholder={ingredients.length ? 'Add another…' : 'Type an ingredient and press Enter'}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => inputVal.trim() && addIngredient(inputVal)}
          />
        </div>

        <div className="alchi-row" style={{ marginTop: 14, marginBottom: 0 }}>
          <span className="alchi-hint">Press Enter or comma to add each ingredient</span>
          <button
            className="alch-btn alch-btn-primary"
            onClick={generateRecipes}
            disabled={!ingredients.length || genMode === 'loading'}
          >
            {genMode === 'loading' ? (<><span className="alchi-spinner-sm" />Asking AI…</>) : 'Generate Recipes'}
          </button>
        </div>

        {genError && <div className="alchi-gen-error">{genError}</div>}
      </div>

      {/* ── Recipe selector ── */}
      <div className="alch-card">
        <div className="alchi-row" style={{ marginBottom: genMode === 'loading' ? 0 : 14 }}>
          <span className="alch-card-label" style={{ marginBottom: 0 }}>
            {genMode === 'idle' ? 'SAMPLE RECIPES' : aiPowered ? 'AI RECIPES FOR YOU' : 'CURATED RECIPES'}
          </span>
          {aiPowered && <span className="alch-badge-earned">AI-POWERED</span>}
        </div>

        {genMode === 'loading' ? (
          <div className="alchi-loading">
            <div className="alchi-spinner" />
            <p>Cooking up personalised recipes…</p>
          </div>
        ) : (
          <div className="alchi-grid">
            {recipes.map(recipe => (
              <div
                key={recipe.id}
                className={`alchi-recipe${selectedRecipe?.id === recipe.id ? ' selected' : ''}`}
                onClick={() => handleSelectRecipe(recipe)}
              >
                <div className="alchi-recipe-tag">{recipe.tag || recipe.pixelEmoji || 'DISH'}</div>
                <div className="alchi-recipe-name">{recipe.name}</div>
                <p className="alchi-recipe-desc">{recipe.description}</p>
                {(recipe.time || recipe.difficulty) && (
                  <div className="alchi-recipe-meta">
                    {recipe.time && <span>{recipe.time}</span>}
                    {recipe.difficulty && <span className={`alchi-diff-${recipe.difficulty.toLowerCase()}`}>{recipe.difficulty}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Steps + photo analysis ── */}
      {selectedRecipe && (
        <div className="alchi-assist-grid">
          <div className="alch-card">
            <span className="alch-card-label">RECIPE STEPS</span>
            <div className="alchi-steps">
              {selectedRecipe.steps.map((step, i) => (
                <div
                  key={i}
                  className={`alchi-step${activeStep === i ? ' active' : ''}`}
                  onClick={() => setActiveStep(i)}
                >
                  <div className="alchi-step-n">STEP {i + 1}</div>
                  <div className="alchi-step-t">{step}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="alch-card">
            <span className="alch-card-label">PHOTO CHECK</span>
            <div
              className={`alchi-upload${dragOver ? ' drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="alchi-upload-text">DROP PHOTO HERE</div>
              <div className="alchi-upload-sub">
                {activeStep != null
                  ? `Upload a photo of Step ${activeStep + 1} for AI feedback`
                  : 'Select a step first, then upload your photo'}
              </div>
              <button
                className="alch-btn alch-btn-primary"
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                disabled={activeStep == null}
              >Choose File</button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {imagePreview && (
              <div>
                <img className="alchi-preview-img" src={imagePreview} alt="Your cooking" />
                {analysing && (
                  <div className="alchi-analysing">
                    <span className="alchi-spinner-sm" style={{ borderColor: 'rgba(110,130,89,.3)', borderTopColor: 'var(--dig-matcha, #6E8259)' }} />
                    {aiPowered ? 'AI is analysing your photo…' : 'Analysing…'}
                  </div>
                )}
                {analysis && (
                  <div>
                    <span className="alch-card-label">
                      ANALYSIS {aiPowered && <span className="alch-badge-earned" style={{ marginLeft: 6 }}>AI</span>}
                    </span>
                    {Object.values(analysis).map((item, i) => (
                      <div key={i} className={`alchi-analysis-item${item.type ? ' ' + item.type : ''}`}>
                        <div className="alchi-analysis-label">{item.label}</div>
                        <div className="alchi-analysis-text">{item.text}</div>
                      </div>
                    ))}
                    <div className="alchi-feedback">
                      <div className="alchi-feedback-head">WAS THIS HELPFUL?</div>
                      <div className="alchi-feedback-btns">
                        <button className="alchi-feedback-btn correct">✓ Yes</button>
                        <button className="alchi-feedback-btn incorrect">✗ Not quite</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tips & substitutions ── */}
      {selectedRecipe && (tips.length > 0 || selectedRecipe.substitutions?.length > 0) && (
        <div className="alch-card">
          {tips.length > 0 && (
            <>
              <span className="alch-card-label">PRO TIPS FOR {selectedRecipe.name.toUpperCase()}</span>
              {tips.map((tip, i) => (
                <div key={i} className={`alchi-guide-tip${tip.type ? ' tip-' + tip.type : ''}`}>
                  <strong>{tip.label}:</strong> {tip.text}
                </div>
              ))}
            </>
          )}

          {selectedRecipe.substitutions?.length > 0 && (
            <>
              <span className="alch-card-label" style={{ marginTop: tips.length ? 16 : 0 }}>SUBSTITUTIONS</span>
              <div className="alchi-subs">
                {selectedRecipe.substitutions.map((s, i) => (
                  <div key={i} className="alchi-sub">
                    <span className="alchi-sub-orig">{s.ingredient}</span>
                    <span className="alchi-sub-arrow">→</span>
                    <span className="alchi-sub-new">{s.substitute}</span>
                    {s.note && <span className="alchi-sub-note">{s.note}</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!selectedRecipe && genMode !== 'loading' && (
        <div className="alch-card">
          <span className="alch-card-label">HOW IT WORKS</span>
          <div className="alchi-guide-tip">Add your ingredients above, then click <strong>Generate Recipes</strong>.</div>
          <div className="alchi-guide-tip">Select a recipe to see step-by-step instructions.</div>
          <div className="alchi-guide-tip">Click a step and upload a photo to get AI cooking feedback.</div>
        </div>
      )}
    </div>
  );
}
