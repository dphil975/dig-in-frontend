import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DishFlipCard from '../../components/DishFlipCard';
import HeroHighlights from '../../components/HeroHighlights';
import CloserLook from '../../components/CloserLook';
import InteractiveHeroRecipe from '../../components/InteractiveHeroRecipe';
import ShoutoutCard from '../../components/ShoutoutCard';
import Reel from '../ReelFeed/Reel';
import '../ReelFeed/ReelFeed.css';   // Reel.jsx doesn't self-import its styles — every host page does
import { loadLikedReels, saveLikedReels, dislikeReel } from '../ReelFeed/reelFeedback';
import { recordFlavorSignal, recipeFlavors } from '../../lib/flavorProfile';
import { splitTags } from '../../lib/structuredTags';
import { slotLabelFor } from '../../lib/feedSlots';
import { viralLine } from '../../lib/virality';
import { MOOD_FLAVORS, saveMealMood } from '../../lib/mealMood';
import { track } from '../../lib/analytics';

// Drop a full recipe into the handoff slot the recipe view reads on open.
function stashRecipe(recipe) {
  try {
    sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
    sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
  } catch { /* ignore */ }
}

/* PostTypes — the six post shapes (plus the editorial ones the old page
   stacked below the fold) that replace the uniform recipe grid. Every post
   is the same width; the VARIETY of shape is what makes an endless column
   readable instead of numbing. Each ends in clickable tags — tags are the
   navigation, not a filter drawer. See buildFeed.js for how they're ordered
   and DIG_IN_HERO_REDESIGN.md for the why. */

const MEAL_KICKER = {
  breakfast: 'good morning',
  lunch: 'midday',
  dinner: 'tonight',
  'late-night': 'late night',
};

// A deterministic pixel identicon from a name — honest stand-in for an
// avatar (the app has no uploaded profile photos), never a fake face.
const AVATAR_TINTS = ['#6E8259', '#E0A32E', '#C8001E', '#96B36B', '#5d61a8', '#D8CAB4'];
function Avatar({ name = '?' }) {
  const initial = (name.trim()[0] || '?').toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const tint = AVATAR_TINTS[Math.abs(h) % AVATAR_TINTS.length];
  return <span className="post-avatar" style={{ background: tint }}>{initial}</span>;
}

/* Two layers, two weights (Part 4 of DIG_IN_ALGORITHM.md). STRUCTURED tags are
   computed and reliable — bordered chips you can trust as filters. VOICE tags
   are the whimsy vocabulary (capped at 3) — plain text, no border, personality
   not filter. Both still explore on tap / follow on right-click. */
export function TagRow({ tags, followed, onTag, onFollow }) {
  if (!tags?.length) return null;
  const { structured, voice } = splitTags(tags);
  const chip = (t, isVoice) => {
    const isFollowed = followed?.has(t);
    return (
      <button
        key={t}
        type="button"
        className={`post-tag${isVoice ? ' voice' : ''}${isFollowed ? ' followed' : ''}`}
        onClick={() => onTag?.(t)}
        onContextMenu={(e) => { e.preventDefault(); onFollow?.(t); }}
        title={isVoice
          ? 'A voice tag — tap to explore'
          : (isFollowed ? 'Following this tag' : 'Tap to explore · right-click to follow')}
      >
        {t}
      </button>
    );
  };
  return (
    <div className="post-tags">
      {structured.map((t) => chip(t, false))}
      {voice.map((t) => chip(t, true))}
    </div>
  );
}

/* "Why you're seeing this" — the honest slot a post was dealt from. This is the
   opposite of a black-box feed: every slot-driven post says which of the ten
   slots it came from, so the composition is legible instead of mysterious. */
function SlotTag({ post }) {
  const label = slotLabelFor(post);
  // The archetype lens says WHY a post is here relative to how you cook — most
  // usefully when it's the deliberate counterweight to your own habit. Saying
  // that out loud is the whole point: variety the reader can see is a feature,
  // variety smuggled in is manipulation. See lib/archetypeEngine.js.
  const band = post?._band;
  const why = post?._why;
  if (!label && !why) return null;
  return (
    <span className="post-slot-row">
      {label && (
        <span className="post-slot" title="Why you're seeing this — the slot this came from">{label}</span>
      )}
      {why && (
        <span className={`post-band post-band-${band}`} title={why}>
          {band === 'counter' ? 'a change of pace' : band === 'neutral' ? 'something calmer' : 'your kind of thing'}
        </span>
      )}
    </span>
  );
}

