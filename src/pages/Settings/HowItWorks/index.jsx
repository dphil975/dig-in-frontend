import CloserLook from '../../../components/social/DiscoverPanel/CloserLook';

/* Settings → How it works — the short tour of what Dig In does (it used to be a
   card in the middle of the home feed). */
export default function HowItWorks() {
  return (
    <div className="app-container">
      <div className="profile-page">
        <section className="profile-section">
          <h3 className="section-title">HOW IT WORKS</h3>
          <p className="profile-hint">
            Six cards on what Dig In does and how — pantry scanning included. Tap "Tell me more" on any of them.
          </p>
          <CloserLook />
        </section>
      </div>
    </div>
  );
}
