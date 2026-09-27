import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import FlavorQuizModal from '../../../components/you/FlavorQuizModal';
import SkinPicker from '../../../components/you/SkinPicker';
import { isSwipeLearningEnabled, setSwipeLearningEnabled } from '../../../lib/flavorProfile';

/* Settings → Account — sign in / out first, then the rest of the "how the app
   is set up for me" controls that used to be scattered down the Profile page:
   the taste quiz, taste learning and appearance. */
export default function Account() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showFlavorQuiz, setShowFlavorQuiz] = useState(false);
  const [swipeLearning, setSwipeLearningState] = useState(isSwipeLearningEnabled);

  const accountName = user?.user_metadata?.username || user?.email || user?.phone || 'your account';

  function toggleSwipeLearning() {
    const next = !swipeLearning;
    setSwipeLearningEnabled(next);
    setSwipeLearningState(next);
  }

  return (
    <>
      <div className="app-container">
        <div className="profile-page">

          <section className="profile-section">
            <h3 className="section-title">ACCOUNT</h3>
            <p className="profile-hint">Signed in as <strong>{accountName}</strong>.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
              <button className="borough-btn" onClick={() => { logout().catch(() => {}); }}>
                Log out
              </button>
              <button className="borough-btn" onClick={() => setShowFlavorQuiz(true)}>
                Retake taste quiz
              </button>
              <button className="borough-btn" onClick={() => navigate('/welcome')}>
                Redo the welcome questions
              </button>
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,.08)' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={swipeLearning}
                  onChange={toggleSwipeLearning}
                  style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                />
                <span>
                  <strong>Let the Discover swipe game update my flavor profile</strong>
                  <p className="profile-hint" style={{ margin: '4px 0 0' }}>
                    Every swipe in the Tinder-style Discover feed nudges what gets recommended to you —
                    liking something pulls recommendations toward it, skipping fast pulls away. Turn this
                    off to swipe and pick recipes without changing your learned taste profile.
                  </p>
                </span>
              </label>
            </div>
          </section>

          {/* How the app looks and reads — skins, the countable-money view,
              and the contrast/motion/text controls. */}
          <section className="profile-section">
            <h3 className="section-title">APPEARANCE</h3>
            <SkinPicker />
          </section>

        </div>
      </div>

      {showFlavorQuiz && (
        <FlavorQuizModal
          onComplete={() => setShowFlavorQuiz(false)}
          onSkip={() => setShowFlavorQuiz(false)}
        />
      )}
    </>
  );
}
