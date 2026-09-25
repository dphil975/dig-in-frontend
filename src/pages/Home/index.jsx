import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import Nav from '../../components/shell/Nav';
import './Home.css';
import { fetchRecipes, searchRecipes } from '../../services/api';
import { listJudgedFeed } from '../../lib/journalApi';
import { getUserId } from '../../lib/syncService';
import { track } from '../../lib/analytics';
import Post, { TagRow } from '../../components/social/PostTypes/index';
import PostComposer from './PostComposer';
import { buildFeed, trendingTags, metroForZip, searchByTags, MAX_SEARCH_TAGS } from '../../lib/buildFeed';
import { LIFE_MODES, activeLifeMode, setLifeMode, clearLifeMode } from '../../lib/feedContext';
import { consequenceStats, logImpressions, keyForPost } from '../../lib/madeItRate';
import { refreshWeather } from '../../lib/weatherService';
import { loadUserPosts } from '../../lib/userPosts';
import RecallBar from '../../components/health/RecallBar';
import HealthAdvisory from '../../components/health/HealthAdvisory';
import FreshPanel from './FreshPanel';
import { todaysHandoff, resolveHandoff } from '../../lib/recess';
import {
  solveQuery, MOODS, MOOD_BY_ID, nurtureResponse, recordCheckIn,
  lastCheckIn, checkedInToday, getNoSolutions, setNoSolutions,
} from '../../lib/nurture';

/* Home — rebuilt on Tumblr's logic (see docs/design/DIG_IN_HERO_REDESIGN.md).

   The old page was a marketing hero whose own brand appeared at line 450,
   below a store-deal finder. This is a three-zone reading surface instead:

     ┌─ left rail ──┬─ feed column (540px) ─┬─ right rail ─┐
     │ WORDMARK     │ tabs                  │ cooking now  │
     │ tagline      │ inline onboarding     │ trending     │
     │ post button  │ mixed-shape posts     │ your coins   │
     │ nav          │ … the feed ENDS       │              │
     │ tags you     │                       │              │
     │ follow       │                       │              │
     └──────────────┴───────────────────────┴──────────────┘

   No hero, no value-prop banner, no budget gate before the first dish. The
   content is the pitch. The grid, filters, budget widget, SmartFinder and
   the two chained modals are all gone from here — the budget question moved
   to Cook (where money is the actual question) and the grid became Cook's
   browse view. Every displaced system is now a post type, not deleted. */

const BOROUGHS = [
  { id: 'manhattan', label: 'Manhattan' },
  { id: 'brooklyn', label: 'Brooklyn' },
  { id: 'queens', label: 'Queens' },
  { id: 'bronx', label: 'The Bronx' },
  { id: 'staten-island', label: 'Staten Island' },
];

const TABS = [
  { id: 'for-you', label: 'For You' },
  { id: 'fresh', label: 'Fresh' },
  { id: 'tags', label: 'Your Tags' },
];

const TAGLINES = ['come eat with people.', 'nobody cooks alone.', "today's table."];

function loadFollowed() {
  try { return new Set(JSON.parse(localStorage.getItem('dig_in_followed_tags') || '[]')); }
  catch { return new Set(); }
}

// A compact recipe result — search on Home is a real recipe search (reuses
// services/api searchRecipes) rendered as light cards in the column, not a
// second grid. Opening one drops it into the recipe view.
function ResultCard({ recipe, onOpen }) {
  return (
    <button type="button" className="home-result" onClick={() => onOpen(recipe)}>
      <span className="home-result-name">{recipe.name}</span>
      {(recipe.country || recipe.cuisine) && (
        <span className="home-result-meta">{recipe.country || recipe.cuisine}</span>
      )}
    </button>
  );
}

// Recess handoff — if yesterday-you planned a meal for today, surface it right
// in the feed where people already scroll, so the plan pays off without a trip
// to /recess. Text-only (the plan is freetext), warm not alarming, and clears
// itself the moment you tap "made it." Renders nothing when there's no plan.
function HandoffStrip() {
  const navigate = useNavigate();
  const [handoff, setHandoff] = useState(() => { try { return todaysHandoff(); } catch { return null; } });
  if (!handoff) return null;
  return (
    <div className="home-handoff">
      <span className="home-handoff-tag">🌤️ from yesterday-you</span>
      <p className="home-handoff-txt">
        you planned <strong>{handoff.text}</strong> for today.
      </p>
      <div className="home-handoff-actions">
        <button type="button" className="home-handoff-done" onClick={() => { resolveHandoff(); setHandoff(null); }}>
          made it ✓
        </button>
        <button type="button" className="home-handoff-link" onClick={() => navigate('/recess')}>
          Recess →
        </button>
      </div>
    </div>
  );
}

