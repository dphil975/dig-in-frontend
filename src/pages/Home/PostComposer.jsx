import { useState } from 'react';
import { publishUserPost, tagsFromInput, MAX_BODY, MAX_QUICK_BODY, MAX_STEPS } from '../../lib/userPosts';

/* PostComposer — the feed's text posts, two modes.

   Opens inline at the top of the column (Tumblr's text-post box, not a separate
   page). Two ways to post, and QUICK is the default: most of the time writing a
   whole newsletter-length piece is too much friction for "here's what I made
   tonight" — the Twitter half of this app's Twitter+Tumblr hybrid needs a real
   one-line option, not just the long-form write-up as the only door in.

     QUICK    one short textarea, no title, MAX_QUICK_BODY (240) — a tweet.
     WRITE-UP the original: title + long body (MAX_BODY, 4000) + an optional
              numbered METHOD, the same step-by-step shape recipe cards use.
              Unchanged from before this mode toggle existed — still there for
              an actual newsletter-length piece, just no longer the only option.

   Both publish through the same lib/userPosts + the same WriteupPost card in
   PostTypes.jsx, which already renders a short, title-less body cleanly (see
   that file — BODY_PREVIEW is 360, so a 240-char quick post never even hits
   the "keep reading" affordance). Steps are one-per-line in write-up mode:
   honest and fast to edit, and they render as the numbered method on the card. */

export default function PostComposer({ onPublished, onCancel }) {
  const [mode, setMode] = useState('quick');   // 'quick' | 'writeup'
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [author, setAuthor] = useState(() => {
    try { return localStorage.getItem('dig_in_handle') || ''; } catch { return ''; }
  });

  const quick = mode === 'quick';
  const cap = quick ? MAX_QUICK_BODY : MAX_BODY;
  const steps = quick ? [] : stepsText.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, MAX_STEPS);
  const tags = tagsFromInput(tagsText);
  const canPublish = quick
    ? body.trim().length > 0
    : title.trim().length > 0 && (body.trim().length > 0 || steps.length > 0);

  function switchMode(next) {
    setMode(next);
    if (next === 'quick') setBody((b) => b.slice(0, MAX_QUICK_BODY));
  }

  function publish() {
    if (!canPublish) return;
    const handle = author.trim();
    if (handle) { try { localStorage.setItem('dig_in_handle', handle); } catch { /* ignore */ } }
    const post = publishUserPost({ title, body, steps, tags, author: handle, quick });
    onPublished?.(post);
  }

  return (
    <div className="composer">
      <div className="composer-head">
        <span className="composer-title">{quick ? '→ Quick post' : '✎ Write a post'}</span>
        <button type="button" className="composer-x" onClick={onCancel} aria-label="Close">✕</button>
      </div>

      <div className="composer-modes" role="tablist">
        <button type="button" role="tab" aria-selected={quick} className={`composer-mode${quick ? ' active' : ''}`} onClick={() => switchMode('quick')}>
          Quick — one line
        </button>
        <button type="button" role="tab" aria-selected={!quick} className={`composer-mode${!quick ? ' active' : ''}`} onClick={() => switchMode('writeup')}>
          Write-up — a whole piece
        </button>
      </div>

      {quick ? (
        <p className="composer-hint">What's cooking? Short and fast — like a tweet.</p>
      ) : (
        <p className="composer-hint">A write-up in the larger square — a title, your words, and an optional numbered method, the same steps a recipe card shows.</p>
      )}

      {!quick && (
        <input
          className="composer-input composer-titlefield"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title — e.g. The Sunday braise that saved my week"
          maxLength={120}
        />
      )}

      <textarea
        className={`composer-input ${quick ? 'composer-quickfield' : 'composer-bodyfield'}`}
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, cap))}
        placeholder={quick
          ? 'The kimchi fried rice actually worked this time.'
          : 'Write it out. What you made, why, how it went — the whole story, like a little newsletter.'}
        rows={quick ? 2 : 6}
      />
      <span className="composer-count">{body.length}/{cap}</span>

      {!quick && (
        <>
          <label className="composer-label">Method <span>(optional · one step per line)</span></label>
          <textarea
            className="composer-input composer-stepsfield"
            value={stepsText}
            onChange={(e) => setStepsText(e.target.value)}
            placeholder={'Sear the short ribs on all sides until deep brown.\nSoften the carrots, celery, onion; stir in tomato paste.\nDeglaze with red wine, reduce by half.'}
            rows={4}
          />
          {steps.length > 0 && <span className="composer-count">{steps.length} step{steps.length === 1 ? '' : 's'}</span>}
        </>
      )}

      <div className="composer-row">
        <input
          className="composer-input"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your handle (optional)"
          maxLength={24}
        />
        <input
          className="composer-input"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="tags: braise, sunday, comfort"
        />
      </div>
      {tags.length > 0 && (
        <div className="composer-tagprev">{tags.map((t) => <span key={t} className="composer-tagchip">{t}</span>)}</div>
      )}

      <div className="composer-actions">
        <button type="button" className="composer-cancel" onClick={onCancel}>Cancel</button>
        <button type="button" className="composer-publish" disabled={!canPublish} onClick={publish}>
          {quick ? 'Post' : 'Publish post'}
        </button>
      </div>
    </div>
  );
}
