import { useState, lazy, Suspense } from 'react';
import Section from './Section';

/* Discover → Flavors — one recipe in eight flavors, and the flavor quiz that
   teaches Nova your taste. Both load only when opened (the recipe demo carries
   the static recipe data). */

const InteractiveHeroRecipe = lazy(() => import('../../components/social/InteractiveHeroRecipe'));
const FlavorQuizModal = lazy(() => import('../../components/you/FlavorQuizModal'));

export default function Flavors() {
  const [showDemo, setShowDemo] = useState(false);
  const [quiz, setQuiz] = useState(false);

  return (
    <Section id="flavors" title="Flavors" sub="Taste is the whole game.">
      <div className="dsc-card">
        <h3 className="dsc-card-title">One recipe, 8 flavors</h3>
        <p className="dsc-text">Pick a flavor and watch a single dish change — the swaps, and what you'd taste.</p>
        <button type="button" className="dsc-btn" aria-expanded={showDemo} onClick={() => setShowDemo((v) => !v)}>
          {showDemo ? 'Hide it' : 'Try it'}
        </button>
        {showDemo && (
          <Suspense fallback={<p className="dsc-text">Loading…</p>}>
            <div className="dsc-embed"><InteractiveHeroRecipe /></div>
          </Suspense>
        )}
      </div>

      <div className="dsc-card">
        <h3 className="dsc-card-title">Flavor quiz</h3>
        <p className="dsc-text">A few quick questions and I'll know what to reach for. Retake it any time.</p>
        <button type="button" className="dsc-btn" onClick={() => setQuiz(true)}>Take the quiz</button>
      </div>

      {quiz && (
        <Suspense fallback={null}>
          <FlavorQuizModal onComplete={() => setQuiz(false)} onSkip={() => setQuiz(false)} />
        </Suspense>
      )}
    </Section>
  );
}
