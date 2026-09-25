import { totalTimeOf } from './recipeRecommender';

/* Shared recipe-copy helpers — used by the recipe grid, the slip-card modal,
   and anywhere else a short blurb needs to double as an SEO description. */

const SEO_MAX_LEN = 155; // standard meta-description budget before search engines truncate

/** Strips any trailing "(…)" from a recipe name so titles stay compact. */
export function cleanTitle(name) {
  return (name || '').replace(/\s*\([^)]*\)/g, '').trim() || (name || '');
}

/** Truncates at a word boundary (never mid-word) and marks the cut with an ellipsis. */
function truncateClean(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

/**
 * Each recipe's SEO-compliant blurb: the author's own description/notes when
 * present, otherwise one composed from region/difficulty/servings/time.
 * Either way this enforces the things a raw `description`/`notes` field
 * doesn't guarantee on its own:
 *   - length capped to ~155 chars (the window before search engines truncate
 *     a meta description), cut cleanly at a word boundary
 *   - stray HTML/markdown and repeated whitespace stripped
 *   - the dish name is always present, so near-identical authored blurbs
 *     ("A hearty weeknight dinner.") don't read as duplicate content
 *     across different recipes
 *   - ends with terminal punctuation
 */
export function seoDescription(recipe) {
  const name = cleanTitle(recipe?.name) || 'This dish';
  const region = recipe?._regionMeta?.label || recipe?.country || recipe?.cuisine || '';
  const diff = recipe?.difficulty ? String(recipe.difficulty).toLowerCase() : '';
  const t = totalTimeOf(recipe);

  const authored = (recipe?.seo || recipe?.description || recipe?.notes || '')
    .replace(/<[^>]+>/g, ' ')   // strip stray HTML/markdown tags
    .replace(/\s+/g, ' ')       // collapse newlines/repeated whitespace
    .trim();

  if (authored) {
    const withName = authored.toLowerCase().includes(name.toLowerCase())
      ? authored
      : `${name}: ${authored}`;
    const punctuated = /[.!?…]$/.test(withName) ? withName : `${withName}.`;
    return truncateClean(punctuated, SEO_MAX_LEN);
  }

  let lead = `${name} —`;
  if (diff && region) lead += ` a ${diff} ${region} dish`;
  else if (region)    lead += ` a dish from ${region}`;
  else if (diff)      lead += ` a ${diff} dish`;
  else                lead += ' a recipe worth trying';

  const tail = [];
  if (recipe?.servings) tail.push(`serves ${recipe.servings}`);
  if (t) tail.push(`ready in about ${t} min`);

  const full = tail.length ? `${lead}, ${tail.join(', ')}.` : `${lead}.`;
  return truncateClean(full, SEO_MAX_LEN);
}
