/* Browse page modal components and the ShareIcon used inside RegionCard.
   Pulled out of index.jsx so the main file is just the page's own tree.
   StepItem and FlipCard used to live alongside these but became unused
   when the "step viewer" moved to the full recipe page; they were removed
   in the same split rather than carried forward. */

import { useState, useEffect } from 'react';
import { RECIPE_INGREDIENTS } from '../../../data/recipesStatic';
import { totalTimeOf } from '../../../lib/recipeRecommender';
import { recipeFlavors } from '../../../lib/flavorProfile';
import { hydrationLine } from '../../../lib/hydrationCheck';
import { pairingReason } from '../../../lib/flavorPairing';
import {
  MissingIngredients, VeggieBoost, AdaptRecipe, ingredientText,
  ChangeRecipeToggle, changesList, SensoryCues,
} from '../../../components/recipe/RecipeBoostSections';
import { scoreDrink, generateDrinkSteps } from './helpers';

/* ── RecipeDetailModal — the tap-to-open recipe experience ───── */
export function RecipeDetailModal({ recipe, onClose, onAllDrinksClick, onFindStores, onFullRecipe }) {
  const [missing, setMissing] = useState(() => new Set());
  const [veggies, setVeggies] = useState(() => new Set());
  const [adapt, setAdapt] = useState(() => new Set());
  const [applied, setApplied] = useState(false);

  const ingsRaw = recipe.ingredients?.length ? recipe.ingredients : (RECIPE_INGREDIENTS[recipe.id] || []);
  const ings = ingsRaw.map(ingredientText).filter(Boolean);
  const totalTime = totalTimeOf(recipe);
  const changes = changesList(veggies, adapt);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleSet = (setter) => (key) => setter(s => {
    const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n;
  });

  const shoppingList = [...[...missing].map(i => ings[i]), ...veggies].filter(Boolean);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-head">
          <div className="modal-head-title">{recipe.name || 'Recipe'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          {/* Quick facts (emoji-free) */}
          <div className="modal-facts">
            {recipe._regionMeta && <span className="modal-fact">{recipe._regionMeta.label}</span>}
            {recipe.country && <span className="modal-fact">{recipe.country}</span>}
            {recipe.difficulty && <span className="modal-fact">{recipe.difficulty}</span>}
            {totalTime > 0 && <span className="modal-fact">{totalTime} min</span>}
            {recipe.servings && <span className="modal-fact">Serves {recipe.servings}</span>}
          </div>

          {(recipe.description || recipe.notes) && <p className="modal-desc">{recipe.description || recipe.notes}</p>}

          {/* One-line hydration read — the compact counterpart to RecipeFull's
              HydrationPanel, off the same engine so the two surfaces can't
              disagree. Renders nothing unless this recipe has a real driver. */}
          {hydrationLine({ ingredients: ings }) && (
            <p className="modal-hydration">💧 {hydrationLine({ ingredients: ings })}</p>
          )}

          {/* Interactive sections */}
          <MissingIngredients ings={ings} missing={missing} onToggle={toggleSet(setMissing)} />
          <VeggieBoost added={veggies} onToggle={toggleSet(setVeggies)} />
          <AdaptRecipe active={adapt} onToggle={toggleSet(setAdapt)} />
          <SensoryCues recipe={recipe} />

          {/* Change-the-recipe toggle — your choices carry into the full recipe */}
          <ChangeRecipeToggle on={applied} count={changes.length} onToggle={() => setApplied(a => !a)} />

          {/* Steps now live on the full recipe page, where the finished dish and
              method render properly. This modal stays a quick-customize view. */}
          <div className="rd-steps-moved">
            <span className="rd-steps-moved-txt">
              {changes.length
                ? `${changes.length} change${changes.length !== 1 ? 's' : ''} ready — open the full recipe to cook with them.`
                : 'Open the full recipe for the step-by-step method.'}
            </span>
          </div>

          {/* Bottom actions */}
          <div className="rd-actions">
            {onAllDrinksClick && (
              <button className="rd-btn rd-drinks-alt" onClick={() => onAllDrinksClick(recipe)}>DRINKS</button>
            )}
            <button className="rd-btn rd-find-stores" onClick={() => onFindStores(shoppingList)}>
              FIND STORES{shoppingList.length ? ` · ${shoppingList.length}` : ''}
            </button>
            <button
              className="rd-btn rd-full-recipe"
              onClick={() => onFullRecipe(recipe, {
                missing: [...missing], veggies: [...veggies], adapt: [...adapt], applied,
              })}
            >
              FULL RECIPE →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── DrinkDetailModal ───────────────────────────────────────── */
export function DrinkDetailModal({ drink, onClose }) {
  const steps = generateDrinkSteps(drink);
  const tags = [...(drink.flavorProfile || []), ...(drink.pairingTags || [])].slice(0, 6);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="drink-detail-box">
        <div className="drink-detail-head">
          <div className="drink-detail-title">{drink.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="drink-detail-body">
          <p className="drink-detail-desc">{drink.description || ''}</p>
          <ol className="drink-detail-steps">
            {steps.map((s, i) => (
              <li key={i}>
                <span className="drink-step-num">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="drink-detail-tags">
            {tags.map(t => <span key={t} className="drink-detail-tag">{t}</span>)}
          </div>
          {drink.price && <div className="drink-detail-price">${drink.price.toFixed(2)}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── DrinksModal ────────────────────────────────────────────── */
export function DrinksModal({ recipe, drinksData, onClose, onDrinkClick }) {
  const [activeCat, setActiveCat] = useState('all');
  const [drinkSeed, setDrinkSeed] = useState(Date.now());

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const flavors = recipeFlavors(recipe);
  const cats = [
    { id: 'all', label: 'ALL' },
    ...(drinksData?.drinkCategories || []).map(c => ({ id: c.id, label: c.label }))
  ];

  let drinks = (drinksData?.drinks || []).filter(d => d.available !== false);
  if (activeCat !== 'all') {
    drinks = drinks.filter(d =>
      (d.category || d.section || '') === activeCat || (d.categories || []).includes(activeCat)
    );
  }
  // Show every drink that matches the filter, ranked best-pairing-first —
  // "ALL DRINKS" used to mean "the top 9," capped regardless of how many
  // actually matched. The grid itself scrolls, so there's no reason to
  // truncate the list before the user even sees it.
  drinks = drinks
    .map(d => ({ ...d, _score: scoreDrink(d, recipe, flavors, drinkSeed, drinksData?.pairingRules) }))
    .sort((a, b) => b._score - a._score);

  return (
    <div className="modal-overlay drinks-drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="drinks-modal-box" role="dialog" aria-label={`Drink pairings for ${recipe.name}`}>
        <div className="drinks-modal-head">
          <div className="drinks-modal-title">DRINKS · {recipe.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="drinks-flavor-strip">
          {flavors.length
            ? flavors.map(f => <span key={f} className="flavor-tag">{f.toUpperCase()}</span>)
            : <span style={{fontSize:'12px',color:'rgba(250,235,215,0.7)'}}>Neutral — all drinks pair well</span>
          }
        </div>

        <div className="drinks-cat-bar">
          {cats.map(c => (
            <button
              key={c.id}
              className={`drinks-cat-pill${c.id === activeCat ? ' active' : ''}`}
              onClick={() => setActiveCat(c.id)}
            >
              {c.label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="drinks-grid-modal">
          {drinks.length ? drinks.map(d => (
            <div
              key={d.id}
              className={`drink-modal-card${d.featured ? ' featured' : ''}`}
              onClick={() => onDrinkClick(d)}
            >
              <div className="dmc-head">
                <span className="dmc-name">{d.name}</span>
                <span style={{fontSize:'9px', color:'#999'}}>{d.temp === 'hot' ? 'HOT' : d.temp === 'iced' || d.temp === 'cold' ? 'ICED' : ''}</span>
              </div>
              <div className="dmc-body">{d.description || ''}</div>
              <div className="dmc-reason">{pairingReason(d, recipe, flavors)}</div>
              {d.price && <div className="dmc-price">${d.price.toFixed(2)}</div>}
            </div>
          )) : (
            <p style={{color:'#999',fontSize:'12px',padding:'10px'}}>No drinks match this filter.</p>
          )}
        </div>

        <button className="drinks-remix-btn" onClick={() => setDrinkSeed(Date.now() + Math.random() * 9999)}>
          Remix Pairings
        </button>
      </div>
    </div>
  );
}

/* ── Share icon (crisp inline SVG — no emoji, no external asset) ─ */
export function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </svg>
  );
}
