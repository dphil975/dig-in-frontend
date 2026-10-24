import { useState, useRef, useEffect } from 'react';
import { Heart, ThumbsDown, Share2, Coins, ChefHat } from 'lucide-react';
import { STAGES, REEL_DURATION_MS } from '../../../../data/reels.data';
import { pickNovaQuip } from './novaQuips';
import './ReelFeed.css';

/* One reel — owns its own 7-second stage clock, shared by the feed and the
   create-flow preview. It ticks only while `active`, restarting from 0 each
   time so a dish always opens on raw ingredients.

   A reel may carry `stagePhotos` (a length-5 array of image data URLs, one per
   beat) from a user upload — when a beat has a photo it renders full-bleed with
   a small stage label; otherwise it falls back to the classic tinted stage card.

   In `preview` mode (create flow) the action rail and Try button are hidden and
   the caller forces `active`, so it just loops as a live preview. */

export const COINS_PER_LIKE = 10;
const TICK_MS = 60;

export function fmtCoins(n) {
  return Number(n || 0).toLocaleString('en-US');
}

export default function Reel({ reel, active, preview, liked, onToggleLike, onDislike, onShare, onTry }) {
  const [elapsed, setElapsed] = useState(0);   // 0..REEL_DURATION_MS within the current loop
  const [quipFlash, setQuipFlash] = useState(false);
  // The line shown on the BOOM beat. Re-rolled from the reel's category bank
  // each loop so re-watchers hear something new — Nova's whole hook — falling
  // back to the reel's hand-picked line if the category is empty.
  const [quip, setQuip] = useState(reel.novaQuip);
  const startRef = useRef(0);
  const rafGuardRef = useRef(false);

  useEffect(() => {
    if (!active) { setElapsed(0); setQuipFlash(false); return; }
    startRef.current = performance.now();
    const id = window.setInterval(() => {
      const t = (performance.now() - startRef.current) % REEL_DURATION_MS;
      setElapsed(t);
      // Flash the Nova quip in the final ~900ms of the loop; pick a fresh line
      // on the rising edge of each flash.
      const inFinal = t > REEL_DURATION_MS - 900;
      if (inFinal && !rafGuardRef.current) {
        rafGuardRef.current = true;
        setQuip(pickNovaQuip(reel.quipCategory, reel.novaQuip));
        setQuipFlash(true);
      }
      if (!inFinal && rafGuardRef.current) { rafGuardRef.current = false; setQuipFlash(false); }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [active, reel.quipCategory, reel.novaQuip]);

  const progress = active ? elapsed / REEL_DURATION_MS : 0;
  // Which of the 5 stages are we in? STAGES carry cumulative end fractions.
  const stageIdx = active
    ? Math.min(STAGES.length - 1, STAGES.findIndex(s => progress <= s.until))
    : 0;
  const stage = STAGES[stageIdx];
  const photo = reel.stagePhotos?.[stageIdx] || null;

  return (
    <section className="reel" style={{ '--tint': reel.tint, '--tint-2': reel.tint2 }}>
      {/* The "video" canvas — a user photo if this beat has one, else the tinted card. */}
      <div className={`reel-canvas reel-stage-${stageIdx}${photo ? ' has-photo' : ''}`} aria-hidden="true">
        {photo
          ? <img className="reel-canvas-photo" src={photo} alt="" />
          : <div className="reel-canvas-glow" />}
        {photo
          ? <span className="reel-stage-label">{stage.word}</span>
          : <>
              <div className="reel-stage-word">{stage.word}</div>
              <div className="reel-stage-sub">{stage.sub}</div>
            </>}
      </div>

      {/* Per-stage segmented progress bar (the "7 seconds" made visible). */}
      <div className="reel-progress" aria-hidden="true">
        {STAGES.map((s, i) => {
          const start = i === 0 ? 0 : STAGES[i - 1].until;
          const span = s.until - start;
          const local = Math.max(0, Math.min(1, (progress - start) / span));
          return (
            <div className="reel-progress-seg" key={s.word}>
              <div className="reel-progress-fill" style={{ transform: `scaleX(${i < stageIdx ? 1 : i === stageIdx ? local : 0})` }} />
            </div>
          );
        })}
      </div>

      {/* Nova quip — flashes at the 6→7s "boom" beat. */}
      <div className={`reel-quip${quipFlash ? ' is-on' : ''}`}>
        <span className="reel-quip-nova">NOVA</span>
        {quip}
      </div>

      {/* Left overlay — creator + caption + meta. */}
      <div className="reel-overlay">
        {reel.foundingNumber ? <span className="reel-founding">FOUNDING CREATOR #{reel.foundingNumber}</span> : null}
        <p className="reel-handle">{reel.username}</p>
        <h2 className="reel-title">{reel.dish}</h2>
        {reel.novaCaption ? <p className="reel-caption">{reel.novaCaption}</p> : null}
        <div className="reel-meta">
          {reel.flavor && <span className="reel-chip reel-chip-flavor">{reel.flavor}</span>}
          {reel.time && <span className="reel-chip">{reel.time} MIN</span>}
          {reel.cost && <span className="reel-chip">${reel.cost}</span>}
          {reel.difficulty && <span className="reel-chip">{reel.difficulty}</span>}
        </div>
        {reel.hashtags?.length > 0 && (
          <div className="reel-hashtags">
            {reel.hashtags.map(h => <span key={h}>#{h}</span>)}
          </div>
        )}
        {!preview && (
          <button className="reel-try" onClick={() => onTry?.(reel)}>
            <ChefHat size={16} /> TRY THIS
          </button>
        )}
      </div>

      {/* Right rail — like / coins / share. Hidden in preview. */}
      {!preview && (
        <div className="reel-rail">
          <button
            className={`reel-rail-btn${liked ? ' is-liked' : ''}`}
            onClick={() => onToggleLike?.(reel)}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart size={26} fill={liked ? 'currentColor' : 'none'} />
            <span>{fmtCoins((reel.likes || 0) + (liked ? 1 : 0))}</span>
          </button>
          <div className="reel-rail-btn reel-rail-coins" aria-hidden="true">
            <Coins size={24} />
            <span>+{COINS_PER_LIKE}</span>
          </div>
          <button className="reel-rail-btn reel-rail-dislike" onClick={() => onDislike?.(reel)} aria-label="Not interested">
            <ThumbsDown size={24} />
            <span>NOT FOR ME</span>
          </button>
          <button className="reel-rail-btn" onClick={() => onShare?.(reel)} aria-label="Share">
            <Share2 size={24} />
            <span>SHARE</span>
          </button>
        </div>
      )}
    </section>
  );
}
