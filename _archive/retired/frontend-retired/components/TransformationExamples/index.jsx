import { useNavigate } from 'react-router-dom';
import './TransformationExamples.css';

/* 4 hardcoded "same base → different cuisine" proofs. The seasonings
   are the highlighted hero — that's the whole transformation. */
const TRANSFORMATIONS = [
  { base: 'Eggs + Tomato + Onion', emoji: 'DISH', before: 'Scrambled eggs',
    after: 'Shakshuka', flag: 'FLAG', cuisine: 'Middle East',
    seasonings: ['cumin', 'paprika', 'harissa'], tone: 'light' },
  { base: 'Chicken + Rice', emoji: 'DISH', before: 'Plain chicken & rice',
    after: 'Biryani', flag: '🇮🇳', cuisine: 'India',
    seasonings: ['garam masala', 'turmeric', 'cardamom'], tone: 'green' },
  { base: 'Ground Beef + Onion', emoji: 'DISH', before: 'Browned beef',
    after: 'Tacos al Pastor', flag: '🇲🇽', cuisine: 'Mexico',
    seasonings: ['cumin', 'chipotle', 'oregano'], tone: 'dark' },
  { base: 'Potato + Garlic', emoji: 'DISH', before: 'Boiled potatoes',
    after: 'Patatas Bravas', flag: '🇪🇸', cuisine: 'Spain',
    seasonings: ['smoked paprika', 'cayenne', 'garlic'], tone: 'light' },
];

export default function TransformationExamples() {
  const navigate = useNavigate();
  const go = (e) => { e?.stopPropagation(); navigate('/recipe-cards'); };

  return (
    <section className="transformations">
      <div className="tx-inner">
        <p className="tx-eyebrow">REAL TRANSFORMATIONS</p>
        <h2 className="tx-title">It's all in the <span>seasoning.</span></h2>

        <div className="tx-grid">
          {TRANSFORMATIONS.map(t => (
            <article className="tx-card" key={t.base} onClick={go}>
              <div className="tx-card-head">
                <span className="tx-base">{t.base}</span>
                <span className="tx-emoji">{t.emoji}</span>
              </div>

              <div className="tx-body">
                <div className="tx-flow">
                  <div className="tx-step">
                    <span className="tx-step-label">BEFORE</span>
                    <span className="tx-step-name">{t.before}</span>
                  </div>
                  <span className="tx-arrow-mid">→</span>
                  <div className="tx-step">
                    <span className="tx-step-label">AFTER</span>
                    <span className="tx-step-name">{t.after} {t.flag}</span>
                    <span className="tx-cuisine">{t.cuisine}</span>
                  </div>
                </div>

                <div className="tx-seasonings">
                  {t.seasonings.map(s => <span className="tx-seasoning" key={s}>+ {s}</span>)}
                </div>
              </div>

              <button className="tx-go" aria-label="Explore recipes" onClick={go}>→</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
