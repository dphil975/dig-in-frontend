import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FLAVORS, recipeFlavors } from '../../../lib/flavorProfile';
import { MOOD_COLORS, recordMoodPick } from '../../../lib/moodColor';
import { RECIPES_STATIC, RECIPE_INGREDIENTS } from '../../../data/recipesStatic';
import './MoodPrompt.css';

const FLAVOR_EMOJI = {
  spicy: 'SPICY', sweet: 'SWEET', savory: 'SAVORY', rich: 'RICH',
  light: 'LIGHT', earthy: 'EARTHY', smoky: 'SMOKY', tangy: 'TANGY',
};

const DAY_PART_COPY = {
  morning:   "It's morning — what are you in the mood for?",
  midday:    "It's lunchtime — what are you in the mood for?",
  afternoon: "Afternoon craving hitting — what sounds good?",
  evening:   "It's dinner time — what are you in the mood for?",
  night:     'Late night cravings — what sounds good?',
};

function ingredientsOf(recipe) {
  return recipe.ingredients?.length ? recipe.ingredients : (RECIPE_INGREDIENTS[recipe.id] || []);
}

// Pick a random recipe matching a flavor for the "play a game" challenge.
// Falls back to the full set if nothing matches, so it never comes up empty.
function pickChallenge(flavor, excludeId) {
  const pool = RECIPES_STATIC.filter(r => {
    if (r.id === excludeId) return false;
    return recipeFlavors({ ...r, ingredients: ingredientsOf(r) }).includes(flavor);
  });
  const source = pool.length ? pool : RECIPES_STATIC.filter(r => r.id !== excludeId);
  return source[Math.floor(Math.random() * source.length)] || null;
}

export default function MoodPrompt({ dayPart, onPick, onClose }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('flavor');           // 'flavor' | 'color'
  const [gameMode, setGameMode] = useState(false);     // "wanna play a game?" opt-in, night only
  const [challenge, setChallenge] = useState(null);    // { recipe, flavor } while showing a reveal

  function pickColor(c) {
    recordMoodPick(c.id);
    if (gameMode) {
      setChallenge({ recipe: pickChallenge(c.flavor, null), flavor: c.flavor });
    } else {
      onPick(c.flavor);
    }
  }

  function cookChallenge(recipe) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.removeItem('dig_in_full_recipe_adapt');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  if (challenge?.recipe) {
    const ings = ingredientsOf(challenge.recipe);
    return (
      <div className="mood-overlay" onClick={onClose}>
        <div className="mood-card" onClick={e => e.stopPropagation()}>
          <h2 className="mood-title">YOUR CHALLENGE</h2>
          <p className="mood-body">Tired of scrolling? Here's ONE recipe — no browsing required.</p>

          <div className="mood-challenge-card">
            <div className="mood-challenge-name">{challenge.recipe.name}</div>
            <div className="mood-challenge-meta">
              {challenge.recipe.difficulty && <span>{challenge.recipe.difficulty}</span>}
              {(challenge.recipe.prepTime || challenge.recipe.cookTime) && (
                <span>{(challenge.recipe.prepTime || 0) + (challenge.recipe.cookTime || 0)} min</span>
              )}
              <span>{ings.length} ingredients</span>
            </div>
          </div>

          <button className="mood-surprise" onClick={() => cookChallenge(challenge.recipe)}>
            COOK THIS →
          </button>
          <div className="mood-challenge-actions">
            <button
              className="mood-chip"
              onClick={() => setChallenge({ recipe: pickChallenge(challenge.flavor, challenge.recipe.id), flavor: challenge.flavor })}
            >
              TRY ANOTHER
            </button>
            <button className="mood-chip" onClick={() => { setChallenge(null); onPick(challenge.flavor); }}>
              BROWSE MORE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mood-overlay" onClick={onClose}>
      <div className="mood-card" onClick={e => e.stopPropagation()}>
        <h2 className="mood-title">{DAY_PART_COPY[dayPart] || DAY_PART_COPY.midday}</h2>

        <div className="mood-tabs">
          <button className={`mood-tab${tab === 'flavor' ? ' active' : ''}`} onClick={() => setTab('flavor')}>FLAVOR</button>
          <button className={`mood-tab${tab === 'color' ? ' active' : ''}`} onClick={() => setTab('color')}>COLOR</button>
        </div>

        {tab === 'flavor' ? (
          <>
            <p className="mood-body">Pick a flavor and we'll shape today's picks around it.</p>
            <div className="mood-grid">
              {FLAVORS.map(f => (
                <button key={f} className="mood-chip" onClick={() => onPick(f)}>
                  <span className="mood-chip-emoji">{FLAVOR_EMOJI[f]}</span>
                  <span className="mood-chip-label">{f.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="mood-body">
              {gameMode ? "Pick a color — I'll hand you ONE recipe, no scrolling." : "Pick the color that matches how you feel."}
            </p>
            {dayPart === 'night' && (
              <button
                className={`mood-game-toggle${gameMode ? ' active' : ''}`}
                onClick={() => setGameMode(g => !g)}
              >
                {gameMode ? '✓ Playing a quick game' : '🎮 Feeling tired? Play a quick game instead'}
              </button>
            )}
            <div className="mood-grid">
              {MOOD_COLORS.map(c => (
                <button key={c.id} className="mood-color-chip" onClick={() => pickColor(c)}>
                  <span className="mood-color-swatch" style={{ background: c.swatch }} />
                  <span className="mood-color-label">{c.label.toUpperCase()}</span>
                  <span className="mood-color-emotion">{c.emotion}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <button className="mood-surprise" onClick={() => onPick(null)}>
          SURPRISE ME
        </button>
      </div>
    </div>
  );
}
