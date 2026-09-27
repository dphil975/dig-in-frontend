import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Plus } from 'lucide-react';
import Nav from '../../../components/shell/Nav';
import { REELS } from '../../../data/reels.data';
import { loadUserReels, getCoins } from '../../../lib/userReels';
import { loadLikedReels, saveLikedReels, loadDislikedReels, dislikeReel, DISLIKE_REASONS } from '../../../lib/reelFeedback';
import { loadFlavorProfile, recordFlavorSignal, recipeFlavors, FLAVORS } from '../../../lib/flavorProfile';
import Reel, { fmtCoins, COINS_PER_LIKE } from '../../../components/social/Reel/index';
import '../../../components/social/Reel/ReelFeed.css';

/* ════════════════════════════════════════════════════════════
   REEL FEED — Vine-style 7-second recipe reels.

   A full-screen vertical snap-scroller. Each reel plays the whole
   "product life" of a dish — raw ingredients → prep → sizzle →
   plate → final — as a 5-stage arc timed to exactly 7 seconds,
   then loops (see Reel.jsx for the clock). Completion bias: your eye
   gets the entire journey in one breath, so the dish feels *done*.

   User-published reels (create flow, persisted in localStorage) are
   merged in front of the built-in seed reels. Only the reel currently
   in view runs its clock (IntersectionObserver).

   "Try This" writes the recipe to sessionStorage (the exact handoff
   RecipeFull reads) and navigates to /recipe.

   Personalized ordering: the built-in reel set is re-sorted by how well
   each reel's flavor matches the SAME learned profile (flavorProfile.js's
   dig_in_craving_prefs) the flavor quiz seeds and every recipe view/save/
   cook already feeds — reusing that one signal instead of a parallel
   "reel taste" model. Liking a reel counts as a superlike (the strongest
   positive signal); disliking counts as a skip (the one negative signal)
   AND removes the reel from future loads, with the stated reason kept
   for the user, not just logged into a void (see reelFeedback.js). */

