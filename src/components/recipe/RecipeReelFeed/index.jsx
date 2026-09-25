import { useState, useRef, useMemo, useEffect } from 'react';
import { Share2, X, Heart, Star } from 'lucide-react';
import { recipeFlavors, recordFlavorSignal, loadFlavorProfile, isSwipeLearningEnabled } from '../../../lib/flavorProfile';
import { scoreRecipe, seededRng, totalTimeOf } from '../../../lib/recipeRecommender';
import { getRecentlyShown, markShown } from '../../../lib/recentlyShown';
import RecipeAlchemist from '../RecipeAlchemist';
import './RecipeReelFeed.css';

/* ════════════════════════════════════════════════════════════
   DISCOVER FEED — a Tinder-style "For You" stack for recipes.

   Swipe left = no (skip), right = yes (open the full recipe), up = super
   like (favorite it without leaving the feed). Every swipe is a signal —
   watching to completion, rewatching, liking and sharing are strong
   positive votes on TikTok; skipping fast is the one strong negative —
   mapped here as:
     view      → card becomes current
     skip      → swiped left
     cook      → swiped right (then navigates to the full recipe)
     superlike → swiped up (favorited, strongest explicit positive)
     share     → tapped share
   Every signal nudges the shared 8-flavor profile (lib/flavorProfile), and
   the queue tops itself up live using the just-updated profile, with a
   diversity rule (don't repeat the same dominant flavor twice running) so
   it doesn't get stuck in one lane. If you swipe left 8 times in a row
   without liking anything, the Kitchen Alchemist drops into the very next
   card so you can just describe what you actually want instead of
   continuing to swipe blind.
   ════════════════════════════════════════════════════════════ */

const FLAVOR_EMOJI = {
  spicy: 'SPICY', sweet: 'SWEET', savory: 'SAVORY', rich: 'RICH',
  light: 'LIGHT', earthy: 'EARTHY', smoky: 'SMOKY', tangy: 'TANGY',
};
const FLAVOR_TINT = {
  spicy: '#c8452c', sweet: '#e0699a', savory: '#6E8259', rich: '#D8CAB4',
  light: '#4a7c59', earthy: '#6b5843', smoky: '#4a3f35', tangy: '#c9a227',
};
const DEFAULT_TINT = '#33302A';
const DISCARD_RESCUE_AT = 8; // consecutive left-swipes before the Alchemist shows up
const SWIPE_THRESHOLD_X = 110;
const SWIPE_THRESHOLD_UP = -100;
const PICK_TARGET = 3;      // "cook this" / super-likes before the feed stops for ranking (rest of the UI derives from this, not a hardcoded count)
const EXPLORE_EVERY = 8;    // 1 in this many picks ignores the learned craving bias

const keyOf = r => r.id || r.name;

// Score + shuffle a fresh batch, reusing the exact same scoreRecipe the grid
// uses (weather / time-pressure / behavior / popularity / craving), just fed
// the live, per-swipe-updated flavor profile instead of a frozen one — this
// is what makes the feed "re-rank" as you go instead of picking once.
function pickBatch(pool, ctx, hits, profile, seenIds, recentFlavors, rng, n) {
  const liveCtx = { ...ctx, cravingPrefs: profile };
  // Dropping cravingPrefs entirely for the explore pass keeps the feed from
  // calcifying around the same 2-3 flavors as the learned profile grows more
  // lopsided the more you swipe — without this, the highest scorers barely
  // change session to session and it "feels" like the same recipes forever.
  const exploreCtx = { ...ctx, cravingPrefs: {} };
  const available = pool.filter(r => !seenIds.has(keyOf(r)));
  const scored = available
    .map(r => ({ type: 'recipe', r, flavors: recipeFlavors(r), s: scoreRecipe(r, liveCtx, hits, 'dinner', rng) }))
    .sort((a, b) => b.s - a.s);

  const picks = [];
  const used = new Set();
  const recent = [...recentFlavors];

  const exploreSlots = Math.max(1, Math.floor(n / EXPLORE_EVERY));
  const exploreScored = available
    .map(r => ({ type: 'recipe', r, flavors: recipeFlavors(r), s: scoreRecipe(r, exploreCtx, hits, 'dinner', rng) }))
    .sort((a, b) => b.s - a.s);
  for (const cand of exploreScored) {
    if (picks.length >= exploreSlots) break;
    if (used.has(cand.r)) continue;
    picks.push(cand); used.add(cand.r);
    if (cand.flavors[0]) recent.push(cand.flavors[0]);
  }

  // Pass 1: skip anything whose dominant flavor repeats the last 2 shown.
  for (const cand of scored) {
    if (picks.length >= n) break;
    if (used.has(cand.r)) continue;
    const primary = cand.flavors[0];
    if (primary && recent.slice(-2).includes(primary)) continue;
    picks.push(cand); used.add(cand.r);
    if (primary) recent.push(primary);
  }
  // Pass 2: top up with whatever's left, highest-score first.
  for (const cand of scored) {
    if (picks.length >= n) break;
    if (used.has(cand.r)) continue;
    picks.push(cand); used.add(cand.r);
  }
  return picks;
}

