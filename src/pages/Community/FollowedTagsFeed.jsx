import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRecipes } from '../../services/api';
import { listJudgedFeed } from '../../lib/journalApi';
import { getUserId } from '../../lib/syncService';
import { loadUserPosts } from '../../lib/userPosts';
import { buildFeed } from '../../lib/buildFeed';
import Post from '../../components/social/PostTypes/index';

/* FollowedTagsFeed — Home's "Your Tags" tab, mirrored into the Community hub so
   your followed hashtags (your communities) can be read right where you'd look
   for community. Same source of truth (dig_in_followed_tags), same feed builder
   and Post renderer as Home, so the two stay identical instead of drifting.

   It blends everything from every tag you follow into one column; the chips up
   top jump into that single tag's own hub (/tag/:name — lib/communityHub.js).
   The archive link closes the "save it / look it up later" loop the founder
   asked for. */

function loadFollowed() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_followed_tags') || '[]'); return new Set(Array.isArray(v) ? v : []); }
  catch { return new Set(); }
}

export default function FollowedTagsFeed() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [judged, setJudged] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userPosts] = useState(() => loadUserPosts());
  const [followed, setFollowed] = useState(loadFollowed);
  const [now] = useState(() => new Date());
  const zip = (() => { try { return localStorage.getItem('dig_in_zip'); } catch { return null; } })();

  useEffect(() => {
    fetchRecipes(24).then(setRecipes).catch(() => {});
    listJudgedFeed().then(setJudged).catch(() => {});
    getUserId().then(setUserId).catch(() => {});
  }, []);

  const feed = useMemo(
    () => buildFeed({ recipes, judged, zip, now, followed, userPosts }),
    [recipes, judged, zip, now, followed, userPosts],
  );

  // Same filter Home's "Your Tags" tab uses: posts carrying a tag you follow.
  const posts = useMemo(() => {
    if (!followed.size) return [];
    return feed.filter((p) => p.tags?.some((t) => followed.has(t)) || p.type === 'end');
  }, [feed, followed]);

  const toggleFollow = useCallback((tag) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      try { localStorage.setItem('dig_in_followed_tags', JSON.stringify([...next])); } catch { /* quota */ }
      return next;
    });
  }, []);

  const onTag = useCallback((tag) => navigate(`/tag/${encodeURIComponent(tag)}`), [navigate]);
  const tagProps = { followed, onTag, onFollow: toggleFollow };

  function onRated(entryId, res) {
    setJudged((prev) => prev.map((e) => (e.id === entryId
      ? { ...e, ratingAvg: res.ratingAvg ?? e.ratingAvg, ratingCount: res.ratingCount ?? e.ratingCount }
      : e)));
  }

  const tags = [...followed];

  return (
    <div className="ytf">
      <button type="button" className="column-archive-link" onClick={() => navigate('/archive')}>
        🗂 Looking for something you saved? Open your Archive →
      </button>

      {tags.length === 0 ? (
        <p className="column-empty">
          You're not following any tags yet. Open any post and follow a tag — like
          <b> #girldinner</b> or <b> #under5</b> — and everything from the tags you follow shows up here.
        </p>
      ) : (
        <>
          <div className="ytf-chips">
            {tags.map((t) => (
              <button key={t} type="button" className="ytf-chip" onClick={() => onTag(t)} title="See everything in this tag">
                {t}
              </button>
            ))}
          </div>
          <div className="column-feed">
            {posts.length === 0 ? (
              <p className="column-empty">Nothing new from your tags right now — tap a tag above to open its full feed.</p>
            ) : (
              posts.map((post) => (
                <Post key={post.id} post={post} currentUserId={userId} onRated={onRated} tagProps={tagProps} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
