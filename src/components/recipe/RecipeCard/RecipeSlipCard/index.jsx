import { useState } from 'react';
import DishPixelPreview from '../../DishPixelPreview';
import { cleanTitle, seoDescription } from '../../../../lib/seo';
import { rateRecipe, getRating } from '../../../../services/saveService';
import { getBoards, createBoard, addRecipeToBoard, boardsContaining, recipeKey } from '../../../../services/boardsService';
import './RecipeSlipCard.css';

/* RecipeSlipCard — a rounded rectangle split down the middle: pixel art of
   the finished dish on the left, a recipe preview on the right. Opens when a
   recipe card is tapped. */

const EMOJI = {
  pasta:'PASTA', soup:'SOUP', rice:'RICE', bread:'BREAD', cake:'CAKE', cookie:'COOKIE', donut:'DONUT',
  pie:'PIE', salad:'SALAD', chicken:'CHICKEN', beef:'BEEF', fish:'FISH', curry:'CURRY', noodle:'NOODLE',
  taco:'TACO', burger:'BURGER', egg:'EGG', dumpling:'DUMPLING', default:'DEFAULT',
};
function dishEmoji(r) {
  const t = ((r?.name || '') + ' ' + (r?.country || '')).toLowerCase();
  for (const [k, v] of Object.entries(EMOJI)) if (k !== 'default' && t.includes(k)) return v;
  return EMOJI.default;
}

/* Star rating — the "voted on" signal for Home's Top Rated filter. Real per-
   device rating, persisted via saveService's rateRecipe/getRating (both
   already existed but had no UI anywhere calling them). */
function StarRating({ recipeId }) {
  const [rating, setRating] = useState(() => getRating(recipeId));
  const [hover, setHover] = useState(0);

  function rate(n) {
    rateRecipe(recipeId, n);
    setRating(n);
  }

  return (
    <div className="slip-stars" role="radiogroup" aria-label="Rate this recipe">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`slip-star${n <= (hover || rating) ? ' filled' : ''}`}
          onClick={() => rate(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* Add to Board — wired to the real boardsService (local, but genuine: same
   store My Cookbook / Boards page reads). Pick an existing board or spin up
   a new one inline. */
export function AddToBoard({ recipe }) {
  const key = recipeKey(recipe);
  const [open, setOpen] = useState(false);
  const [boards, setBoards] = useState(() => getBoards());
  const [inKeys, setInKeys] = useState(() => new Set(boardsContaining(key).map((b) => b.id)));
  const [newTitle, setNewTitle] = useState('');

  function add(boardId) {
    addRecipeToBoard(boardId, recipe);
    setInKeys((prev) => new Set(prev).add(boardId));
  }

  function addToNew() {
    const title = newTitle.trim();
    if (!title) return;
    const board = createBoard({ title });
    addRecipeToBoard(board.id, recipe);
    setBoards(getBoards());
    setInKeys((prev) => new Set(prev).add(board.id));
    setNewTitle('');
  }

  if (!open) {
    return (
      <button type="button" className="slip-btn" onClick={() => setOpen(true)}>
        + ADD TO BOARD
      </button>
    );
  }

  return (
    <div className="slip-board-picker">
      {boards.length > 0 && (
        <ul className="slip-board-list">
          {boards.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                disabled={inKeys.has(b.id)}
                onClick={() => add(b.id)}
              >
                {inKeys.has(b.id) ? `✓ ${b.title}` : b.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="slip-board-new">
        <input
          type="text"
          placeholder="New board name…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addToNew(); }}
        />
        <button type="button" onClick={addToNew}>Create</button>
      </div>
    </div>
  );
}

export default function RecipeSlipCard({ recipe, onClose, onViewSteps, onFullRecipe }) {
  if (!recipe) return null;
  const t = recipe.time || recipe.totalTime || recipe.total_time
    || ((recipe.prepTime || 0) + (recipe.cookTime || 0)) || 0;
  const cuisine = recipe.country || recipe.cuisine || '';
  const recipeId = recipeKey(recipe);

  return (
    <div className="slip-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="slip-card">
        <button className="slip-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Left — pixel art of the finished dish */}
        <div className="slip-map">
          <DishPixelPreview recipe={recipe} />
          <span className="slip-map-label">THE FINISHED DISH</span>
        </div>

        {/* Right — recipe preview */}
        <div className="slip-preview">
          <div className="slip-visual">
            {recipe.image
              ? <img src={recipe.image} alt={recipe.name}
                  onError={(e) => { e.target.style.display = 'none'; }} />
              : null}
            <span className="slip-visual-ph" style={recipe.image ? { position: 'absolute', inset: 0 , zIndex: -1, display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}>
              {dishEmoji(recipe)}
            </span>
            {recipe.image && recipe.imageCredit && (
              <a
                className="slip-visual-credit"
                href={recipe.imageCredit.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {recipe.imageCredit.author} / {recipe.imageCredit.source}
              </a>
            )}
          </div>
          <h1 className="slip-name">{cleanTitle(recipe.name) || 'Recipe'}</h1>
          <div className="slip-tags">
            {cuisine && <span className="slip-tag">{cuisine}</span>}
            {t > 0 && <span className="slip-tag">{t} min</span>}
            {recipe.difficulty && <span className="slip-tag">{recipe.difficulty}</span>}
            {recipe.servings && <span className="slip-tag">Serves {recipe.servings}</span>}
          </div>
          <p className="slip-desc">{seoDescription(recipe)}</p>
          <StarRating recipeId={recipeId} />
          <div className="slip-actions">
            <button className="slip-btn slip-btn-primary" onClick={() => onViewSteps(recipe)}>VIEW STEPS</button>
            <button className="slip-btn" onClick={() => onFullRecipe(recipe)}>FULL RECIPE →</button>
            <AddToBoard recipe={recipe} />
          </div>
        </div>
      </div>
    </div>
  );
}
