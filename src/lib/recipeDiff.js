/* recipeDiff.js — wires the followed-vs-altered mark DishSubmissionModal
   already specced (isFaithful boolean + freeform remixNote) into something a
   post can actually HIGHLIGHT, not just badge.

   DishSubmissionModal's own comment explains the prior decision: "there's no
   ingredient-diffing engine anywhere in this codebase, and this app's house
   style favors an honest heuristic over fake precision." This module keeps
   that principle rather than overriding it — it does NOT attempt to infer a
   diff from freeform text with NLP, which would be exactly the fake precision
   that comment is refusing. Instead it gives the cook a structured way to
   DECLARE their changes against the recipe's real ingredient list at the
   moment they submit, and the "diff" is just rendering what they declared.
   Every line on the post is something the cook said, not something a model
   guessed.

   Three change types, matching how people actually talk about a remix:
     swap  — "I used X instead of Y"     (an ingredient OR a tool)
     omit  — "I left Y out"
     add   — "I also added Z"

   Tool swaps are their own type because DishSubmissionModal's dish_science /
   equipment fields already exist elsewhere (EquipmentGate.jsx) — "I didn't
   have a stand mixer so I used a whisk" is a distinct, common, and
   commercially real signal (a tool-alternatives surface), not an ingredient
   change, and collapsing it into the ingredient list would blur both. */

/** One declared change. `kind` drives rendering; `field` says whether it's an
    ingredient or a tool, since the two render differently on the flip card. */
export function makeChange({ kind, field = 'ingredient', original = '', used = '', note = '' }) {
  return {
    kind: ['swap', 'omit', 'add'].includes(kind) ? kind : 'swap',
    field: field === 'tool' ? 'tool' : 'ingredient',
    original: String(original || '').trim(),
    used: String(used || '').trim(),
    note: String(note || '').trim(),
  };
}

/** A change is only meaningful once it says enough to render. Swap needs
    both sides; omit needs what was left out; add needs what went in. */
export function isCompleteChange(c) {
  if (!c) return false;
  if (c.kind === 'swap') return !!c.original && !!c.used;
  if (c.kind === 'omit') return !!c.original;
  if (c.kind === 'add')  return !!c.used;
  return false;
}

/**
 * Build the diff record for a submission: the declared changes plus a
 * SUGGESTED isFaithful value, so the toggle in DishSubmissionModal can default
 * sensibly instead of forcing a blank choice. The cook can still override —
 * this only suggests.
 */
export function computeDiff(changes = []) {
  const clean = changes.filter(isCompleteChange);
  const ingredientChanges = clean.filter((c) => c.field === 'ingredient');
  const toolChanges = clean.filter((c) => c.field === 'tool');
  return {
    changes: clean,
    ingredientChanges,
    toolChanges,
    changeCount: clean.length,
    suggestedFaithful: clean.length === 0,
  };
}

/** One-line human summary for a compact context (a feed card, not the flip
    card back). Deliberately caps at 2 named changes then counts the rest —
    "swapped X for Y, +1 more" reads faster than a full list in a feed row. */
export function diffSummary(diff) {
  if (!diff || !diff.changeCount) return 'Followed as written';
  const lines = diff.changes.slice(0, 2).map(describeChange);
  const rest = diff.changeCount - lines.length;
  return rest > 0 ? `${lines.join(', ')}, +${rest} more` : lines.join(', ');
}

export function describeChange(c) {
  if (c.kind === 'swap') return `used ${c.used} instead of ${c.original}`;
  if (c.kind === 'omit') return `left out ${c.original}`;
  return `added ${c.used}`;
}

/* ── Rendering the ORIGINAL ingredient list with declared changes marked ──────
   This is the actual "difference-highlighting" the flip card back needs: not
   a separate list of changes bolted below the recipe, but the recipe's own
   ingredient list with each line marked in place — a strikethrough swap/omit,
   an inserted add — the way a real diff reads. */

function normalize(s) {
  return String(s || '').toLowerCase().trim();
}

/**
 * Merge a recipe's real ingredient list with declared ingredient changes into
 * renderable lines. Each line is one of:
 *   { state: 'kept',    text }
 *   { state: 'swapped', text: original, used, note }
 *   { state: 'omitted', text: original, note }
 * plus trailing { state: 'added', text: used, note } lines for anything that
 * wasn't in the original list at all.
 *
 * Matching is exact-normalized-string first, then substring, so "2 cups heavy
 * cream" still matches a declared original of "heavy cream" — cooks type the
 * short form when declaring a swap, not the full ingredient line.
 */
export function diffIngredientList(ingredients = [], diff) {
  const lines = (ingredients || []).map((ing) => (typeof ing === 'string' ? ing : ing?.text || ing?.name || ''))
    .filter(Boolean);
  const changes = diff?.ingredientChanges || [];
  const matched = new Set();

  const findMatch = (original) => {
    const needle = normalize(original);
    if (!needle) return -1;
    let idx = lines.findIndex((l, i) => !matched.has(i) && normalize(l) === needle);
    if (idx === -1) idx = lines.findIndex((l, i) => !matched.has(i) && normalize(l).includes(needle));
    return idx;
  };

  const out = lines.map((text) => ({ state: 'kept', text }));

  for (const c of changes) {
    if (c.kind === 'add') continue; // handled below, not matched against the list
    const idx = findMatch(c.original);
    if (idx === -1) continue; // declared a change to something not in this recipe — skip rather than guess
    matched.add(idx);
    out[idx] = c.kind === 'swap'
      ? { state: 'swapped', text: lines[idx], used: c.used, note: c.note }
      : { state: 'omitted', text: lines[idx], note: c.note };
  }

  for (const c of changes) {
    if (c.kind === 'add') out.push({ state: 'added', text: c.used, note: c.note });
  }

  return out;
}

/** Same idea for tools — a short, separate list since it's a different field
    on the recipe (equipment, not ingredients) and renders as its own row on
    the flip card rather than inline with the ingredient diff. */
export function toolSwapList(diff) {
  return (diff?.toolChanges || []).map((c) => ({
    original: c.original,
    used: c.used,
    note: c.note,
  }));
}
