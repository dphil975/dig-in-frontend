import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import { useAuth } from '../../../../hooks/useAuth';
import { listMembers, listPosts, createPost } from '../../../../lib/circlesApi';
import {
  currentDrop, answeredThisWeekIds, isAnswerThisWeek, answersThisWeek, distinctAnswerWeeks,
} from '../../../../lib/theTable';
import VoiceRecorder from '../../../../components/social/VoiceRecorder';
import './Circles.css';

function shortId(id) {
  return id ? `chef_${String(id).slice(0, 6)}` : 'unknown';
}

/* Downscale a chosen photo to a sane size before it becomes a post — the plate
   you cooked, which lowers the bar to answering (a picture is easier than
   words). Kept small so the base64 payload stays reasonable. */
function fileToDownscaledDataUrl(file, max = 1000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = String(reader.result || ''); };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CircleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [image, setImage] = useState('');        // the plate photo (data URL)
  const [audio, setAudio] = useState('');        // a voice answer (data URL)
  const [sharePublic, setSharePublic] = useState(false); // opt this answer into the public Issue
  const [notice, setNotice] = useState(null);    // { text, blocked }
  const [posting, setPosting] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [nudged, setNudged] = useState(false);

  const drop = useMemo(() => currentDrop(), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [m, p] = await Promise.all([listMembers(id), listPosts(id)]);
    setMembers(m);
    setPosts(p);
    setLoading(false);
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  // The retention keystone: who's answered THIS week's question. A post made
  // during the current drop-week IS the answer (theTable derives it from the
  // timestamp — no new post field needed).
  const answeredIds = useMemo(() => answeredThisWeekIds(posts), [posts]);
  const youAnswered = !!(user && answeredIds.has(user.id));
  const weekAnswers = useMemo(() => answersThisWeek(posts), [posts]);
  const weeksTogether = useMemo(() => distinctAnswerWeeks(posts), [posts]);
  // Once a circle has actually gathered for a while, invite them offline.
  const meetupUnlocked = weeksTogether >= 4 || posts.length >= 10;
  const unanswered = Math.max(0, members.length - answeredIds.size);

  // A nudge here can't push a notification to other people (there's no such
  // service, and inventing one would be dishonest) — so it copies a warm
  // reminder the host can paste wherever the circle actually talks.
  async function nudgeCircle() {
    const msg = `This week’s question is up: “${drop?.question || ''}” — ${answeredIds.size} of us have answered so far. Come pull up a chair and add yours 🍲`;
    try { await navigator.clipboard.writeText(msg); setNudged(true); setTimeout(() => setNudged(false), 2200); }
    catch { /* clipboard blocked — nothing to do */ }
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { setImage(await fileToDownscaledDataUrl(file)); }
    catch { setNotice({ text: "Couldn't read that photo — try another.", blocked: false }); }
  }

  async function submit(e) {
    e.preventDefault();
    if ((!text.trim() && !image && !audio) || posting) return;
    setPosting(true);
    setNotice(null);
    const result = await createPost(id, { text, image, audio, sharePublic });
    setPosting(false);

    if (result.ok) {
      setText(''); setImage(''); setAudio(''); setSharePublic(false);
      refresh();
      return;
    }
    // Kindness Filter response: `held` = warn (edit and resend); otherwise
    // muted/banned — same rung copy kindnessProtocol.js's Nest demo uses.
    setNotice({ text: result.error, blocked: !result.held });
    if (!result.held) setText('');
  }

  return (
    <>
      <Nav />
      <div className="circ-page">
        <button className="circ-back" onClick={() => navigate('/circles')}>← ALL CIRCLES</button>

        {loading ? (
          <div className="circ-loading">Loading…</div>
        ) : (
          <>
            <div className="circ-members">
              {members.length} member{members.length !== 1 ? 's' : ''} ·{' '}
              {members.map(m => (m.user_id === user?.id ? 'You' : shortId(m.user_id))).join(', ')}
            </div>

            {/* This week's question — the episode's thread, pulled into the circle.
                Answering below (a post this week) IS your answer to it. */}
            {drop?.question && (
              <div className="circ-question">
                <span className="circ-question-kicker">This week’s question</span>
                <p className="circ-question-text">{drop.question}</p>
                <button type="button" className="circ-question-link" onClick={() => navigate('/table')}>
                  from {drop.place} →
                </button>
              </div>
            )}

            {/* The retention number: how many of you have answered this week. */}
            <div className="circ-participation">
              <div className="circ-part-bar">
                <span
                  className="circ-part-fill"
                  style={{ width: `${members.length ? Math.round((answeredIds.size / members.length) * 100) : 0}%` }}
                />
              </div>
              <div className="circ-part-line">
                <b>{answeredIds.size} of {members.length}</b> answered this week
                {youAnswered
                  ? <span className="circ-part-you done"> · you’re in ✓</span>
                  : <span className="circ-part-you"> · your seat’s open</span>}
              </div>
              <div className="circ-part-links">
                {weekAnswers.length > 0 && (
                  <button type="button" className="circ-issue-toggle" onClick={() => setShowIssue(s => !s)}>
                    {showIssue ? 'Hide this circle’s issue' : `📖 This circle’s issue (${weekAnswers.length})`}
                  </button>
                )}
                {unanswered > 0 && (
                  <button type="button" className="circ-issue-toggle" onClick={nudgeCircle}>
                    {nudged ? 'Reminder copied ✓' : `🔔 Nudge the ${unanswered} who haven’t`}
                  </button>
                )}
                <button type="button" className="circ-issue-toggle" onClick={() => navigate('/issue')}>
                  🌍 The public issue →
                </button>
              </div>
            </div>

            {/* "The magazine writes itself" — an issue is just a query: this
                week's episode + this week's answers, laid out. Circle-scoped, so
                it's the same people who can already see the posts (no consent
                gap). A truly public issue would need a share flag on posts. */}
            {showIssue && (
              <div className="circ-issue">
                <div className="circ-issue-masthead">
                  <span className="circ-issue-eyebrow">The Table · this week’s issue</span>
                  <h3 className="circ-issue-place">{drop.place}</h3>
                  <blockquote className="circ-issue-quote">{drop.quote}<cite>— {drop.quoteBy}</cite></blockquote>
                  <p className="circ-issue-q">{drop.question}</p>
                </div>
                <div className="circ-issue-answers">
                  {weekAnswers.map(p => (
                    <figure className="circ-issue-answer" key={p.id}>
                      {p.image && <img className="circ-issue-photo" src={p.image} alt="" />}
                      {p.audio && <audio className="circ-issue-audio" controls preload="none" src={p.audio} />}
                      {p.text && <blockquote className="circ-issue-text">“{p.text}”</blockquote>}
                      <figcaption className="circ-issue-by">— {p.user_id === user?.id ? 'You' : shortId(p.user_id)}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}

            <div className="circ-posts">
              {posts.length === 0 && <div className="circ-empty">No answers yet — be the first to set a place.</div>}
              {posts.map(p => (
                <div className={`circ-post${isAnswerThisWeek(p) ? ' this-week' : ''}`} key={p.id}>
                  <div className="circ-post-author">
                    {p.user_id === user?.id ? 'You' : shortId(p.user_id)}
                    {isAnswerThisWeek(p) && <span className="circ-post-week">this week</span>}
                  </div>
                  {p.text && <div className="circ-post-text">{p.text}</div>}
                  {p.image && <img className="circ-post-image" src={p.image} alt="" />}
                  {p.audio && <audio className="circ-post-audio" controls preload="none" src={p.audio} />}
                </div>
              ))}
            </div>

            <form className="circ-post-form" onSubmit={submit}>
              {notice && (
                <div className={`circ-notice${notice.blocked ? ' blocked' : ''}`}>{notice.text}</div>
              )}
              {image && (
                <div className="circ-photo-preview">
                  <img src={image} alt="" />
                  <button type="button" className="circ-photo-remove" onClick={() => setImage('')} aria-label="Remove photo">✕</button>
                </div>
              )}
              <textarea
                className="circ-textarea"
                placeholder={drop?.question ? `Answer it: ${drop.question}` : 'Share something with your circle…'}
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <VoiceRecorder value={audio} onRecorded={setAudio} onClear={() => setAudio('')} />
              <label className="circ-share">
                <input type="checkbox" checked={sharePublic} onChange={e => setSharePublic(e.target.checked)} />
                <span>Share this answer in the <b>public weekly issue</b> — off keeps it just for this circle.</span>
              </label>
              <div className="circ-post-actions">
                <label className="circ-photo-btn">
                  📷 Add your plate
                  <input type="file" accept="image/*" capture="environment" onChange={onPhoto} hidden />
                </label>
                <button className="circ-btn circ-btn-primary" type="submit" disabled={posting}>
                  {posting ? 'POSTING…' : 'ANSWER'}
                </button>
              </div>
            </form>

            {/* Take it offline: once a circle has actually gathered for a while,
                surface the (already-built) hosting kit — the moment the app
                stops being an app. */}
            {meetupUnlocked && (
              <div className="circ-meetup">
                <span className="circ-meetup-kicker">You’ve gathered {weeksTogether} week{weeksTogether !== 1 ? 's' : ''} together</span>
                <p className="circ-meetup-text">
                  You’ve answered enough weeks to know these women. Want to actually meet? The hosting kit
                  splits the cost and the roles so nobody carries the whole thing.
                </p>
                <button type="button" className="circ-btn circ-btn-primary" onClick={() => navigate('/table')}>
                  Plan a first table →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
