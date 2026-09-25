import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import { fetchRecipes } from '../../../services/api';
import { listJudgedFeed } from '../../../lib/journalApi';
import { getUserId } from '../../../lib/syncService';
import { loadUserPosts } from '../../../lib/userPosts';
import { searchByTags } from '../../../lib/buildFeed';
import Post from '../../../components/social/PostTypes/index';
import { TIME_WINDOWS, DEFAULT_WINDOW, filterByWindow, relatedTags, tagStats } from '../../../lib/communityHub';
import '../../Home/Home.css';   // the post-*/column-* styles Post relies on (same reuse FollowedTagsFeed uses)
import './TagHub.css';

/* TagHub — a tag's real address. Reached from every "tap a tag to enter its
   community" gesture app-wide (Community's "Your Communities," SideRail's
   "tags you follow," Explorer's per-dish tag chips, Your Tags' chips) — all
   of those used to navigate to `/?tag=X`, a Home-page mode whose URL got
   scrubbed on the next render, so a tag never had a stable, shareable page.
   This does: a real header (post counts, a follow toggle), a time window,
   the actual posts (searchByTags — not re-implemented here), and a related-
   communities carousel from real tag co-occurrence.

   Home's OWN tap-a-tag-on-a-post behavior is deliberately untouched — that's
   a different, valuable feature (build a compound union search by tapping
   several tags while browsing), not "enter a community." See
   src/lib/communityHub.js for why the two stay separate. */

function loadFollowed() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_followed_tags') || '[]'); return new Set(Array.isArray(v) ? v : []); }
  catch { return new Set(); }
}

export default function TagHub() {
  const { name } = useParams();
  const tag = decodeURIComponent(name || '');
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState([]);
  const [judged, setJudged] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userPosts] = useState(() => loadUserPosts());
  const [followed, setFollowed] = useState(loadFollowed);
  const [windowId, setWindowId] = useState(DEFAULT_WINDOW);
  const [now] = useState(() => new Date());
  const zip = (() => { try { return localStorage.getItem('dig_in_zip'); } catch { return null; } })();

  useEffect(() => {
    fetchRecipes(1000).then(setRecipes).catch(() => {});
    listJudgedFeed().then(setJudged).catch(() => {});
    getUserId().then(setUserId).catch(() => {});
  }, []);

  // Re-run when the tag itself changes (a related-communities tap lands on
  // this same route with a new :name — scroll back to the top of the new hub).
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [tag]);

  const result = useMemo(
    () => (tag ? searchByTags([tag], { recipes, judged, zip, now, userPosts, limit: 150 }) : { posts: [], total: 0 }),
    [tag, recipes, judged, zip, now, userPosts],
  );

  const stats = useMemo(() => tagStats(result.posts, windowId, now.getTime()), [result.posts, windowId, now]);
  const shown = useMemo(() => filterByWindow(result.posts, windowId, now.getTime()), [result.posts, windowId, now]);
  const related = useMemo(() => relatedTags(tag, result.posts, 8), [tag, result.posts]);

  const isFollowed = followed.has(tag);
  const toggleFollow = useCallback(() => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      try { localStorage.setItem('dig_in_followed_tags', JSON.stringify([...next])); } catch { /* quota */ }
      return next;
    });
  }, [tag]);

  // Tapping a tag ON A POST here still widens within Home's union search (the
  // existing, different feature) rather than re-navigating hubs mid-scroll —
  // consistent with how every other tag chip on a post already behaves.
  const onTag = useCallback((t) => navigate(`/?tag=${encodeURIComponent(t)}`), [navigate]);
  const tagProps = { followed, onTag, onFollow: (t) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      try { localStorage.setItem('dig_in_followed_tags', JSON.stringify([...next])); } catch { /* quota */ }
      return next;
    });
  } };

  function onRated(entryId, res) {
    setJudged((prev) => prev.map((e) => (e.id === entryId
      ? { ...e, ratingAvg: res.ratingAvg ?? e.ratingAvg, ratingCount: res.ratingCount ?? e.ratingCount }
      : e)));
  }

  const windowLabel = TIME_WINDOWS.find((w) => w.id === windowId)?.label || '';

  return (
    <div className="th-page">
      <Nav />
      <div className="th-wrap">
        <button type="button" className="th-back" onClick={() => navigate(-1)}>← Back</button>

        <header className="th-head">
          <span className="th-eyebrow">COMMUNITY</span>
          <h1 className="th-tag">{tag}</h1>
          <p className="th-stats">
            {stats.total} post{stats.total === 1 ? '' : 's'} total · {stats.inWindow} {windowLabel.toLowerCase()}
          </p>
          <button type="button" className={`th-follow${isFollowed ? ' following' : ''}`} onClick={toggleFollow}>
            {isFollowed ? '✓ Following' : '+ Follow this tag'}
          </button>
        </header>

        <div className="th-windows" role="tablist" aria-label="Time window">
          {TIME_WINDOWS.map((w) => (
            <button
              key={w.id}
              type="button"
              role="tab"
              aria-selected={windowId === w.id}
              className={`th-window${windowId === w.id ? ' active' : ''}`}
              onClick={() => setWindowId(w.id)}
            >
              {w.label}
            </button>
          ))}
        </div>

        {related.length > 0 && (
          <div className="th-related">
            <span className="th-related-head">RELATED COMMUNITIES</span>
            <div className="th-related-track">
              {related.map((r) => (
                <button
                  key={r.tag}
                  type="button"
                  className="th-related-chip"
                  onClick={() => navigate(`/tag/${encodeURIComponent(r.tag)}`)}
                  title={`Also tagged ${r.count} time${r.count === 1 ? '' : 's'} alongside ${tag}`}
                >
                  <span className="th-related-tag">{r.tag}</span>
                  <span className="th-related-count">{r.count}×</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="column th-column">
          {shown.length === 0 ? (
            <p className="column-empty">
              {stats.total === 0
                ? <>Nothing tagged <b>{tag}</b> yet.</>
                : <>Nothing tagged <b>{tag}</b> in the last {windowLabel.toLowerCase()} — try a wider window above.</>}
            </p>
          ) : (
            shown.map((post) => (
              <Post key={post.id} post={post} currentUserId={userId} onRated={onRated} tagProps={tagProps} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