// Solution-aware search result — the reflection the search bar gives back when
// you typed a feeling, not a dish. Crisis language surfaces real hotlines and
// nothing else. A problem reflects first, then reveals real in-app help ONLY
// behind a "want a few ideas?" tap (and never at all if the no-solutions
// preference is on). Nobody is pushed toward a fix.
function NurtureResult({ data, onClose, onRoute, onLifeMode }) {
  const [showHelp, setShowHelp] = useState(false);

  if (data.kind === 'crisis') {
    return (
      <div className="home-nurture is-crisis" role="status">
        <p className="home-nurture-reflect">{data.reflection}</p>
        <ul className="home-nurture-crisis">
          {data.resources.map((r) => (
            <li key={r.label}>
              <a href={r.href}>{r.label}</a>
              <span>{r.detail}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="home-nurture-dismiss" onClick={onClose}>close</button>
      </div>
    );
  }

  const hasHelp = data.solutions && data.solutions.length > 0;
  return (
    <div className="home-nurture" role="status">
      <span className="home-nurture-tag">💛 heard you</span>
      <p className="home-nurture-reflect">{data.reflection}</p>

      {data.noSolutions ? (
        <p className="home-nurture-listen">just listening — no fixes, like you asked. i'm here.</p>
      ) : !hasHelp ? (
        <p className="home-nurture-listen">i'm here. if it would help to say more, the bar is listening.</p>
      ) : !showHelp ? (
        <div className="home-nurture-gate">
          <button type="button" className="home-nurture-more" onClick={() => setShowHelp(true)}>
            want a few gentle ideas? →
          </button>
          <button type="button" className="home-nurture-no" onClick={onClose}>
            no, just needed to say it
          </button>
        </div>
      ) : (
        <div className="home-nurture-sols">
          {data.solutions.map((s) => (
            <button
              key={s.route || s.lifeMode}
              type="button"
              className="home-nurture-sol"
              onClick={() => (s.lifeMode ? onLifeMode(s.lifeMode) : onRoute(s.route))}
            >
              <span className="home-nurture-sol-label">{s.label}</span>
              <span className="home-nurture-sol-why">{s.why}</span>
            </button>
          ))}
          <p className="home-nurture-optout">none of these? that's okay too — <button type="button" onClick={onClose}>just sit here a minute</button>.</p>
        </div>
      )}
    </div>
  );
}

// The daily "How are you?" — one tap, a warm non-fixing response, and (only for
// the heavier moods) a couple of soft doors. Collapses once you've checked in.
function CheckInStrip({ onRoute }) {
  const [last, setLast] = useState(() => { try { return checkedInToday() ? lastCheckIn() : null; } catch { return null; } });
  const [picked, setPicked] = useState(null);
  const [noFix, setNoFix] = useState(() => { try { return getNoSolutions(); } catch { return false; } });

  const active = picked || last;
  const mood = active ? MOOD_BY_ID[active.mood] : null;

  function pick(id) {
    const entry = recordCheckIn(id);
    setPicked(entry); setLast(entry);
  }
  function toggleNoFix() { const v = setNoSolutions(!noFix); setNoFix(v); }

  return (
    <div className="home-checkin">
      {!active ? (
        <>
          <span className="home-checkin-q">how are you today?</span>
          <div className="home-checkin-moods">
            {MOODS.map((m) => (
              <button key={m.id} type="button" className="home-checkin-mood" onClick={() => pick(m.id)}>
                <span aria-hidden="true">{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="home-checkin-resp">
            <span className="home-checkin-mood-tag">{mood?.emoji} {mood?.label}</span>
            {nurtureResponse(active.mood)}
          </p>
          {mood?.need === 'high' && (
            <div className="home-checkin-doors">
              <button type="button" onClick={() => onRoute('/nova')}>sit with Nova →</button>
              <button type="button" onClick={() => onRoute('/recess')}>take two minutes →</button>
            </div>
          )}
          <button type="button" className="home-checkin-change" onClick={() => { setPicked(null); setLast(null); }}>
            check in again
          </button>
        </>
      )}
      <label className="home-checkin-nofix">
        <input type="checkbox" checked={noFix} onChange={toggleNoFix} />
        when I share, just listen — don't offer fixes
      </label>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  // Real data.
  const [recipes, setRecipes] = useState([]);
  const [judged, setJudged] = useState([]);
  const [userId, setUserId] = useState(null);
  // The user's own written text / "Substack" posts (localStorage — lib/userPosts).
  const [userPosts, setUserPosts] = useState(() => loadUserPosts());
  const [composing, setComposing] = useState(false);

  // User state (all real, all persisted).
  const coins = parseInt(localStorage.getItem('dig_in_coins') || '0', 10);
  const badges = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('dig_in_badges') || '[]'); } catch { return []; }
  }, []);
  const dishCount = judged.filter((e) => e.userId && userId && e.userId === userId).length;
  const [followed, setFollowed] = useState(loadFollowed);
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem('dig_in_onboarded'));
  const [homePlace, setHomePlace] = useState(() => localStorage.getItem('dig_in_home_borough') || '');
  const zip = (() => { try { return localStorage.getItem('dig_in_zip'); } catch { return null; } })();

  // View state.
  const [tab, setTab] = useState('for-you');
  // Tag search — a UNION of up to MAX_SEARCH_TAGS hashtags. Each tag you add
  // WIDENS the results (more tags → more posts). See searchByTags in buildFeed.
  const [activeTags, setActiveTags] = useState([]);
  const [corpus, setCorpus] = useState([]);          // full recipe set, fetched lazily for tag search
  const [capNote, setCapNote] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [nurture, setNurture] = useState(null);   // solution-aware search response
  const [now, setNow] = useState(() => new Date());

  // Life mode — the user's declared season of life. It reshapes the feed for
  // weeks (see feedContext.js); a "quiet" mode (grief) also hushes the YOU card.
  const [lifeMode, setLifeModeState] = useState(() => activeLifeMode());
  const [modeOpen, setModeOpen] = useState(false);
  const quiet = !!(lifeMode?.shape?.quiet || lifeMode?.shape?.noGamification);

  useEffect(() => {
    fetchRecipes(24).then(setRecipes).catch(() => {});
    listJudgedFeed().then(setJudged).catch(() => {});
    getUserId().then(setUserId).catch(() => {});
    // Refresh the real weather reading (only if a location already exists — no
    // permission prompt). When it lands, re-evaluate the feed so #hotday /
    // #coldsnap and the seasonal suppression reflect what it's actually like out.
    refreshWeather().then((w) => { if (w) setNow(new Date()); }).catch(() => {});
    // A ?tag= (e.g. from the SideRail's "tags you follow" on another page)
    // opens straight into that tag's view, then cleans the URL.
    try {
      const t = new URLSearchParams(window.location.search).get('tag');
      if (t) {
        setActiveTags([t]);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch { /* ignore */ }
  }, []);

  // The clock ticks each minute (also re-evaluates the meal window).
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Life mode now lives in the global SideRail; when it changes there, re-read
  // it and re-evaluate the feed so the change applies without a reload.
  useEffect(() => {
    const onModeChange = () => { setLifeModeState(activeLifeMode()); setNow(new Date()); };
    window.addEventListener('dig_in_lifemode', onModeChange);
    return () => window.removeEventListener('dig_in_lifemode', onModeChange);
  }, []);

  const feed = useMemo(
    () => buildFeed({ recipes, judged, zip, now, followed, userPosts, userId }),
    [recipes, judged, zip, now, followed, userPosts, userId],
  );

  const trending = useMemo(() => trendingTags(feed, 8), [feed]);

  // The MIR denominator (Part 2 / build-step 1): count a post as SEEN the first
  // time it enters the rendered column this session. One localStorage write per
  // batch; each post id logged at most once (impressed ref).
  const impressed = useRef(new Set());

  // Meals Made — the headline metric (Part 8). Read straight from the real cook
  // log; recomputed when the cook history could have changed.
  const stats = useMemo(() => consequenceStats({ days: 30 }), [judged, now]);

  // The daily feed, filtered by the active tab (tag search is handled
  // separately; the "fresh" tab isn't a feed filter at all anymore — it renders
  // its own stewardship panel below).
  const visible = useMemo(() => {
    if (tab === 'fresh') return [];   // Fresh renders FreshPanel, not the feed
    let list = feed;
    if (tab === 'tags') {
      if (followed.size) list = list.filter((p) => p.tags?.some((t) => followed.has(t)) || p.type === 'end');
      else list = list.filter((p) => p.type === 'end');
    }
    return list;
  }, [feed, tab, followed]);

  // Tag search — a UNION across the whole corpus (all judged dishes + every
  // recipe), not just today's feed. The corpus loads lazily the first time you
  // open a tag; until it lands we search the small daily set so results are
  // instant, then upgrade.
  const tagMode = activeTags.length > 0;
  const tagResults = useMemo(() => {
    if (!tagMode) return { posts: [], total: 0 };
    const pool = corpus.length ? corpus : recipes;
    return searchByTags(activeTags, { recipes: pool, judged, zip, now, userPosts });
  }, [tagMode, activeTags, corpus, recipes, judged, zip, now, userPosts]);

  useEffect(() => {
    if (tagMode && !corpus.length) {
      fetchRecipes(1000).then(setCorpus).catch(() => {});
    }
  }, [tagMode, corpus.length]);

  // What the column actually renders right now (text search wins, then tag
  // search, then the daily feed).
  const showing = results ? [] : tagMode ? tagResults.posts : visible;

  // Log an impression for every post that actually renders, once per session.
  useEffect(() => {
    const keys = [];
    for (const p of showing) {
      if (impressed.current.has(p.id)) continue;
      impressed.current.add(p.id);
      const k = keyForPost(p);
      if (k) keys.push(k);
    }
    if (keys.length) logImpressions(keys);
  }, [showing]);

  const chooseMode = useCallback((id) => {
    if (id) setLifeMode(id); else clearLifeMode();
    setLifeModeState(activeLifeMode());
    setModeOpen(false);
    setNow(new Date());          // re-evaluate the feed under the new context
    track('life_mode_set', { mode: id || 'clear' });
  }, []);

  const toggleFollow = useCallback((tag) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      try { localStorage.setItem('dig_in_followed_tags', JSON.stringify([...next])); } catch { /* quota */ }
      return next;
    });
  }, []);

  // Add a tag to the search (union). Each new tag widens the results; capped at
  // MAX_SEARCH_TAGS for now. Clears any text search so the two don't fight.
  const exploreTag = useCallback((tag) => {
    setResults(null);
    setQuery('');
    setActiveTags((prev) => {
      if (prev.includes(tag)) return prev;               // already searching it
      if (prev.length >= MAX_SEARCH_TAGS) {
        setCapNote(`You can search up to ${MAX_SEARCH_TAGS} tags for now — remove one to add another.`);
        return prev;
      }
      setCapNote('');
      track('home_tag_added', { tag, count: prev.length + 1 });
      return [...prev, tag];
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const removeTag = useCallback((tag) => {
    setCapNote('');
    setActiveTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const clearTags = useCallback(() => { setCapNote(''); setActiveTags([]); }, []);

  const tagProps = { followed, onTag: exploreTag, onFollow: toggleFollow };

  // A user published a text/"Substack" write-up — re-read the store so it lands
  // at the top of the column, close the composer, and drop out of any tag view.
  const onPublishedPost = useCallback((post) => {
    setUserPosts(loadUserPosts());
    setComposing(false);
    setResults(null);
    clearTags();
    setTab('for-you');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    track('home_post_published', { has_steps: (post?.steps?.length || 0) > 0, tags: post?.tags?.length || 0 });
  }, [clearTags]);

  function onRated(entryId, res) {
    setJudged((prev) => prev.map((e) => (e.id === entryId
      ? { ...e, ratingAvg: res.ratingAvg ?? e.ratingAvg, ratingCount: res.ratingCount ?? e.ratingCount }
      : e)));
  }

  function openRecipe(recipe) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) { setResults(null); setNurture(null); return; }
    clearTags();                 // text search and tag search are separate modes

    // Solution-aware search: the bar listens first. If what you typed reads as a
    // feeling or a problem, we reflect it back (and, only if wanted, point to
    // real help) before — or instead of — a recipe list.
    const solved = solveQuery(q);
    setNurture(solved.kind === 'problem' || solved.kind === 'crisis' ? solved : null);
    track('home_search', { q, kind: solved.kind });

    if (solved.kind === 'crisis') { setResults(null); return; } // don't answer a crisis with recipes
    // For a 'problem' we still surface food below the reflection (many struggles
    // are food-adjacent); a plain 'recipe' search is unchanged.
    setSearching(true);
    searchRecipes(q).then(setResults).finally(() => setSearching(false));
  }

  function completeOnboarding(place) {
    if (place?.label) {
      setHomePlace(place.label);
      try { localStorage.setItem('dig_in_home_borough', place.label); } catch { /* quota */ }
    }
    setOnboarded(true);
    try { localStorage.setItem('dig_in_onboarded', '1'); } catch { /* quota */ }
    track('onboarding_complete', { place: place?.id || 'skip' });
  }

  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const metro = zip ? metroForZip(zip) : null;
  const placeLabel = homePlace || metro?.city || 'your kitchen';

  // The hero's contextual invitation — warm, meal-aware, and quiet. Just a read
  // of the hour, no new dependency; the serif line carries it.
  const weekday = now.toLocaleDateString([], { weekday: 'long' });
  const heroInvite = (() => {
    const h = now.getHours();
    if (h < 11) return 'What sounds good this morning?';
    if (h < 15) return "What are we making for lunch?";
    if (h < 21) return 'What are we making tonight?';
    return 'Something small before bed?';
  })();

  // Right-rail Cooking-Now mirrors the feed's cooking-now post, compact.
  const cookingNow = feed.find((p) => p.type === 'cookingNow');

  return (
    <div className="app-container">
      <Nav />

      {/* Editorial masthead — the calm, centered moment you land on. */}
      <header className="home-hero">
        <span className="home-hero-mark" aria-hidden="true"><Leaf size={20} strokeWidth={1.5} /></span>
        <p className="home-hero-kicker">{weekday} · {timeStr} · {placeLabel}</p>
        <h1 className="home-hero-invite">{heroInvite}</h1>
        <span className="home-hero-rule" aria-hidden="true" />
      </header>

      <div className="dash">
        {/* The left rail moved to the global SideRail (App.jsx) — brand, nav,
            life mode, and followed tags all live there now. Home is just the
            feed column + the right rail. */}

        {/* ── FEED COLUMN — single file, variable height ── */}
        <main className="column">
          <RecallBar />
          <HandoffStrip />
          {!results && !nurture && !tagMode && !composing && <CheckInStrip onRoute={navigate} />}
          <button
            type="button"
            className="column-write-cta"
            onClick={() => { setComposing(true); setResults(null); clearTags(); setTab('for-you'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            ✎ Write a post
          </button>
          <div className="column-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id && !tagMode}
                className={`column-tab${tab === t.id && !tagMode ? ' active' : ''}`}
                onClick={() => { setTab(t.id); clearTags(); }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form className="column-search" onSubmit={handleSearch}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a dish, ingredient, or cuisine…"
              aria-label="Search recipes"
            />
            <button type="submit">{searching ? '…' : 'Go'}</button>
            {(results || nurture) && (
              <button type="button" className="column-search-clear" onClick={() => { setQuery(''); setResults(null); setNurture(null); }}>Clear</button>
            )}
          </form>

          {/* Solution-aware search response — the bar heard a feeling, not a
              dish. Reflection first; real help only behind a gentle gate. */}
          {nurture && (
            <NurtureResult
              data={nurture}
              onClose={() => setNurture(null)}
              onRoute={(r) => navigate(r)}
              onLifeMode={(id) => { setLifeMode(id); try { window.dispatchEvent(new Event('dig_in_lifemode')); } catch { /* ignore */ } navigate('/'); }}
            />
          )}

          {/* Write-a-post composer — the feed's text / "Substack" post, inline
              at the top of the column (Tumblr's text-post box). */}
          {composing && (
            <PostComposer onPublished={onPublishedPost} onCancel={() => setComposing(false)} />
          )}

          {/* Tag view — a union search. The active hashtags sit up top as
              removable chips; tapping any tag on any post below ADDS it and
              widens the results. Capped at MAX_SEARCH_TAGS. */}
          {tagMode && (
            <div className="tagpage">
              <div className="tagpage-top">
                <span className="tagpage-title">
                  {tagResults.total} post{tagResults.total === 1 ? '' : 's'} tagged
                </span>
                <button type="button" className="tagpage-clear" onClick={clearTags}>✕ clear all</button>
              </div>
              <div className="tagpage-chips">
                {activeTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="tagpage-chip"
                    onClick={() => removeTag(t)}
                    title="Remove this tag"
                  >
                    {t}<span className="tagpage-x">×</span>
                  </button>
                ))}
                <span className="tagpage-counter">{activeTags.length}/{MAX_SEARCH_TAGS}</span>
              </div>
              <p className="tagpage-hint">
                {capNote
                  || (activeTags.length < MAX_SEARCH_TAGS
                    ? 'Tap another tag on any post to widen the search — more tags, more posts.'
                    : `That's the ${MAX_SEARCH_TAGS}-tag max for now. Remove one to add another.`)}
              </p>
            </div>
          )}

          {/* If the community you just opened is organized around disordered
              eating, a supportive advisory shows here — otherwise nothing. */}
          {tagMode && <HealthAdvisory tags={activeTags} />}

          {/* Inline onboarding — one question, no modal chain. */}
          {!onboarded && !results && !tagMode && (
            <div className="onboard-inline">
              <p className="onboard-q">where are you cooking tonight?</p>
              <div className="onboard-opts">
                {BOROUGHS.map((b) => (
                  <button key={b.id} type="button" onClick={() => completeOnboarding(b)}>{b.label}</button>
                ))}
                <button type="button" className="onboard-skip" onClick={() => completeOnboarding(null)}>somewhere else</button>
              </div>
            </div>
          )}

          {/* Text search takes over first; then the tag view; then the feed. */}
          {results ? (
            <div className="column-results">
              {results.length === 0
                ? <p className="column-empty">Nothing matched “{query}.” Try another ingredient or cuisine.</p>
                : results.map((r) => <ResultCard key={r.id || r.name} recipe={r} onOpen={openRecipe} />)}
              <button type="button" className="column-seeall" onClick={() => navigate('/recipe-cards')}>
                Browse everything in Cook →
              </button>
            </div>
          ) : tagMode ? (
            <div className="column-feed">
              {tagResults.total === 0 ? (
                <p className="column-empty">
                  Nothing carries {activeTags.length === 1 ? 'that tag' : 'those tags'} yet. Remove one, or tap a different tag.
                </p>
              ) : (
                showing.map((post) => (
                  <Post key={post.id} post={post} currentUserId={userId} onRated={onRated} tagProps={tagProps} />
                ))
              )}
              {tagResults.total > showing.length && (
                <p className="column-empty">Showing the first {showing.length} of {tagResults.total}. Cook one to bring it up the ranking.</p>
              )}
            </div>
          ) : tab === 'fresh' ? (
            <FreshPanel onWritePost={() => { setComposing(true); setTab('for-you'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          ) : (
            <div className="column-feed">
              {tab === 'tags' && (
                <button type="button" className="column-archive-link" onClick={() => navigate('/archive')}>
                  🗂 Looking for something you saved? Open your Archive →
                </button>
              )}
              {tab === 'tags' && !followed.size && (
                <p className="column-empty">
                  You're not following any tags yet. Right-click a tag on any post — like
                  <b> #girldinner</b> or <b> #under5</b> — to see everything with it here.
                </p>
              )}
              {visible.map((post) => (
                <Post key={post.id} post={post} currentUserId={userId} onRated={onRated} tagProps={tagProps} />
              ))}
            </div>
          )}
        </main>

        {/* ── RIGHT RAIL — quiet, gets out of the way ── */}
        <aside className="rail rail-right">
          {cookingNow && (
            <div className="rr-card rr-cooking">
              <span className="rr-head"><span className="rr-live-dot" /> COOKING NOW</span>
              <p className="rr-cooking-line">
                {cookingNow.self
                  ? <>You're mid-cook on <b>{cookingNow.dish}</b>.</>
                  : <>Be the first on <b>{cookingNow.dish}</b> tonight.</>}
              </p>
            </div>
          )}

          <div className="rr-card">
            <span className="rr-head">TRENDING TAGS</span>
            <div className="rr-tags">
              {trending.map(({ tag, count }) => (
                <button key={tag} type="button" className="rr-tag" onClick={() => exploreTag(tag)}>
                  {tag}<span className="rr-tag-count">{count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rr-card rr-you">
            <span className="rr-head">YOU</span>
            {/* The metric that matters (Part 8): meals made, not time in app. */}
            <div className="rr-consequence">
              <span className="rr-meals-n">{stats.mealsMade}</span>
              <span className="rr-meals-l">meals made</span>
              {stats.eventsAttended > 0 && (
                <span className="rr-events">{stats.eventsAttended} places visited</span>
              )}
            </div>
            {/* Gamification hides itself in a quiet (grief) mode — no streak
                pressure, no confetti, per the life-mode contract. */}
            {!quiet && (
              <div className="rr-stats">
                <div className="rr-stat"><span className="rr-stat-n">{coins}</span><span className="rr-stat-l">coins</span></div>
                <div className="rr-stat"><span className="rr-stat-n">{badges.length}</span><span className="rr-stat-l">badges</span></div>
                <div className="rr-stat"><span className="rr-stat-n">{dishCount}</span><span className="rr-stat-l">dishes</span></div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