/* Wrapper: every post shares one shell so the column reads as one column. */
function Shell({ kind, children, tags, tagProps, post }) {
  return (
    <article className={`post post-${kind}`}>
      <SlotTag post={post} />
      {children}
      <TagRow tags={tags} {...tagProps} />
    </article>
  );
}

/* ── Dish post — the patent flip card, as a social object ─────────────── */
function DishPost({ post, currentUserId, onRated, tagProps }) {
  const { entry } = post;
  return (
    <Shell kind="dish" post={post} tags={post.tags} tagProps={tagProps}>
      <header className="post-head">
        <Avatar name={entry.displayName || entry.username} />
        <div className="post-head-txt">
          <span className="post-user">{entry.displayName || entry.username || 'someone'}</span>
          <span className="post-verb">cooked this</span>
        </div>
      </header>
      <DishFlipCard entry={entry} currentUserId={currentUserId} onRated={onRated} />
    </Shell>
  );
}

/* ── Viral post — a dish spreading across the community (lib/virality.js) ──
   Same real flip card as a dish post, topped with an HONEST spread banner: the
   count shown is the backend's real ratingCount (people who actually weighed
   in), never a fabricated view number. Because it rides the shared judged
   feed, a dish that's taking off appears in everyone's feed for real. */
function ViralPost({ post, currentUserId, onRated, tagProps }) {
  const { entry, viral } = post;
  return (
    <Shell kind="viral" post={post} tags={post.tags} tagProps={tagProps}>
      <div className={`post-viral-banner${viral.tier === 'viral' ? ' is-viral' : ''}`}>
        <span className="post-viral-flame">{viral.tier === 'viral' ? '🔥' : '📈'}</span>
        <span className="post-viral-line">{viralLine(viral)}</span>
      </div>
      <header className="post-head">
        <Avatar name={entry.displayName || entry.username} />
        <div className="post-head-txt">
          <span className="post-user">{entry.displayName || entry.username || 'someone'}</span>
          <span className="post-verb">cooked this</span>
        </div>
      </header>
      <DishFlipCard entry={entry} currentUserId={currentUserId} onRated={onRated} />
    </Shell>
  );
}

/* ── Chain post — a dish made from someone else's dish (the reblog) ────── */
function ChainPost({ post, currentUserId, onRated, tagProps }) {
  const { entry } = post;
  const snap = entry.recipeSnapshot || {};
  return (
    <Shell kind="chain" post={post} tags={post.tags} tagProps={tagProps}>
      <header className="post-head">
        <Avatar name={entry.displayName || entry.username} />
        <div className="post-head-txt">
          <span className="post-user">{entry.displayName || entry.username || 'someone'}</span>
          <span className="post-verb">made {snap.name || entry.dish}</span>
        </div>
        <span className="post-chain-mark">↻ chain</span>
      </header>
      <DishFlipCard entry={entry} currentUserId={currentUserId} onRated={onRated} />
      <div className="post-chain-origin">
        <span className="post-chain-arrow">↳ from the original</span>
        <span className="post-chain-origin-name">{snap.name || entry.dish}</span>
      </div>
    </Shell>
  );
}

/* ── Ask post — Tumblr's text post. A solid honey block, no image ─────── */
function AskPost({ post, navigate, tagProps }) {
  return (
    <Shell kind="ask" post={post} tags={post.tags} tagProps={tagProps}>
      <span className="post-ask-kicker">open question</span>
      <p className="post-ask-q">{post.q}</p>
      <button type="button" className="post-ask-btn" onClick={() => navigate(post.to)}>
        answer this →
      </button>
    </Shell>
  );
}

