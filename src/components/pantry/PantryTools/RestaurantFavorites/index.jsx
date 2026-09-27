import { useMemo, useState } from 'react';
import { loadFavorites, addFavorite, removeFavorite, matchFavorites } from '../../../../lib/restaurantFavorites';

/* Restaurant Favorites — save a dish you loved, see how close your pantry is
   to recreating it. Extracted out of Pantry/index.jsx (was pushing 1,200+
   lines) — self-contained aside from reading the live `pantry` array. */
export default function RestaurantFavorites({ pantry }) {
  const [favorites, setFavorites] = useState(loadFavorites);
  const [favForm, setFavForm] = useState({ name: '', source: '', cuisine: '', keyIngredients: '' });
  const favMatches = useMemo(() => matchFavorites(pantry), [pantry, favorites]);

  function addFav(e) {
    e.preventDefault();
    const list = addFavorite({
      name: favForm.name,
      source: favForm.source,
      cuisine: favForm.cuisine,
      keyIngredients: favForm.keyIngredients.split(',').map(s => s.trim()).filter(Boolean),
    });
    setFavorites(list);
    setFavForm({ name: '', source: '', cuisine: '', keyIngredients: '' });
  }

  function removeFav(id) { setFavorites(removeFavorite(id)); }

  return (
    <section className="pantry-favorites">
      <div className="pantry-section-title">
        RESTAURANT FAVORITES <span className="pantry-count">{favorites.length}</span>
      </div>
      <p className="pantry-favorites-help">
        Loved a dish somewhere? Save its key ingredients and I'll tell you when your pantry can recreate it.
        Typed, not photo-scanned — this app doesn't have an ingredient-recognition backend behind it.
      </p>
      <form className="pantry-fav-form" onSubmit={addFav}>
        <div className="pantry-add-row">
          <input
            className="pantry-input pantry-input-name"
            placeholder="Dish name (e.g. Chipotle bowl)"
            value={favForm.name}
            onChange={e => setFavForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            className="pantry-input"
            placeholder="Where from (optional)"
            value={favForm.source}
            onChange={e => setFavForm(f => ({ ...f, source: e.target.value }))}
          />
        </div>
        <div className="pantry-add-row">
          <input
            className="pantry-input"
            placeholder="Cuisine (optional)"
            value={favForm.cuisine}
            onChange={e => setFavForm(f => ({ ...f, cuisine: e.target.value }))}
          />
          <input
            className="pantry-input pantry-input-name"
            placeholder="Key ingredients, comma separated (rice, beans, chicken, salsa)"
            value={favForm.keyIngredients}
            onChange={e => setFavForm(f => ({ ...f, keyIngredients: e.target.value }))}
            required
          />
        </div>
        <button type="submit" className="pantry-btn pantry-btn-primary">SAVE FAVORITE</button>
      </form>

      {favorites.length === 0 ? (
        <div className="pantry-empty">No favorites saved yet.</div>
      ) : (
        <div className="pantry-cook-grid">
          {favMatches.map(({ favorite, have, missing, coverage }) => (
            <div className="cook-card" key={favorite.id}>
              <div className="cook-card-head">
                <span className="cook-card-name">{favorite.name}{favorite.source ? ` · ${favorite.source}` : ''}</span>
                <span className="cook-card-cov">{Math.round(coverage * 100)}% in pantry</span>
              </div>
              <div className="cook-card-bar"><span style={{ width: `${Math.round(coverage * 100)}%` }} /></div>
              <div className="cook-card-have">Have: {have.join(', ') || '—'}</div>
              {missing.length > 0 ? (
                <div className="cook-card-missing">
                  {missing.length <= 2 && coverage >= 0.5 && <strong className="cook-card-almost">You're almost there — </strong>}
                  Need: {missing.join(', ')}
                </div>
              ) : (
                <div className="cook-card-ready">You have everything for this!</div>
              )}
              <button type="button" className="pantry-fav-remove" onClick={() => removeFav(favorite.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
