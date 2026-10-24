import { useState } from 'react';
import './OnboardingModal.css';

const QUESTS = [
  { title: 'First Check-In', desc: 'Visit a local bodega or grocery store and check in to earn 50 coins.' },
  { title: 'Cook a Recipe', desc: 'Pick a dish from the Social Feed and make it tonight. Share your result!' },
];

export default function OnboardingModal({ boroughs, onComplete }) {
  const [step, setStep] = useState(1);
  const [selectedBorough, setSelectedBorough] = useState(0);

  function handleFinish() {
    const borough = boroughs[selectedBorough];
    localStorage.setItem('dig_in_onboarded', 'true');
    localStorage.setItem('dig_in_home_borough', borough.id);

    // Persist borough preference to backend (fire-and-forget)
    let userId = localStorage.getItem('dig_in_user_id');
    if (!userId) {
      userId = 'u_' + crypto.randomUUID();
      localStorage.setItem('dig_in_user_id', userId);
    }
    fetch('/api/users/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, borough: borough.id }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => {});

    onComplete(selectedBorough);
  }

  return (
    <div className="ob-overlay">
      <div className="ob-card">
        <div className="ob-dots">
          {[1, 2, 3].map(n => (
            <span key={n} className={`ob-dot${step === n ? ' active' : ''}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="ob-screen">
            <h2 className="ob-title">Welcome to Dig In</h2>
            <p className="ob-body">
              Your pixel-art guide to eating well in NYC.
            </p>
            <ul className="ob-features">
              <li>Discover bodegas, groceries &amp; corner stores near you</li>
              <li>Get recipe ideas from what&apos;s already in your pantry</li>
              <li>Earn coins &amp; badges for every check-in and dish you cook</li>
              <li>Follow your neighborhood&apos;s food scene on the Social Feed</li>
            </ul>
            <button className="ob-btn" onClick={() => setStep(2)}>
              Let&apos;s Go →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="ob-screen">
            <h2 className="ob-title">Your Home Borough</h2>
            <p className="ob-body">
              Pick where you&apos;re based. We&apos;ll show your local stores first.
            </p>
            <div className="ob-borough-grid">
              {boroughs.map((b, i) => (
                <button
                  key={b.id}
                  className={`ob-borough-btn${selectedBorough === i ? ' selected' : ''}`}
                  onClick={() => setSelectedBorough(i)}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <div className="ob-nav-row">
              <button className="ob-btn-back" onClick={() => setStep(1)}>← Back</button>
              <button className="ob-btn" onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="ob-screen">
            <h2 className="ob-title">Your First Quest</h2>
            <p className="ob-body">
              Pick one to start earning coins right away:
            </p>
            <div className="ob-quests">
              {QUESTS.map(q => (
                <div key={q.title} className="ob-quest-card">
                  <div>
                    <div className="ob-quest-title">{q.title}</div>
                    <div className="ob-quest-desc">{q.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="ob-nav-row">
              <button className="ob-btn-back" onClick={() => setStep(2)}>← Back</button>
              <button className="ob-btn ob-btn-finish" onClick={handleFinish}>
                Start Digging In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
