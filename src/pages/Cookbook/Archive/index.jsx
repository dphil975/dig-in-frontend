import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import { getSavedRecipes, unsaveRecipe } from '../../../services/saveService';
import { tagsForRecipe } from '../../../lib/buildFeed';
import './Archive.css';

/* Archive — the old-Tumblr "archive" feel the founder missed: everything you've
   liked/saved, organized so you can actually FIND it again instead of it
   vanishing down a feed. Two axes of organization:
     • by MONTH you saved it (real savedAt timestamp; pre-timestamp saves fall
       under "Earlier")
     • by TAG (derived with the exact same tagsForRecipe the feed uses, so the
       hashtags here match the ones you follow and search elsewhere)

   It reads the single real save store (dig_in_saved) — no parallel list — so
   anything you save anywhere in the app shows up here automatically. */

// Recipe key mirrors saveService (id || name) so unsave targets the right one.
const keyOf = (r) => r?.id || r?.name || null;

function monthBucket(iso) {
  if (!iso) return { key: 0, label: 'Earlier' };
  const d = new Date(iso);
  if (isNaN(d)) return { key: 0, label: 'Earlier' };
  return {
    key: d.getFullYear() * 12 + d.getMonth() + 1,   // >0, sorts after "Earlier"
    label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
}

function ArchiveCard({ recipe, tags, onOpen, onUnsave }) {
  return (
    <article className="arch-card">
      <button type="button" className="arch-card-open" onClick={() => onOpen(recipe)}>
        <span className="arch-card-name">{recipe.name}</span>
        {(recipe.country || recipe.cuisine) && (
          <span className="arch-card-meta">{recipe.country || recipe.cuisine}</span>
        )}
        {tags.length > 0 && (
          <span className="arch-card-tags">
            {tags.slice(0, 3).map((t) => <span key={t}>{t}</span>)}
          </span>
        )}
      </button>
      <button
        type="button"
        className="arch-card-x"
        title="Remove from archive"
        aria-label={`Remove ${recipe.name} from archive`}
        onClick={() => onUnsave(recipe)}
      >
        ✕
      </button>
    </article>
  );
}

export default function Archive() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(() => getSavedRecipes());
  const [activeTag, setActiveTag] = useState(null);

  // Derive tags once per saved set; keep them alongside each recipe.
  const withTags = useMemo(
    () => saved.map((r) => ({ recipe: r, tags: tagsForRecipe(r) })),
    [saved],
  );

  // Tag → count, for the filter row (most-used first).
  const tagCounts = useMemo(() => {
    const m = new Map();
    for (const { tags } of withTags) for (const t of tags) m.set(t, (m.get(t) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16);
  }, [withTags]);

  const filtered = useMemo(
    () => (activeTag ? withTags.filter((e) => e.tags.includes(activeTag)) : withTags),
    [withTags, activeTag],
  );

  // Group the filtered set into month buckets, newest month first, and newest
  // save first within each month. "Earlier" (undated saves) sinks to the end.
  const groups = useMemo(() => {
    const byKey = new Map();
    for (const entry of filtered) {
      const b = monthBucket(entry.recipe.savedAt);
      if (!byKey.has(b.key)) byKey.set(b.key, { label: b.label, key: b.key, items: [] });
      byKey.get(b.key).items.push(entry);
    }
    const arr = [...byKey.values()];
    for (const g of arr) {
      g.items.sort((a, b) => new Date(b.recipe.savedAt || 0) - new Date(a.recipe.savedAt || 0));
    }
    return arr.sort((a, b) => b.key - a.key);   // newest month first; "Earlier" (key 0) last
  }, [filtered]);

  const openRecipe = useCallback((recipe) => {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }, [navigate]);

  const onUnsave = useCallback((recipe) => {
    unsaveRecipe(recipe);
    setSaved(getSavedRecipes());
  }, []);

  return (
    <div className="arch-page">
      <Nav />
      <div className="arch-wrap">
        <header className="arch-head">
          <h1 className="arch-title">Your Archive</h1>
          <p className="arch-sub">
            Everything you've saved — kept, dated, and searchable. Like the old
            Tumblr archive: nothing you liked just disappears.
          </p>
        </header>

        {saved.length === 0 ? (
          <div className="arch-empty">
            <p>You haven't saved anything yet. When you tap the save on a recipe, it lands here — organized by when you saved it and what it is.</p>
            <button type="button" className="arch-btn" onClick={() => navigate('/recipe-cards')}>Browse recipes →</button>
          </div>
        ) : (
          <>
            {tagCounts.length > 0 && (
              <div className="arch-filters" role="tablist" aria-label="Filter by tag">
                <button
                  type="button"
                  className={`arch-chip${activeTag === null ? ' active' : ''}`}
                  onClick={() => setActiveTag(null)}
                >
                  All <span className="arch-chip-n">{saved.length}</span>
                </button>
                {tagCounts.map(([tag, n]) => (
                  <button
                    key={tag}
                    type="button"
                    className={`arch-chip${activeTag === tag ? ' active' : ''}`}
                    onClick={() => setActiveTag((cur) => (cur === tag ? null : tag))}
                  >
                    {tag} <span className="arch-chip-n">{n}</span>
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <p className="arch-none">Nothing saved carries {activeTag} yet.</p>
            ) : (
              groups.map((g) => (
                <section className="arch-month" key={g.key}>
                  <h2 className="arch-month-label">{g.label} <span>{g.items.length}</span></h2>
                  <div className="arch-grid">
                    {g.items.map(({ recipe, tags }) => (
                      <ArchiveCard
                        key={keyOf(recipe)}
                        recipe={recipe}
                        tags={tags}
                        onOpen={openRecipe}
                        onUnsave={onUnsave}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
