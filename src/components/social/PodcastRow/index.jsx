import { useEffect, useState } from 'react';
import { listEpisodes } from '../../../lib/podcastApi';
import './PodcastRow.css';

/* "Put this on while you cook" — a small podcast strip tied to a place, not
   a standalone podcast browser. Tags match against whatever place context
   the caller passes (a Global Food country id, a City Explorer region, a
   cityFoodData.js region id — any stable slug works, since podcast_episodes'
   `tags` column is a bare untyped jsonb array with no existing convention to
   conform to; this session picked the simplest one). Renders nothing if
   there are no episodes for these tags — same "ships empty, appears when
   real content exists" pattern as sponsorships.js/travelPartners.js. */
export default function PodcastRow({ tags = [] }) {
  const [episodes, setEpisodes] = useState(null);

  useEffect(() => {
    let alive = true;
    const tag = tags[0];
    if (!tag) { setEpisodes([]); return; }
    listEpisodes({ tag }).then(list => { if (alive) setEpisodes(list); });
    return () => { alive = false; };
  }, [tags.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!episodes || episodes.length === 0) return null;

  return (
    <div className="podcast-row">
      <p className="podcast-row-kicker">🎙️ PUT THIS ON WHILE YOU COOK</p>
      <div className="podcast-row-list">
        {episodes.slice(0, 3).map(ep => (
          <a key={ep.id} className="podcast-row-item" href={ep.audioUrl} target="_blank" rel="noreferrer">
            {ep.coverImage
              ? <img className="podcast-row-cover" src={ep.coverImage} alt="" />
              : <span className="podcast-row-cover podcast-row-cover-ph">🎙️</span>}
            <span className="podcast-row-text">
              <span className="podcast-row-title">{ep.title}</span>
              {ep.durationSec && (
                <span className="podcast-row-dur">{Math.round(ep.durationSec / 60)} min</span>
              )}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
