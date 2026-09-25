import { useRef, useState, useCallback } from 'react';
import './EpisodePlayer.css';

/* EpisodePlayer — the audio surface for a weekly drop (an "episode": a woman's
   story, in her own voice). This is the one genuinely new capability in The
   Table; the drop/circle/question/magazine loop was already wired.

   Honest by design, three states:
     • A hosted recording (drop.audio, any URL — a bundled /audio/*.mp3 or an
       episode file from wherever the podcast is hosted): a real custom player,
       play / seek / time.
     • Only platform links (drop.episodeLinks): "Listen on Spotify / Apple /
       YouTube" — the reach layer lives off-app on purpose.
     • Neither yet: a plain "the recording's coming" note. Nothing fake, no
       stock voice standing in for a real woman — the written story carries the
       week until a real episode exists.

   `compact` is the archive variant: no empty-state noise, just a play control
   when there's actually something to play. */

const PLATFORMS = [
  { key: 'spotify', label: 'Spotify' },
  { key: 'apple', label: 'Apple Podcasts' },
  { key: 'youtube', label: 'YouTube' },
];

function fmt(t) {
  if (!Number.isFinite(t) || t < 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function EpisodePlayer({ drop, compact = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const links = drop?.episodeLinks || null;
  const hasLinks = links && PLATFORMS.some((p) => links[p.key]);
  const hasAudio = !!drop?.audio;

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); }
    else { el.pause(); setPlaying(false); }
  }, []);

  const onSeek = (e) => {
    const el = audioRef.current;
    if (!el) return;
    const t = Number(e.target.value);
    el.currentTime = t;
    setCur(t);
  };

  // Nothing recorded yet: honest note (full view only), or nothing (archive).
  if (!hasAudio && !hasLinks) {
    if (compact) return null;
    return (
      <section className="ep ep-empty">
        <span className="ep-kicker">🎧 The Episode</span>
        <p className="ep-empty-note">
          The story’s written. The recording’s next — {drop?.quoteBy ? drop.quoteBy.split(',')[0] : 'her'} in her own voice,
          coming soon.
        </p>
      </section>
    );
  }

  return (
    <section className={`ep${compact ? ' ep-compact' : ''}`}>
      {!compact && (
        <span className="ep-kicker">🎧 The Episode{drop.duration ? ` · ${drop.duration}` : ''}</span>
      )}

      {hasAudio && (
        <div className="ep-player">
          <audio
            ref={audioRef}
            src={drop.audio}
            preload="none"
            onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
            onEnded={() => setPlaying(false)}
          />
          <button type="button" className="ep-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play episode'}>
            {playing ? '❚❚' : '▶'}
          </button>
          <div className="ep-track">
            <input
              className="ep-seek"
              type="range"
              min={0}
              max={dur || 0}
              step={0.1}
              value={Math.min(cur, dur || 0)}
              onChange={onSeek}
              aria-label="Seek"
            />
            <div className="ep-time"><span>{fmt(cur)}</span><span>{dur ? fmt(dur) : (drop.duration || '')}</span></div>
          </div>
        </div>
      )}

      {hasLinks && (
        <div className="ep-links">
          {!hasAudio && <span className="ep-links-lead">Listen on</span>}
          {PLATFORMS.filter((p) => links[p.key]).map((p) => (
            <a key={p.key} className="ep-link" href={links[p.key]} target="_blank" rel="noreferrer">{p.label} ↗</a>
          ))}
        </div>
      )}
    </section>
  );
}