export default function TikTokRecipeFeed({ recipes, ctx, hits, savedRecipes, onSave, onFiveRanked, onClose }) {
  // Seeded from the persisted cross-session log, not just this mount, so
  // closing and reopening Discover doesn't just show the same top-scored
  // set again (scoreRecipe is dominated by weather/time/behavior/craving —
  // the jitter alone isn't enough to shuffle a fresh mount's top picks).
  const seenIds = useRef(new Set(getRecentlyShown()));
  const recentFlavors = useRef([]);
  const discardStreak = useRef(0);
  const viewedIndexRef = useRef(-1);
  const pickedRef = useRef([]); // recipes the user has "cook this"/super-liked so far this session
  const dragRef = useRef({ active: false, startX: 0, startY: 0, pointerId: null });
  // Fresh seed every time the feed opens — same math as the grid's picks,
  // but this is the part that's meant to feel truly endless and different.
  const rngRef = useRef(seededRng(`discover-${Date.now()}-${Math.random()}`));

  const [profile, setProfile] = useState(() => loadFlavorProfile());
  const [queue, setQueue] = useState(() => {
    const picks = pickBatch(recipes, ctx, hits, profile, seenIds.current, recentFlavors.current, rngRef.current, 10);
    picks.forEach(p => { seenIds.current.add(keyOf(p.r)); if (p.flavors[0]) recentFlavors.current.push(p.flavors[0]); });
    return picks;
  });
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(null); // null | 'left' | 'right' | 'up'
  const [picked, setPicked] = useState([]); // mirrors pickedRef, for render (rank progress dots)

  const savedIds = useMemo(() => new Set((savedRecipes || []).map(keyOf)), [savedRecipes]);

  // Record a "view" the moment a card becomes current — guarded so it never
  // double-fires for the same index (StrictMode's dev-only double-effect).
  // Swiping still fully works with learning off (queue advances, saves and
  // opens recipes normally) — this just decides whether it also writes to
  // the persisted flavor profile. See flavorProfile.js's isSwipeLearningEnabled
  // (Profile page toggle) — a deliberate opt-out, on by default.
  function maybeRecord(recipe, signal, overrideFlavors) {
    return isSwipeLearningEnabled() ? recordFlavorSignal(recipe, signal, overrideFlavors) : profile;
  }

  useEffect(() => {
    const item = queue[index];
    if (!item || item.type !== 'recipe' || viewedIndexRef.current === index) return;
    viewedIndexRef.current = index;
    setProfile(maybeRecord(item.r, 'view'));
    markShown([keyOf(item.r)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, queue]);

  function growQueue(fromProfile) {
    if (queue.length - (index + 1) > 3) return;
    let more = pickBatch(recipes, ctx, hits, fromProfile, seenIds.current, recentFlavors.current, rngRef.current, 8);
    if (!more.length && seenIds.current.size) {
      seenIds.current.clear(); // recycle once the pool's exhausted — still infinite
      more = pickBatch(recipes, ctx, hits, fromProfile, seenIds.current, recentFlavors.current, rngRef.current, 8);
    }
    more.forEach(p => { seenIds.current.add(keyOf(p.r)); if (p.flavors[0]) recentFlavors.current.push(p.flavors[0]); });
    if (more.length) setQueue(q => [...q, ...more]);
  }

  function advanceAfterSwipe(item, direction) {
    if (item.type === 'alchemist') {
      setIndex(i => i + 1);
      setDragOffset({ x: 0, y: 0 });
      setExiting(null);
      return;
    }

    const r = item.r;
    let p;
    if (direction === 'right' || direction === 'up') {
      // Both "cook this" and super-like are picks now — instead of leaving
      // the feed immediately, they count toward the session's 5-pick cap;
      // ranking those 5 afterward decides which one actually opens.
      p = maybeRecord(r, direction === 'up' ? 'superlike' : 'cook');
      discardStreak.current = 0;
      if (direction === 'up') onSave?.(r);
    } else {
      p = maybeRecord(r, 'skip');
      discardStreak.current += 1;
    }
    setProfile(p);

    if (direction === 'right' || direction === 'up') {
      const nextPicked = [...pickedRef.current, r];
      pickedRef.current = nextPicked;
      setPicked(nextPicked);
      if (nextPicked.length >= PICK_TARGET) {
        onFiveRanked?.(nextPicked);
        return; // feed stays frozen here — the ranking step takes over
      }
    }

    const nextIndex = index + 1;
    if (discardStreak.current >= DISCARD_RESCUE_AT) {
      discardStreak.current = 0;
      setQueue(q => {
        const copy = [...q];
        copy.splice(nextIndex, 0, { type: 'alchemist', key: `alchemist-${Date.now()}` });
        return copy;
      });
    }
    setIndex(nextIndex);
    setDragOffset({ x: 0, y: 0 });
    setExiting(null);
    growQueue(p);
  }

  function commitSwipe(direction) {
    const item = queue[index];
    if (!item || exiting) return;
    setDragging(false);
    setExiting(direction);
    window.setTimeout(() => advanceAfterSwipe(item, direction), 260);
  }

  function springBack() {
    setDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }

  // ── Drag gesture (top card only) ──────────────────────────────────
  function onPointerDown(e) {
    if (exiting) return;
    if (e.target.closest('.ttf-no-drag')) return; // buttons / the Alchemist's own inputs
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function onPointerMove(e) {
    if (!dragRef.current.active) return;
    setDragOffset({ x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY });
  }
  function onPointerUp() {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const { x, y } = dragOffset;
    if (y < SWIPE_THRESHOLD_UP && Math.abs(y) > Math.abs(x)) commitSwipe('up');
    else if (x > SWIPE_THRESHOLD_X) commitSwipe('right');
    else if (x < -SWIPE_THRESHOLD_X) commitSwipe('left');
    else springBack();
  }

  function handleShare(item) {
    setProfile(maybeRecord(item.r, 'share'));
    const data = { title: item.r.name, text: `${item.r.name} — found on Dig In` };
    if (navigator.share) navigator.share(data).catch(() => {});
  }

  const visible = queue.slice(index, index + 3);

  return (
    <div className="ttf-overlay">
      <button className="ttf-close" onClick={onClose} aria-label="Close discover feed"><X size={20} /></button>
      <div className="ttf-pick-progress">PICKED {picked.length}/{PICK_TARGET}</div>

      <div className="ttf-stack">
        {visible.slice().reverse().map((item, revIdx) => {
          const pos = visible.length - 1 - revIdx; // 0 = top/current, 1/2 = peeking behind
          const isTop = pos === 0;
          const cardKey = item.type === 'alchemist' ? item.key : `${keyOf(item.r)}-${index + pos}`;

          let style;
          if (isTop && exiting) {
            const fling = {
              left:  'translate(-160%, 40px) rotate(-24deg)',
              right: 'translate(160%, 40px) rotate(24deg)',
              up:    'translate(0, -170%) rotate(0deg)',
            }[exiting];
            style = { transform: fling, opacity: 0, transition: 'transform .26s ease-in, opacity .26s ease-in', zIndex: 3 };
          } else if (isTop) {
            style = {
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x / 18}deg)`,
              transition: dragging ? 'none' : 'transform .35s cubic-bezier(.2,.8,.2,1)',
              zIndex: 3,
            };
          } else {
            style = { transform: `translateY(${pos * 12}px) scale(${1 - pos * 0.05})`, zIndex: 3 - pos };
          }

          if (item.type === 'alchemist') {
            return (
              <div key={cardKey} className="ttf-stack-card ttf-alchemist-card" style={style}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? springBack : undefined}
              >
                <div className="ttf-alchemist-inner ttf-no-drag">
                  <RecipeAlchemist />
                </div>
                <button className="ttf-alchemist-dismiss" onClick={() => commitSwipe('left')}>
                  ✕ BACK TO SWIPING
                </button>
              </div>
            );
          }

          const r = item.r;
          const flavors = item.flavors;
          const tint = FLAVOR_TINT[flavors[0]] || DEFAULT_TINT;
          const isSaved = savedIds.has(keyOf(r));
          const likeOpacity = isTop ? Math.max(0, Math.min(1, dragOffset.x / 100)) : 0;
          const nopeOpacity = isTop ? Math.max(0, Math.min(1, -dragOffset.x / 100)) : 0;
          const superOpacity = isTop ? Math.max(0, Math.min(1, -dragOffset.y / 80)) : 0;

          return (
            <div
              key={cardKey}
              className="ttf-stack-card"
              style={{ ...style, '--tint': tint }}
              onPointerDown={isTop ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? onPointerUp : undefined}
              onPointerCancel={isTop ? springBack : undefined}
            >
              {isTop && <span className="ttf-stamp ttf-stamp-like" style={{ opacity: likeOpacity }}>YES</span>}
              {isTop && <span className="ttf-stamp ttf-stamp-nope" style={{ opacity: nopeOpacity }}>NOPE</span>}
              {isTop && <span className="ttf-stamp ttf-stamp-super" style={{ opacity: superOpacity }}>SUPER LIKE</span>}

              <div className="ttf-hero">
                <span className="ttf-emoji">{r.pixelEmoji || FLAVOR_EMOJI[flavors[0]] || 'DISH'}</span>
              </div>

              <div className="ttf-info">
                <div className="ttf-flavors">
                  {flavors.length
                    ? flavors.map(f => (
                        <span key={f} className="ttf-flavor-chip">{FLAVOR_EMOJI[f]} {f.toUpperCase()}</span>
                      ))
                    : <span className="ttf-flavor-chip">RECIPE</span>}
                </div>
                <h2 className="ttf-title">{r.name}</h2>
                <p className="ttf-meta">
                  {r.country ? `${r.country} · ` : ''}
                  {totalTimeOf(r) ? `${totalTimeOf(r)} min · ` : ''}
                  {r.difficulty || ''}
                </p>
              </div>

              {isTop && (
                <div className="ttf-actions ttf-no-drag">
                  <button className="ttf-action ttf-action-nope" onClick={() => commitSwipe('left')} aria-label="No thanks">
                    <X size={22} />
                  </button>
                  <button className="ttf-action ttf-action-super" onClick={() => commitSwipe('up')} aria-label="Super like">
                    <Star size={20} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                  <button className="ttf-action ttf-action-yes" onClick={() => commitSwipe('right')} aria-label="Pick this">
                    <Heart size={22} />
                  </button>
                  <button className="ttf-share" onClick={() => handleShare(item)} aria-label="Share">
                    <Share2 size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="ttf-swipe-hint">
        <span>← NO</span><span>↑ SUPER LIKE</span><span>PICK →</span>
      </div>
    </div>
  );
}
