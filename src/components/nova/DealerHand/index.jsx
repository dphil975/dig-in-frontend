import { useState, useEffect, useMemo, useRef } from 'react';
import { cleanTitle } from '../../../lib/platform/native';
import { dealHand } from '../../../lib/nova/dealHand';
import { NOVA_SAYS } from '../../../lib/nova/voice';
import './DealerHand.css';

/* Nova's hand — a fan of 5 recipe cards, one per flavor, dealt from a
   virtual deck. Each card is a different flavor slot (spicy, earthy, etc.),
   so the hand is both a pick and a mood-portrait of what's on the table.

     recipes     the full recipe pool (null while loading)
     loading     the pool hasn't loaded yet
     savedKeys   Set of recipe keys the user has already saved
     onCook      called with the chosen recipe when a card is clicked
     onSave      called when a card's heart is clicked
*/

const FLAVOR_META = {
  spicy:  { label: 'SPICY',  hint: 'bright heat' },
  sweet:  { label: 'SWEET',  hint: 'honeyed, warm' },
  savory: { label: 'SAVORY', hint: 'umami pull' },
  rich:   { label: 'RICH',   hint: 'buttery, deep' },
  light:  { label: 'LIGHT',  hint: 'citrus, clean' },
  earthy: { label: 'EARTHY', hint: 'rooted, grounded' },
  smoky:  { label: 'SMOKY',  hint: 'charred edge' },
  tangy:  { label: 'TANGY',  hint: 'sharp, puckered' },
};

const keyOf = (r) => String(r?.id ?? r?.name ?? '');

// Some recipes in recipes_full.json carry cuisine as "T/Tunisia" or
// "U/United_Arab_Emirates" (first letter prefix + underscore-joined name).
// Display-time cleanup only — don't rewrite the data.
function cleanCuisine(c) {
  if (!c) return '';
  return String(c).replace(/^[A-Z]\//, '').replace(/_/g, ' ');
}

export default function DealerHand({ recipes, loading, savedKeys, onCook, onSave }) {
  const [seed, setSeed] = useState(() => Date.now());
  const [phase, setPhase] = useState('dealing'); // 'dealing' | 'resting' | 'shuffling'
  const timerRef = useRef(null);

  const hand = useMemo(
    () => (recipes ? dealHand(recipes, { seed }) : { cards: [], flavors: [] }),
    [recipes, seed],
  );

  // The deal animation runs for ~450ms + (count-1) * 80ms stagger. Once it
  // ends, drop the `.is-dealing` class so hover transforms work cleanly.
  useEffect(() => {
    if (!hand.cards.length) return undefined;
    setPhase('dealing');
    const duration = 450 + Math.max(0, hand.cards.length - 1) * 80 + 60;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPhase('resting'), duration);
    return () => clearTimeout(timerRef.current);
  }, [seed, hand.cards.length]);

  function reshuffle() {
    if (phase === 'shuffling') return;
    setPhase('shuffling');
    // 400ms matches the collect keyframe; new seed re-triggers the deal.
    setTimeout(() => setSeed(Date.now() + Math.floor(Math.random() * 9999)), 400);
  }

  function handleCardKey(e, recipe) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCook(recipe);
    }
  }

  if (loading) {
    return (
      <section className="dh dh-empty" aria-label="Nova's hand" aria-busy="true">
        <p className="dh-label">{NOVA_SAYS.handLoading}</p>
      </section>
    );
  }

  if (!hand.cards.length) {
    return (
      <section className="dh dh-empty" aria-label="Nova's hand">
        <p className="dh-label">{NOVA_SAYS.handHeader}</p>
        <p className="dh-line">{NOVA_SAYS.handEmpty}</p>
      </section>
    );
  }

  const stateClass = phase === 'dealing' ? ' is-dealing'
                   : phase === 'shuffling' ? ' is-shuffling'
                   : '';

  return (
    <section className="dh" aria-label="Nova's hand">
      <div className="dh-head">
        <p className="dh-label">{NOVA_SAYS.handHeader}</p>
        <button
          type="button"
          className="dh-shuffle"
          onClick={reshuffle}
          disabled={phase === 'shuffling'}
          aria-label="Deal a new hand"
        >
          <span className="dh-shuffle-icon" aria-hidden="true">⟳</span>
          {NOVA_SAYS.handShuffle}
        </button>
      </div>
      <p className="dh-sub">{NOVA_SAYS.handSub}</p>

      <div className={`dh-table${stateClass}`}>
        <div className="dh-deck" aria-hidden="true">
          <span className="dh-deck-card" />
          <span className="dh-deck-card" />
          <span className="dh-deck-card" />
        </div>
        <div className="dh-fan" style={{ '--n': hand.cards.length }}>
          {hand.cards.map((card, i) => {
            const meta = FLAVOR_META[card.flavor] || { label: card.flavor.toUpperCase(), hint: '' };
            const k = keyOf(card.recipe);
            const saved = savedKeys?.has(k);
            const minutes = card.recipe.total_time || card.recipe.time || null;
            const cuisine = cleanCuisine(card.recipe.cuisine || card.recipe.country || '');
            return (
              <article
                key={k || i}
                className={`dh-card dh-card-${card.flavor}`}
                style={{ '--i': i }}
                role="button"
                tabIndex={0}
                aria-label={`${meta.label} card — ${card.recipe.name}`}
                onClick={() => onCook(card.recipe)}
                onKeyDown={(e) => handleCardKey(e, card.recipe)}
              >
                <div className="dh-card-top">
                  <span className="dh-card-flavor">{meta.label}</span>
                  <button
                    type="button"
                    className={`dh-card-save${saved ? ' is-saved' : ''}`}
                    aria-label={saved ? 'Saved' : 'Save this recipe'}
                    onClick={(e) => { e.stopPropagation(); if (!saved) onSave(card.recipe); }}
                  >
                    {saved ? '♥' : '♡'}
                  </button>
                </div>
                <div className="dh-card-body">
                  <h3 className="dh-card-name">{cleanTitle(card.recipe.name) || card.recipe.name}</h3>
                  <p className="dh-card-meta">
                    {[minutes ? `${minutes} min` : '', cuisine].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="dh-card-foot">
                  <span className="dh-card-flavor-hint">{meta.hint}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