export default function ReelFeed({ embedded = false } = {}) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [liked, setLiked] = useState(loadLikedReels);
  const [dislikedMap, setDislikedMap] = useState(loadDislikedReels);
  const [dislikePrompt, setDislikePrompt] = useState(null); // the reel currently being dismissed

  // User reels first (creator incentive — unchanged), then the built-in seed
  // set re-ordered toward whatever flavors this user's quiz + ongoing
  // behavior actually favor. Disliked reels are filtered out of both.
  const userReels = useMemo(loadUserReels, []);
  const reels = useMemo(() => {
    const profile = loadFlavorProfile();
    const hasSignal = Object.values(profile).some(v => v > 0);
    const notDisliked = r => !dislikedMap[r.id];

    const seed = REELS.filter(notDisliked);
    const ordered = hasSignal
      ? seed
          .map(r => ({ r, score: (profile[(r.flavor || '').toLowerCase()] || 0) + Math.random() * 8 }))
          .sort((a, b) => b.score - a.score)
          .map(x => x.r)
      : seed;

    return [...userReels.filter(notDisliked), ...ordered];
  }, [userReels, dislikedMap]);

  const [activeId, setActiveId] = useState(reels[0]?.id ?? null);
  const [coins, setCoins] = useState(getCoins);
  const [coinToast, setCoinToast] = useState(null);

  // Track which reel is centered in the viewport → that one runs its clock.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      entries => {
        const top = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top) setActiveId(top.target.dataset.reelId);
      },
      { root, threshold: [0.5, 0.75] }
    );
    root.querySelectorAll('[data-reel-id]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [reels.length]);

  const persistCoins = useCallback(n => {
    setCoins(n);
    try { localStorage.setItem('dig_in_nova_coins', String(n)); } catch { /* private mode */ }
  }, []);

  // Prefer the reel's own hand-tagged flavor chip (exact — no keyword
  // guessing needed) and only fall back to text-detection off its recipe/
  // caption for reels that don't carry one (mainly user-created reels).
  const reelFlavors = (reel) => {
    const tag = (reel.flavor || '').toLowerCase();
    if (FLAVORS.includes(tag)) return [tag];
    return recipeFlavors(reel.recipe || { name: reel.dish, description: reel.novaCaption || '' });
  };

  const toggleLike = useCallback((reel) => {
    setLiked(prev => {
      const next = new Set(prev);
      if (next.has(reel.id)) {
        next.delete(reel.id);
      } else {
        next.add(reel.id);
        persistCoins(getCoins() + COINS_PER_LIKE);
        setCoinToast(`+${COINS_PER_LIKE} Nova Coins`);
        window.setTimeout(() => setCoinToast(null), 1600);
        recordFlavorSignal({ name: reel.dish }, 'superlike', reelFlavors(reel));
      }
      saveLikedReels(next);
      return next;
    });
  }, [persistCoins]);

  // Dislike is two steps: tapping the button opens a reason picker (below),
  // submitting it is what actually records the signal and removes the reel.
  const requestDislike = useCallback((reel) => setDislikePrompt(reel), []);
  const cancelDislike = useCallback(() => setDislikePrompt(null), []);

  const confirmDislike = useCallback((reel, reason) => {
    recordFlavorSignal({ name: reel.dish }, 'skip', reelFlavors(reel));
    const nextMap = dislikeReel(reel.id, reason);
    setDislikedMap(nextMap);
    setLiked(prev => {
      if (!prev.has(reel.id)) return prev;
      const next = new Set(prev);
      next.delete(reel.id);
      saveLikedReels(next);
      return next;
    });
    setDislikePrompt(null);
    // If the reel that just disappeared was the active one, hand the clock
    // to whatever's now first so the feed doesn't sit frozen until scrolled.
    setActiveId(prev => (prev === reel.id ? null : prev));
  }, []);

  const share = useCallback((reel) => {
    const data = { title: reel.dish, text: `${reel.dish} — a 7-second reel on Dig In` };
    if (navigator.share) navigator.share(data).catch(() => {});
    else {
      navigator.clipboard?.writeText(data.text).catch(() => {});
      setCoinToast('Link copied');
      window.setTimeout(() => setCoinToast(null), 1600);
    }
  }, []);

  const tryThis = useCallback((reel) => {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(reel.recipe || { name: reel.dish }));
      sessionStorage.removeItem('dig_in_full_recipe_adapt');
    } catch { /* ignore */ }
    navigate('/recipe');
  }, [navigate]);

  return (
    <div className="reel-page">
      {!embedded && <Nav />}

      <header className="reel-topbar">
        <div className="reel-topbar-brand">
          <span className="reel-topbar-dot" /> REELS
          <span className="reel-topbar-tag">7 SECONDS · THE WHOLE DISH</span>
        </div>
        <div className="reel-topbar-right">
          <div className="reel-topbar-coins" aria-label="Your Nova Coins">
            <Coins size={16} /> {fmtCoins(coins)}
          </div>
          <button className="reel-topbar-create" onClick={() => navigate('/reels/create')}>
            <Plus size={16} /> CREATE
          </button>
        </div>
      </header>

      <div className="reel-scroller" ref={scrollRef}>
        {reels.map(reel => (
          <div className="reel-slide" key={reel.id} data-reel-id={reel.id}>
            <Reel
              reel={reel}
              active={activeId === reel.id}
              liked={liked.has(reel.id)}
              onToggleLike={toggleLike}
              onDislike={requestDislike}
              onShare={share}
              onTry={tryThis}
            />
          </div>
        ))}
      </div>

      {dislikePrompt && (
        <DislikePrompt
          reel={dislikePrompt}
          onCancel={cancelDislike}
          onConfirm={(reason) => confirmDislike(dislikePrompt, reason)}
        />
      )}

      {coinToast && <div className="reel-coin-toast">{coinToast}</div>}
    </div>
  );
}

/* Reason picker shown after tapping dislike — a real reason, not just a
   silent unheart, so Nova actually learns why (and the user can see what
   they told her, per the "put the reason why" ask). */
function DislikePrompt({ reel, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');

  function pick(r) { setReason(r); setCustom(''); }
  function submit() {
    onConfirm((custom.trim() || reason || '').trim());
  }

  return (
    <div className="reel-dislike-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="reel-dislike-sheet">
        <p className="reel-dislike-title">Not feeling {reel.dish}?</p>
        <p className="reel-dislike-sub">Tell Nova why — she won't show you this one again.</p>
        <div className="reel-dislike-reasons">
          {DISLIKE_REASONS.map(r => (
            <button
              key={r}
              type="button"
              className={`reel-dislike-chip${reason === r ? ' active' : ''}`}
              onClick={() => pick(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <input
          className="reel-dislike-input"
          placeholder="Or type your own reason…"
          value={custom}
          onChange={e => { setCustom(e.target.value); setReason(''); }}
        />
        <div className="reel-dislike-actions">
          <button className="reel-dislike-cancel" onClick={onCancel}>Cancel</button>
          <button className="reel-dislike-submit" onClick={submit} disabled={!reason && !custom.trim()}>
            Don't show me this
          </button>
        </div>
      </div>
    </div>
  );
}
