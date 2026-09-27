import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from './Section';
import PostComposer from './PostComposer';
import { OPEN_QUESTIONS, goToQuestion } from '../../lib/social/openQuestions';

/* Discover → Community — open questions, tag hubs, and The Table. The post
   composer that used to sit at the top of the home feed lives here now ("Share a
   tip"): what people write shows up in the community feed and in Safety's tips. */

const STARTER_TAGS = ['#under5', '#girldinner', '#onepan', '#15min', '#fridgeraid', '#swaps', '#batchcook', '#cookingforone'];

function followedTags() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_followed_tags') || '[]'); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

export default function Community({ composing, onCompose, onDoneComposing }) {
  const navigate = useNavigate();
  const [posted, setPosted] = useState(false);
  const followed = followedTags();
  const tags = [...followed, ...STARTER_TAGS.filter((t) => !followed.includes(t))];

  return (
    <Section id="community" title="Community" sub="Questions to chew on, tags to follow, and a seat at The Table.">
      <div>
        <p className="dsc-kicker">Open questions</p>
        <ul className="dsc-list">
          {OPEN_QUESTIONS.map((q) => (
            <li key={q.q}>
              <button type="button" className="dsc-question" onClick={() => goToQuestion(q.q, q.to, navigate)}>
                <span>{q.q}</span>
                <span className="dsc-question-go" aria-hidden="true">answer →</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="dsc-kicker">Tag hubs</p>
        <div className="dsc-chips">
          {tags.map((t) => (
            <button key={t} type="button" className={`dsc-chip${followed.includes(t) ? ' active' : ''}`} onClick={() => navigate(`/tag/${encodeURIComponent(t)}`)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="dsc-actions">
        <button type="button" className="dsc-btn" onClick={() => navigate('/table')}>Pull up to The Table →</button>
        <button type="button" className="dsc-btn dsc-btn-quiet" onClick={() => navigate('/feed')}>Read the community feed →</button>
        {!composing && <button type="button" className="dsc-btn dsc-btn-quiet" onClick={onCompose}>Share a tip</button>}
      </div>

      {composing && (
        <PostComposer
          onPublished={() => { setPosted(true); onDoneComposing(); }}
          onCancel={onDoneComposing}
        />
      )}
      {posted && !composing && <p className="dsc-text">Posted — it's in the community feed now.</p>}
    </Section>
  );
}
