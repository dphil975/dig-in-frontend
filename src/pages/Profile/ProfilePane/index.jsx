/* The shared page shell for a Profile tab — the same app-container +
   profile-page wrapper the old single Profile page used, so the existing global
   styles (styles/styles.css) keep applying to every tab. */
export default function ProfilePane({ children }) {
  return (
    <div className="app-container">
      <div className="profile-page">{children}</div>
    </div>
  );
}
