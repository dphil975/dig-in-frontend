import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Nav from '../../components/shell/Nav';
import SocialFeed from './SocialFeed';
import FollowedTagsFeed from './FollowedTagsFeed';
import HealthAdvisory from '../../components/health/HealthAdvisory';
import { concerningTag } from '../../lib/wellnessAdvisory';
import './Community.css';

/* Community hub — SocialFeed (curated card carousel of dish posts) and the
   tags you follow, behind one tab bar. The Reels tab was cut (its code is in
   _archive/retired/frontend-retired); /reels now lands here.

   YOUR COMMUNITIES (2026-07-30): the hashtags you follow ARE your communities.
   Opening Community leads with them — tap one and it takes you to that tag's
   own hub (/tag/:name — lib/communityHub.js), a real page instead of the old
   `/?tag=` trick that scrubbed itself off the URL on the next render. A
   community organized around disordered eating gets the supportive
   HealthAdvisory bar right here, before you enter it. Canonical URL is
   /feed; /social stays as an alias. */

const TABS = [
  { id: 'posts', label: 'Posts' },
  { id: 'tags', label: 'Your Tags' },
];

function loadFollowed() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_followed_tags') || '[]'); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

export default function Community({ defaultTab = 'posts' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromQuery = searchParams.get('tab');
  const valid = TABS.some(t => t.id === fromQuery);
  const [tab, setTab] = useState(valid ? fromQuery : defaultTab);
  const followed = loadFollowed();

  function pick(id) {
    setTab(id);
    setSearchParams(id === 'posts' ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="dih-hub">
      <Nav />

      {/* Your communities — the hashtags you follow, front and center. */}
      {followed.length > 0 && (
        <div className="dih-communities">
          <div className="dih-communities-head">
            <span className="dih-communities-title">YOUR COMMUNITIES</span>
            <span className="dih-communities-sub">the tags you follow — tap to enter</span>
          </div>
          {/* One supportive advisory if ANY followed community reads as
              disordered-eating-organized (conservative — normal healthy tags
              never trip it). */}
          <HealthAdvisory tags={followed} />
          <div className="dih-community-chips">
            {followed.map((t) => (
              <button
                key={t}
                type="button"
                className={`dih-community-chip${concerningTag([t]) ? ' flagged' : ''}`}
                onClick={() => navigate(`/tag/${encodeURIComponent(t)}`)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dih-hub-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`dih-hub-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => pick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'posts' && <SocialFeed embedded />}
      {tab === 'tags' && <FollowedTagsFeed />}
    </div>
  );
}
