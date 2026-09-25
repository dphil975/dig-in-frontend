/**
 * Dig In Boards Service — Pinterest-style recipe boards.
 *
 * Boards live in `dig_in_boards` (localStorage) and reference recipes by key.
 * The recipes themselves live in `dig_in_saved` (the existing save system), so
 * a recipe can sit in many boards and "All Saved" is the union. Everything is
 * local-first, so a user's boards persist in their profile across sessions.
 *
 * Sharing encodes a board + slimmed recipes into a URL-safe param so a link
 * opens a read-only board for anyone (no backend needed).
 */

import { getSavedRecipes, saveRecipe } from './saveService';

const BOARDS_KEY = 'dig_in_boards';

function load() {
  try { return JSON.parse(localStorage.getItem(BOARDS_KEY)) || []; }
  catch { return []; }
}
function persist(boards) {
  try { localStorage.setItem(BOARDS_KEY, JSON.stringify(boards)); } catch { /* quota */ }
}
function uid() { return 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
export function recipeKey(r) { return r?.id || r?.name || null; }

/* ── Board CRUD ──────────────────────────────────────────────────── */
export function getBoards() { return load(); }
export function getBoard(id) { return load().find(b => b.id === id) || null; }

export function createBoard({ title, description = '', emoji = 'PIN' } = {}) {
  const boards = load();
  const board = {
    id: uid(),
    title: (title || '').trim() || 'Untitled Board',
    description,
    emoji,
    recipeKeys: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  boards.push(board);
  persist(boards);
  return board;
}

export function updateBoard(id, fields = {}) {
  const boards = load();
  const b = boards.find(x => x.id === id);
  if (!b) return null;
  // Store the title raw (no trim) so spaces can be typed mid-edit; the create
  // flow already supplies a default for an empty name.
  if (fields.title !== undefined)       b.title = fields.title;
  if (fields.description !== undefined) b.description = fields.description;
  if (fields.emoji !== undefined)       b.emoji = fields.emoji;
  b.updatedAt = Date.now();
  persist(boards);
  return b;
}

export function deleteBoard(id) {
  persist(load().filter(b => b.id !== id));
}

/* ── Recipe membership ───────────────────────────────────────────── */
export function addRecipeToBoard(boardId, recipe) {
  saveRecipe(recipe);                 // make sure it's in dig_in_saved (idempotent)
  const key = recipeKey(recipe);
  if (!key) return;
  const boards = load();
  const b = boards.find(x => x.id === boardId);
  if (b && !b.recipeKeys.includes(key)) {
    b.recipeKeys.push(key);
    b.updatedAt = Date.now();
    persist(boards);
  }
}

export function removeRecipeFromBoard(boardId, key) {
  const boards = load();
  const b = boards.find(x => x.id === boardId);
  if (b) {
    b.recipeKeys = b.recipeKeys.filter(k => k !== key);
    b.updatedAt = Date.now();
    persist(boards);
  }
}

export function boardsContaining(key) {
  return load().filter(b => b.recipeKeys.includes(key)).map(b => b.id);
}

/** Resolve a board's recipeKeys → full recipe objects from dig_in_saved. */
export function getBoardRecipes(board) {
  if (!board) return [];
  const byKey = {};
  for (const r of getSavedRecipes()) byKey[recipeKey(r)] = r;
  return (board.recipeKeys || []).map(k => byKey[k]).filter(Boolean);
}

/* ── Sharing (encode board + recipes into a URL-safe param) ──────── */
function slim(r) {
  return {
    id: r.id, name: r.name,
    country: r.country || r.cuisine || '',
    difficulty: r.difficulty,
    time: r.time || r.totalTime || r.total_time || ((r.prepTime || 0) + (r.cookTime || 0)) || null,
    servings: r.servings,
    description: r.description || r.notes || '',
    image: r.image || '',
  };
}

function b64encode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64decode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(s)));
}

export function encodeBoardForShare(board) {
  const payload = {
    t: board.title,
    e: board.emoji,
    d: board.description || '',
    r: getBoardRecipes(board).map(slim),
  };
  return b64encode(JSON.stringify(payload));
}

export function decodeSharedBoard(param) {
  try {
    const obj = JSON.parse(b64decode(param));
    return {
      title: obj.t || 'Shared Board',
      emoji: obj.e || 'PIN',
      description: obj.d || '',
      recipes: Array.isArray(obj.r) ? obj.r : [],
    };
  } catch { return null; }
}

export function buildShareUrl(board) {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/board?b=${encodeBoardForShare(board)}`;
}

/** Import a decoded shared board into the user's own boards. */
export function importSharedBoard(shared) {
  const board = createBoard({ title: shared.title, description: shared.description, emoji: shared.emoji });
  for (const r of shared.recipes) addRecipeToBoard(board.id, r);
  return board;
}
