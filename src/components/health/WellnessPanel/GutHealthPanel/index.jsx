import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  gutProfile, gutSwapsFor, GUT_HEALTH_DISCLAIMER, GUT_HEALTH_TOPICS, GUT_HEALTH_LEARN_ORDER,
} from '../../../../lib/gutHealth';
import { flaggedAllergensInRecipe } from '../../../../lib/allergyProfile';
import './GutHealthPanel.css';

/* GutHealthPanel — the real science behind "gut friendly," not the buzzword:
   fermented/fiber/polyphenol signals actually found in THIS recipe, a
   plant-diversity count, high-FODMAP flags (informational, not a warning —
   only relevant to IBS/SIBO), and anything working against gut health.

   Two things this session's earlier panels didn't have that this one adds:
   1. A real "what makes food gut-friendly?" education accordion, built
      straight from GUT_HEALTH_TOPICS (the same source Ask Nova answers
      from) so the panel and the chatbot can't say different things.
   2. Swap options you can click to reveal the actual gut-health reasoning
      for THAT specific choice — "educated by the choice you're making,"
      not just a name to swap in. */

const LEARN_TOPICS = GUT_HEALTH_LEARN_ORDER
  .map(id => GUT_HEALTH_TOPICS.find(t => t.id === id))
  .filter(Boolean);

export default function GutHealthPanel({ ingredients }) {
  const navigate = useNavigate();
  const [learnOpen, setLearnOpen] = useState(false);
  const [openTopic, setOpenTopic] = useState(null);
  const [revealedSwap, setRevealedSwap] = useState(null);

  const profile = useMemo(() => gutProfile(ingredients), [ingredients]);
  const gutSwaps = useMemo(() => gutSwapsFor(ingredients), [ingredients]);
  const flaggedAllergens = useMemo(() => flaggedAllergensInRecipe(ingredients), [ingredients]);

  const hasSignal = profile && (
    profile.fermented.length || profile.fiber.length || profile.polyphenols.length
    || profile.disruptors.length || profile.highFodmap.length || profile.plantCount > 0
  );
  if (!ingredients?.length || !hasSignal) return null;

  return (
    <section className="ghp">
      <div className="ghp-head">
        <div className="ghp-title">
          GUT HEALTH{profile.isGutFriendly ? <span className="ghp-badge">GUT-FRIENDLY</span> : null}
        </div>
        <button type="button" className="ghp-learn-toggle" onClick={() => setLearnOpen(o => !o)}>
          {learnOpen ? 'Hide the science' : 'What makes food gut-friendly? →'}
        </button>
      </div>

      {learnOpen && (
        <div className="ghp-learn">
          {LEARN_TOPICS.map(t => (
            <div className="ghp-learn-item" key={t.id}>
              <button
                type="button"
                className="ghp-learn-q"
                onClick={() => setOpenTopic(o => (o === t.id ? null : t.id))}
              >
                <span className="ghp-learn-caret">{openTopic === t.id ? '▾' : '▸'}</span> {t.title}
              </button>
              {openTopic === t.id && <p className="ghp-learn-a">{t.answer}</p>}
            </div>
          ))}
          <p className="ghp-disclaimer">{GUT_HEALTH_DISCLAIMER}</p>
        </div>
      )}

      <div className="ghp-signals">
        {profile.fermented.length > 0 && (
          <SignalGroup label="FERMENTED / LIVE CULTURES" items={profile.fermented} tone="good" />
        )}
        {profile.fiber.length > 0 && (
          <SignalGroup label="FIBER SOURCES" items={profile.fiber} tone="good" />
        )}
        {profile.polyphenols.length > 0 && (
          <SignalGroup label="POLYPHENOLS / PREBIOTICS" items={profile.polyphenols} tone="good" />
        )}
        {profile.plantCount > 0 && (
          <div className="ghp-diversity">
            <strong>{profile.plantCount}</strong> distinct plant ingredient{profile.plantCount === 1 ? '' : 's'} in
            this dish — one building block toward the real "30 plants a week" diversity research (see the science above).
          </div>
        )}
        {profile.disruptors.length > 0 && (
          <SignalGroup label="MAY WORK AGAINST GUT HEALTH" items={profile.disruptors} tone="caution" />
        )}
        {profile.highFodmap.length > 0 && (
          <div className="ghp-signal-group ghp-info">
            <div className="ghp-signal-label">HIGH-FODMAP — only relevant if you have IBS or SIBO</div>
            <div className="ghp-fodmap-chips">
              {profile.highFodmap.map(f => <span className="ghp-fodmap-chip" key={f.id}>{f.label}</span>)}
            </div>
          </div>
        )}
      </div>

      {flaggedAllergens.length > 0 && (
        <div className="ghp-allergy-note">
          <span>
            This recipe contains {flaggedAllergens.map(a => a.label.toLowerCase()).join(', ')} — flagged in your
            allergy profile. Some gut-friendly picks above (fermented dairy, wheat sourdough, soy-based tempeh/miso)
            commonly overlap with major allergens.
          </span>
          <button type="button" className="ghp-allergy-link" onClick={() => navigate('/allergies')}>
            See your allergy profile →
          </button>
        </div>
      )}

      {gutSwaps.length > 0 && (
        <div className="ghp-swaps">
          <div className="ghp-swaps-title">MAKE THIS MORE GUT-FRIENDLY</div>
          <p className="ghp-swaps-sub">Tap an option to see the real reasoning behind it — not every swap here is actually a gut-health upgrade.</p>
          {gutSwaps.map(s => (
            <div className="ghp-swap-row" key={s.type}>
              <div className="ghp-swap-label">{s.label} →</div>
              <div className="ghp-swap-options">
                {s.options.map(o => (
                  <button
                    type="button"
                    key={o.id}
                    className={`ghp-swap-opt${revealedSwap === o.id ? ' active' : ''}`}
                    onClick={() => setRevealedSwap(r => (r === o.id ? null : o.id))}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {s.options.filter(o => revealedSwap === o.id).map(o => (
                <p className="ghp-swap-note" key={o.id}>{o.gutNote}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SignalGroup({ label, items, tone }) {
  return (
    <div className={`ghp-signal-group ghp-${tone}`}>
      <div className="ghp-signal-label">{label}</div>
      {items.map(f => (
        <div className="ghp-signal-row" key={f.id}>
          <span className="ghp-signal-name">{f.label}</span>
          <span className="ghp-signal-note">{f.note}</span>
        </div>
      ))}
    </div>
  );
}