/* ── Write-up — the long-form text / "Substack" post, in the larger square ──
   A whole little write-up: a title, written body, and the optional numbered
   METHOD (the same step shape the recipe cards use, brought into the feed). The
   body truncates with a "keep reading"; the method collapses after a few steps
   so a long recipe doesn't run the column off the screen. This is the shape a
   user's own text post takes — see PostComposer + lib/userPosts. */
const BODY_PREVIEW = 360;   // chars shown before "keep reading"
const STEPS_PEEK = 3;       // steps shown before "show all N steps"

function WriteupPost({ post, tagProps }) {
  const navigate = useNavigate();
  const [openBody, setOpenBody] = useState(false);
  const [openSteps, setOpenSteps] = useState(false);
  const body = post.body || '';
  const long = body.length > BODY_PREVIEW;
  const shownBody = openBody || !long ? body : body.slice(0, BODY_PREVIEW).replace(/\s+\S*$/, '') + '…';
  const steps = post.steps || [];
  const shownSteps = openSteps ? steps : steps.slice(0, STEPS_PEEK);
  const when = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : null;

  return (
    <Shell kind="writeup" post={post} tags={post.tags} tagProps={tagProps}>
      <header className="post-head">
        <Avatar name={post.author} />
        <div className="post-head-txt">
          <span className="post-user">{post.author || 'you'}</span>
          <span className="post-verb">{post.origin ? 'reblogged' : 'wrote'}{when ? ` · ${when}` : ''}</span>
        </div>
        <span className="post-writeup-mark">{post.origin ? '↻ reblog' : '✎ post'}</span>
      </header>

      {post.origin && (
        <div className="post-writeup-origin">↻ from <b>{post.origin}</b></div>
      )}

      {post.title && <h2 className="post-writeup-title">{post.title}</h2>}

      {body && (
        <div className="post-writeup-body">
          {shownBody.split(/\n{2,}/).map((para, n) => <p key={n}>{para}</p>)}
          {long && (
            <button type="button" className="post-writeup-more" onClick={() => setOpenBody((o) => !o)}>
              {openBody ? 'show less' : 'keep reading →'}
            </button>
          )}
        </div>
      )}

      {steps.length > 0 && (
        <div className="post-writeup-method">
          <span className="post-writeup-method-head">Method · {steps.length} step{steps.length === 1 ? '' : 's'}</span>
          <ol className="post-writeup-steps">
            {shownSteps.map((s, n) => (
              <li key={n}><span className="post-writeup-step-n">{n + 1}</span><span className="post-writeup-step-t">{s}</span></li>
            ))}
          </ol>
          {steps.length > STEPS_PEEK && (
            <button type="button" className="post-writeup-more" onClick={() => setOpenSteps((o) => !o)}>
              {openSteps ? 'collapse method' : `show all ${steps.length} steps →`}
            </button>
          )}
        </div>
      )}

      {post.recipe && (
        <button
          type="button"
          className="post-writeup-cook"
          onClick={() => { stashRecipe(post.recipe); navigate('/recipe'); }}
        >
          🍳 Cook this →
        </button>
      )}
    </Shell>
  );
}

/* ── "I just moved" — the timeline card ────────────────────────────────────
   Phase-aware (days since the move): the gear to grab now, real freezer/storage
   recipes for this stage, and a route to find your new grocery store. Gear is
   honest product CATEGORIES, not brands; a real moving/kitchen-gear sponsor
   appears in the ShoutoutCard slot when one is signed (it ships empty). */
