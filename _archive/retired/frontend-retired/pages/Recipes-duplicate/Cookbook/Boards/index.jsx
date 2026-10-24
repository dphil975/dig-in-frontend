import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import {
  getBoards, createBoard, updateBoard, deleteBoard,
  addRecipeToBoard, removeRecipeFromBoard, getBoardRecipes, recipeKey,
  buildShareUrl,
} from '../../../../services/boardsService';
import { getSavedRecipes } from '../../../../services/saveService';
import './Boards.css';

const EMOJI_MAP = {
  pasta:'PASTA', soup:'SOUP', rice:'RICE', bread:'BREAD', cake:'CAKE', cookie:'COOKIE',
  salad:'SALAD', chicken:'CHICKEN', beef:'BEEF', fish:'FISH', curry:'CURRY', noodle:'NOODLE',
  taco:'TACO', burger:'BURGER', egg:'EGG', dessert:'DESSERT', default:'DEFAULT',
};
function dishEmoji(r) {
  const t = ((r?.name || '') + ' ' + (r?.country || '')).toLowerCase();
  for (const [k, v] of Object.entries(EMOJI_MAP)) if (k !== 'default' && t.includes(k)) return v;
  return EMOJI_MAP.default;
}
const cleanTitle = (n = '') => n.replace(/\s*\([^)]*\)/g, '').trim() || n;
const timeOf = r => r.time || r.totalTime || r.total_time || ((r.prepTime || 0) + (r.cookTime || 0)) || 0;
const BOARD_EMOJIS = ['PIN', 'EGG', 'SPICY', 'RAMEN', 'CAKE', 'SALAD', 'GLOBAL', 'BOLT', 'HEART', 'FIRE'];

/* ── Editable board title (local draft so spaces type cleanly) ───── */
function BoardTitleInput({ board, onChange }) {
  const [val, setVal] = useState(board.title);
  useEffect(() => { setVal(board.title); }, [board.id]); // reset when switching boards
  return (
    <input
      className="bd-title-input"
      value={val}
      onChange={e => { setVal(e.target.value); updateBoard(board.id, { title: e.target.value }); onChange?.(); }}
      onBlur={() => { if (!val.trim()) { setVal('Untitled Board'); updateBoard(board.id, { title: 'Untitled Board' }); onChange?.(); } }}
    />
  );
}

/* ── A recipe tile ───────────────────────────────────────────────── */
function RecipeTile({ r, onOpen, onRemove }) {
  const t = timeOf(r);
  return (
    <div className="bd-recipe" onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={e => (e.key === 'Enter') && onOpen()}>
      <div className="bd-recipe-img">
        {r.image ? <img src={r.image} alt={r.name} loading="lazy" /> : <span>{dishEmoji(r)}</span>}
      </div>
      <div className="bd-recipe-body">
        <div className="bd-recipe-name">{cleanTitle(r.name)}</div>
        <div className="bd-recipe-meta">
          {(r.country || r.cuisine) || 'Recipe'}{t ? ` · ${t}m` : ''}
        </div>
      </div>
      {onRemove && (
        <button className="bd-recipe-x" title="Remove" onClick={e => { e.stopPropagation(); onRemove(); }}>×</button>
      )}
    </div>
  );
}

/* ── A board cover card (overview) ───────────────────────────────── */
function BoardCard({ board, onOpen }) {
  const recipes = getBoardRecipes(board);
  const covers = recipes.slice(0, 4);
  const cells = [...covers, ...Array(Math.max(0, 4 - covers.length)).fill(null)];
  return (
    <button className="bd-board" onClick={onOpen}>
      <div className="bd-cover">
        {cells.map((r, i) => (
          <div className="bd-cover-cell" key={i}>
            {r ? (r.image ? <img src={r.image} alt="" loading="lazy" /> : <span>{dishEmoji(r)}</span>)
               : <span className="bd-cover-blank" />}
          </div>
        ))}
        {recipes.length === 0 && <span className="bd-cover-emoji">{board.emoji}</span>}
      </div>
      <div className="bd-board-foot">
        <span className="bd-board-title">{board.emoji} {board.title}</span>
        <span className="bd-board-count">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</span>
      </div>
    </button>
  );
}