function MovingPost({ post, navigate, tagProps }) {
  const { phase, days, picks, proteins } = post;
  const cook = (r) => { stashRecipe(r); navigate(post.to); };
  return (
    <Shell kind="moving" post={post} tags={post.tags} tagProps={tagProps}>
      <span className="post-moving-kicker">📦 Just moved · day {days} — {phase.label}</span>
      <h2 className="post-moving-headline">{phase.headline}</h2>
      <p className="post-moving-sub">{phase.sub}</p>

      {/* Low-overwhelm framing — the whole point: start easy, adjust later. */}
      {phase.keepSimple && <p className="post-moving-simple">💛 {phase.keepSimple}</p>}

      {/* Gear to grab now — honest categories, not brands. */}
      <div className="post-moving-gear">
        <span className="post-moving-sect">What to grab now</span>
        {phase.gear.map((g) => (
          <div key={g.cat} className="post-moving-gear-item">
            <span className="post-moving-gear-cat">{g.cat}</span>
            <span className="post-moving-gear-tip">{g.tip}</span>
          </div>
        ))}
        {/* Real sponsor slots in here when one exists; empty today. */}
        <ShoutoutCard placement="moved" />
      </div>

      {/* Real recipes — fewest ingredients + cheapest first (see movingGuide). */}
      {picks.length > 0 && (
        <div className="post-moving-recipes">
          <span className="post-moving-sect">Easy &amp; cheap to make right now</span>
          {picks.map(({ recipe }) => (
            <button key={recipe.id || recipe.name} type="button" className="post-moving-recipe" onClick={() => cook(recipe)}>
              <span className="post-moving-recipe-name">{recipe.name}</span>
              <span className="post-moving-recipe-meta">
                {recipe._ingredientCount > 0 && <span>{recipe._ingredientCount} ingredient{recipe._ingredientCount === 1 ? '' : 's'}</span>}
                {recipe._meatFree && <span className="post-moving-tag-meatfree">no meat</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Non-meat protein that stretches — the affordable reality (real, honest). */}
      {proteins?.length > 0 && (
        <div className="post-moving-protein">
          <span className="post-moving-sect">Cheap protein, no meat needed</span>
          {proteins.map((p) => (
            <div key={p.key} className="post-moving-protein-item">
              <span className="post-moving-protein-emoji" aria-hidden="true">{p.emoji}</span>
              <div className="post-moving-protein-txt">
                <span className="post-moving-protein-name">{p.name}</span>
                <span className="post-moving-protein-why">{p.why}</span>
                <span className="post-moving-protein-use">→ {p.use}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="post-moving-storage">🧊 {phase.storageAngle}</p>

      <button type="button" className="post-moving-store" onClick={() => navigate(post.storeTo)}>
        🗺️ Find your new grocery store →
      </button>
    </Shell>
  );
}

/* ── Nova pick — a person picking for you, not an algorithm serving you ── */
function NovaPick({ post, navigate, tagProps }) {
  const cook = () => {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(post.recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  };
  return (
    <Shell kind="nova" post={post} tags={post.tags} tagProps={tagProps}>
      <div className="post-nova-row">
        <span className="post-nova-thumb" aria-hidden="true">🌿</span>
        <div className="post-nova-txt">
          <span className="post-nova-kicker">Nova picked this for you</span>
          <button type="button" className="post-nova-name" onClick={cook}>{post.recipe.name}</button>
          <p className="post-nova-reason">{post.reason}</p>
        </div>
      </div>
    </Shell>
  );
}

/* ── Cooking-Now — real presence: your own cook, or an honest invite ───── */
function CookingNow({ post, navigate, tagProps }) {
  const open = () => {
    if (post.recipe) {
      try {
        sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(post.recipe));
        sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
      } catch { /* ignore */ }
    }
    navigate(post.to);
  };
  return (
    <Shell kind="cookingNow" post={post} tags={post.tags} tagProps={tagProps}>
      <span className="post-live"><span className="post-live-dot" /> COOKING NOW</span>
      {post.self ? (
        <>
          <p className="post-cook-line">
            You started <b>{post.dish}</b>{post.minutes ? <> {post.minutes} min ago</> : null}. Pick up where you left off.
          </p>
          <button type="button" className="post-cook-btn" onClick={open}>Back to the kitchen →</button>
        </>
      ) : (
        <>
          <p className="post-cook-line">
            No one's on <b>{post.dish}</b> right now. Be the first tonight — start it and your circle can join.
          </p>
          <button type="button" className="post-cook-btn" onClick={open}>Start this →</button>
        </>
      )}
    </Shell>
  );
}

/* ── Place post — "get out of your area" enters the feed ───────────────── */
function PlacePost({ post, navigate, tagProps }) {
  const open = () => {
    if (post.here && post.recipe) {
      try {
        sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(post.recipe));
        sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
      } catch { /* ignore */ }
    }
    navigate(post.to);
  };
  return (
    <Shell kind="place" post={post} tags={post.tags} tagProps={tagProps}>
      <div className="post-place-row">
        <span className="post-place-tile" aria-hidden="true">
          {/* decorative pixel map motif — no external tiles */}
          <span /><span /><span /><span /><span /><span /><span /><span /><span />
          <span className="post-place-pin">📍</span>
        </span>
        <div className="post-place-txt">
          <span className="post-place-kicker">{post.here ? 'Popular near you' : 'Somewhere else'}</span>
          <span className="post-place-city">{post.city}</span>
          <p className="post-place-blurb">{post.blurb}</p>
          {post.here && post.recipe && <span className="post-place-dish">{post.recipe.name}</span>}
          <button type="button" className="post-place-btn" onClick={open}>
            {post.here ? 'Cook this →' : `Explore ${post.city} →`}
          </button>
        </div>
      </div>
    </Shell>
  );
}

/* ── In-season pick — the weather/calendar lens, as its own card ───────── */
function SeasonPost({ post, navigate, tagProps }) {
  const cook = () => { stashRecipe(post.recipe); navigate(post.to); };
  return (
    <Shell kind="season" post={post} tags={post.tags} tagProps={tagProps}>
      <div className="post-season-row">
        <span className="post-season-badge" aria-hidden="true">{post.weather ? '🌡️' : '🌿'}</span>
        <div className="post-season-txt">
          <span className="post-season-kicker">In season{post.weather ? ` · ${post.weather}` : ''}</span>
          <button type="button" className="post-season-name" onClick={cook}>{post.recipe.name}</button>
          <p className="post-season-note">{post.note}</p>
        </div>
      </div>
    </Shell>
  );
}

/* ── Pantry pick — "you can make this right now," with honest coverage ──── */
function PantryPost({ post, navigate, tagProps }) {
  const pct = Math.round((post.coverage || 0) * 100);
  const cook = () => { stashRecipe(post.recipe); navigate(post.to); };
  return (
    <Shell kind="pantry" post={post} tags={post.tags} tagProps={tagProps}>
      <span className="post-pantry-kicker">You can make this right now</span>
      <button type="button" className="post-pantry-name" onClick={cook}>{post.recipe.name}</button>
      <div
        className="post-pantry-bar"
        role="img"
        aria-label={`${post.haveCount} of ${post.totalCount} ingredients already on hand`}
      >
        <span className="post-pantry-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="post-pantry-note">You already have <b>{post.haveCount} of {post.totalCount}</b> — about {pct}% of it.</p>
    </Shell>
  );
}

/* ── In person, near you — slot 10. A real holiday shopping window nudge ── */
function InPersonPost({ post, navigate, tagProps }) {
  return (
    <Shell kind="inPerson" post={post} tags={post.tags} tagProps={tagProps}>
      <div className="post-place-row">
        <span className="post-place-tile" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span /><span /><span />
          <span className="post-place-pin">📍</span>
        </span>
        <div className="post-place-txt">
          <span className="post-place-kicker">{post.title} · {post.phase}</span>
          <p className="post-place-blurb">{post.blurb}</p>
          <button type="button" className="post-place-btn" onClick={() => navigate(post.to)}>
            Find grocers near you →
          </button>
        </div>
      </div>
    </Shell>
  );
}

/* ── Recipe card — a lightweight result in the tag-search view ─────────── */
function RecipeCardPost({ post, navigate, tagProps }) {
  const r = post.recipe;
  const open = () => { stashRecipe(r); navigate(post.to || '/recipe'); };
  return (
    <Shell kind="recipecard" post={post} tags={post.tags} tagProps={tagProps}>
      <div className="post-rc">
        <div className="post-rc-txt">
          <button type="button" className="post-rc-name" onClick={open}>{r.name}</button>
          {(r.country || r.cuisine) && <span className="post-rc-meta">{r.country || r.cuisine}</span>}
        </div>
        <button type="button" className="post-rc-btn" onClick={open}>Cook this →</button>
      </div>
    </Shell>
  );
}

/* ── Meal-time — the contextual first post, now a "show me dinner" launcher.
   Tap it open → pick which of the 8 flavors you're in the mood for (+ an "I'm
   a picky eater" flag) → it drops you into the Tinder-scroll swipe feed, aimed
   at that mood. This is the first thing the app asks when you open it, and the
   swipe is what it recommends back. See lib/mealMood + the Feed page. */
function MealTime({ post, navigate }) {
  const w = post.window;
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState([]);
  const [picky, setPicky] = useState(false);
  const meal = (w.label || 'dinner').toLowerCase();

  function toggle(k) {
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }
  function go() {
    saveMealMood({ flavors: picked, picky, meal });
    track('meal_mood_launch', { meal, flavors: picked.length, picky });
    navigate('/feed');
  }

  return (
    <article className="post post-mealtime">
      <span className="post-mealtime-kicker">{MEAL_KICKER[w.id] || 'right now'} · {w.label}</span>
      <p className="post-mealtime-line">What are you making for {meal}?</p>

      {!open ? (
        <button type="button" className="post-mealtime-btn" onClick={() => setOpen(true)}>
          Show me {meal} →
        </button>
      ) : (
        <div className="post-mood">
          <span className="post-mood-q">What 8 flavors are you in the mood for?</span>
          <div className="post-mood-flavors">
            {MOOD_FLAVORS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`post-mood-flavor${picked.includes(f.key) ? ' on' : ''}`}
                onClick={() => toggle(f.key)}
              >
                <span aria-hidden="true">{f.emoji}</span> {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`post-mood-picky${picky ? ' on' : ''}`}
            aria-pressed={picky}
            onClick={() => setPicky((v) => !v)}
          >
            🙈 I'm a picky eater{picky ? ' ✓' : ''}
          </button>
          {picky && (
            <p className="post-mood-picky-note">
              You'll get <b>fusion picks</b> — a familiar base with one new flavor bolted on, so it stays easy to say yes to.
            </p>
          )}
          <button type="button" className="post-mood-go" onClick={go}>
            {picked.length ? `Swipe ${meal} · ${picked.length} flavor${picked.length !== 1 ? 's' : ''} →` : `Surprise me — swipe ${meal} →`}
          </button>
        </div>
      )}
    </article>
  );
}

/* ── Whimsy — a post, once a week, on Sunday ───────────────────────────── */
function Whimsy({ navigate }) {
  return (
    <article className="post post-whimsy">
      <span className="post-whimsy-kicker">✦ sunday</span>
      <p className="post-whimsy-line">Want a whole week built around how you want it to feel?</p>
      <button type="button" className="post-whimsy-btn" onClick={() => navigate('/whimsy')}>
        Build my Whimsy Week →
      </button>
    </article>
  );
}

/* ── Editorial posts — the systems that used to stack below the fold, now
   single cards in the column. Reused wholesale, just re-shelled. ──────── */
function EditorialShell({ label, children }) {
  return (
    <article className="post post-editorial">
      <span className="post-editorial-label">{label}</span>
      <div className="post-editorial-body">{children}</div>
    </article>
  );
}

/* ── 7-second preview — the recipe's own trailer, right in the feed ───────
   Reuses the exact Reel component the dedicated Reels tab runs (same 7s
   clock, same 5-stage arc) so a like/dislike here IS a like/dislike there —
   one shared, persisted signal (lib/ReelFeed/reelFeedback.js), not a parallel
   copy. Framed as a preview of the dish, never as a "reel" in its own copy;
   the allocator holds it to the same 1-in-20 pace a real ad would get. */
function ReelPreviewPost({ post, navigate, tagProps }) {
  const { reel } = post;
  const [liked, setLiked] = useState(() => loadLikedReels().has(reel.id));
  const [dismissed, setDismissed] = useState(false);

  function flavorsOf() {
    const tag = (reel.flavor || '').toLowerCase();
    return tag ? [tag] : recipeFlavors(reel.recipe || { name: reel.dish });
  }

  function toggleLike() {
    const set = loadLikedReels();
    const wasLiked = set.has(reel.id);
    if (wasLiked) set.delete(reel.id); else set.add(reel.id);
    saveLikedReels(set);
    setLiked(!wasLiked);
    if (!wasLiked) {
      recordFlavorSignal({ name: reel.dish }, 'superlike', flavorsOf());
      track('reel_liked_from_feed', { dish: reel.dish });
    }
  }

  function dismiss() {
    dislikeReel(reel.id, 'Not interested (from feed)');
    recordFlavorSignal({ name: reel.dish }, 'skip', flavorsOf());
    track('reel_dismissed_from_feed', { dish: reel.dish });
    setDismissed(true);
  }

  function tryThis() {
    stashRecipe(reel.recipe || { name: reel.dish });
    navigate('/recipe');
  }

  function share() {
    const data = { title: reel.dish, text: `${reel.dish} — a quick look on Dig In` };
    if (navigator.share) navigator.share(data).catch(() => {});
    else navigator.clipboard?.writeText(data.text).catch(() => {});
  }

  if (dismissed) return null;

  return (
    <Shell kind="reelPreview" post={post} tags={post.tags} tagProps={tagProps}>
      <div className="post-reel-head">
        <span className="post-reel-kicker">🎬 QUICK LOOK · 7 SEC</span>
        <span className="post-reel-line">See it before you make it.</span>
      </div>
      <div className="post-reel-frame">
        <Reel reel={reel} active liked={liked} onToggleLike={toggleLike} onDislike={dismiss} onShare={share} onTry={tryThis} />
      </div>
    </Shell>
  );
}

/* ── The feed's real bottom — the differentiator ──────────────────────── */
function EndCard() {
  return (
    <div className="post-end">
      <span className="post-end-mark">✦</span>
      <p>that's today.</p>
      <p className="post-end-sub">come back tomorrow.</p>
    </div>
  );
}

/* Dispatcher — one entry point the column maps over. */
export default function Post({ post, currentUserId, onRated, tagProps }) {
  const navigate = useNavigate();
  switch (post.type) {
    case 'dish':        return <DishPost post={post} currentUserId={currentUserId} onRated={onRated} tagProps={tagProps} />;
    case 'viral':       return <ViralPost post={post} currentUserId={currentUserId} onRated={onRated} tagProps={tagProps} />;
    case 'chain':       return <ChainPost post={post} currentUserId={currentUserId} onRated={onRated} tagProps={tagProps} />;
    case 'ask':         return <AskPost post={post} navigate={navigate} tagProps={tagProps} />;
    case 'writeup':     return <WriteupPost post={post} tagProps={tagProps} />;
    case 'moving':      return <MovingPost post={post} navigate={navigate} tagProps={tagProps} />;
    case 'reelPreview': return <ReelPreviewPost post={post} navigate={navigate} tagProps={tagProps} />;
    case 'nova':        return <NovaPick post={post} navigate={navigate} tagProps={tagProps} />;
    case 'cookingNow':  return <CookingNow post={post} navigate={navigate} tagProps={tagProps} />;
    case 'place':       return <PlacePost post={post} navigate={navigate} tagProps={tagProps} />;
    case 'season':      return <SeasonPost post={post} navigate={navigate} tagProps={tagProps} />;
    case 'pantry':      return <PantryPost post={post} navigate={navigate} tagProps={tagProps} />;
    case 'inPerson':    return <InPersonPost post={post} navigate={navigate} tagProps={tagProps} />;
    case 'recipeCard':  return <RecipeCardPost post={post} navigate={navigate} tagProps={tagProps} />;
    case 'mealTime':    return <MealTime post={post} navigate={navigate} />;
    case 'whimsy':      return <Whimsy navigate={navigate} />;
    case 'highlights':  return <EditorialShell label="Discover"><HeroHighlights /></EditorialShell>;
    case 'closerLook':  return <EditorialShell label="How it works"><CloserLook /></EditorialShell>;
    case 'interactive': return <EditorialShell label="One recipe, 8 flavors"><InteractiveHeroRecipe /></EditorialShell>;
    case 'end':         return <EndCard />;
    default:            return null;
  }
}