export default function Boards({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [boards, setBoards] = useState(() => getBoards());
  const [saved, setSaved]   = useState(() => getSavedRecipes());
  const [openId, setOpenId] = useState(null);          // open board id | null
  const [creating, setCreating] = useState(false);
  const [form, setForm]     = useState({ title: '', emoji: 'DISH' });
  const [picker, setPicker] = useState(false);
  const [toast, setToast]   = useState('');

  const refresh = useCallback(() => {
    setBoards(getBoards());
    setSaved(getSavedRecipes());
  }, []);

  function flash(msg) { setToast(msg); setTimeout(() => setToast(''), 2200); }

  const openBoard = openId ? getBoards().find(b => b.id === openId) : null;

  function openRecipe(r) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(r));
      sessionStorage.removeItem('dig_in_full_recipe_adapt');   // no carried-over customizations
    } catch {}
    navigate('/recipe');
  }

  function submitCreate(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const b = createBoard({ title: form.title, emoji: form.emoji });
    setForm({ title: '', emoji: 'DISH' });
    setCreating(false);
    refresh();
    setOpenId(b.id);
  }

  async function share(board) {
    const url = buildShareUrl(board);
    try {
      if (navigator.share) {
        await navigator.share({ title: board.title, text: `My "${board.title}" recipe board on Dig In`, url });
      } else {
        await navigator.clipboard.writeText(url);
        flash('Share link copied to clipboard!');
      }
    } catch { /* user cancelled */ }
  }

  function remove(boardId) {
    if (!window.confirm('Delete this board? Your saved recipes stay in your collection.')) return;
    deleteBoard(boardId);
    setOpenId(null);
    refresh();
  }

  // Recipes saved but not yet in the open board (for the add picker)
  const addable = openBoard
    ? saved.filter(r => !openBoard.recipeKeys.includes(recipeKey(r)))
    : [];

  return (
    <div className="boards-page">
      {!embedded && <Nav />}
      {toast && <div className="bd-toast">{toast}</div>}

      <div className="bd-wrap">

        {/* ── Overview ─────────────────────────────────────────── */}
        {!openBoard && (
          <>
            <div className="bd-head">
              <div>
                <p className="bd-eyebrow">YOUR COLLECTION</p>
                <h1 className="bd-title">My Boards</h1>
              </div>
              <button className="bd-btn bd-btn-gold" onClick={() => setCreating(c => !c)}>
                + NEW BOARD
              </button>
            </div>

            {creating && (
              <form className="bd-create" onSubmit={submitCreate}>
                <div className="bd-emoji-row">
                  {BOARD_EMOJIS.map(e => (
                    <button type="button" key={e}
                      className={`bd-emoji-pick${form.emoji === e ? ' active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, emoji: e }))}>{e}</button>
                  ))}
                </div>
                <div className="bd-create-row">
                  <input className="bd-input" autoFocus placeholder="Board name (e.g. Weeknight Dinners)"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  <button className="bd-btn bd-btn-gold" type="submit">CREATE</button>
                </div>
              </form>
            )}

            <div className="bd-boards-grid">
              {boards.length === 0 && !creating && (
                <div className="bd-empty">
                  No boards yet. Create one to start organizing the recipes you save.
                </div>
              )}
              {boards.map(b => (
                <BoardCard key={b.id} board={b} onOpen={() => setOpenId(b.id)} />
              ))}
            </div>

            {/* All saved recipes */}
            <div className="bd-saved-head">
              <h2 className="bd-subtitle">All Saved Recipes · {saved.length}</h2>
              <p className="bd-hint">Every recipe you've hearted. Open a board to organize them.</p>
            </div>
            <div className="bd-recipe-grid">
              {saved.length === 0
                ? <div className="bd-empty">Nothing saved yet — tap the heart on any recipe card.</div>
                : saved.map(r => <RecipeTile key={recipeKey(r)} r={r} onOpen={() => openRecipe(r)} />)}
            </div>
          </>
        )}

        {/* ── Board detail ─────────────────────────────────────── */}
        {openBoard && (
          <>
            <button className="bd-back" onClick={() => setOpenId(null)}>‹ All boards</button>

            <div className="bd-head">
              <div className="bd-detail-title-wrap">
                <span className="bd-detail-emoji">{openBoard.emoji}</span>
                <BoardTitleInput board={openBoard} onChange={refresh} />
              </div>
              <div className="bd-detail-actions">
                <button className="bd-btn bd-btn-dark" onClick={() => setPicker(true)}>+ ADD RECIPES</button>
                <button className="bd-btn bd-btn-gold" onClick={() => share(openBoard)}>↗ SHARE</button>
                <button className="bd-btn bd-btn-danger" onClick={() => remove(openBoard.id)}>DELETE</button>
              </div>
            </div>

            <div className="bd-recipe-grid">
              {getBoardRecipes(openBoard).length === 0
                ? <div className="bd-empty">This board is empty. Tap “Add Recipes” to fill it.</div>
                : getBoardRecipes(openBoard).map(r => (
                    <RecipeTile key={recipeKey(r)} r={r}
                      onOpen={() => openRecipe(r)}
                      onRemove={() => { removeRecipeFromBoard(openBoard.id, recipeKey(r)); refresh(); }} />
                  ))}
            </div>
          </>
        )}
      </div>

      {/* Add-from-saved picker */}
      {picker && openBoard && (
        <div className="bd-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setPicker(false); }}>
          <div className="bd-modal">
            <div className="bd-modal-head">
              <span>Add to “{openBoard.title}”</span>
              <button className="bd-modal-close" onClick={() => setPicker(false)}>✕</button>
            </div>
            <div className="bd-modal-body">
              {addable.length === 0
                ? <div className="bd-empty">All your saved recipes are already on this board.</div>
                : addable.map(r => (
                    <button key={recipeKey(r)} className="bd-pick"
                      onClick={() => { addRecipeToBoard(openBoard.id, r); refresh(); }}>
                      <span className="bd-pick-img">
                        {r.image ? <img src={r.image} alt="" loading="lazy" /> : dishEmoji(r)}
                      </span>
                      <span className="bd-pick-name">{cleanTitle(r.name)}</span>
                      <span className="bd-pick-add">+</span>
                    </button>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
