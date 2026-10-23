import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { isSupabaseConfigured } from '../../../lib/supabase';
import Auth from './Auth';

/* Gate the whole app behind sign-in. When Supabase isn't configured at all
   (both env vars absent/empty), let the app through with a dismissible banner
   rather than a hard block — this lets the app be previewed and developed
   without credentials while still making the missing config visible. */
export default function AuthGate({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (!isSupabaseConfigured) return (
    <>
      <UnconfiguredBanner />
      {children}
    </>
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F3EADA', color: '#6E8259',
        fontFamily: "'Press Start 2P', monospace", fontSize: 12, letterSpacing: 1,
      }}>
        DIG&nbsp;IN…
      </div>
    );
  }

  return isLoggedIn ? children : <Auth />;
}

function UnconfiguredBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#2a2016', color: '#d4a84b', padding: '10px 16px',
      fontFamily: "'DotGothic16', monospace", fontSize: 12, display: 'flex',
      gap: 12, alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span>Auth not configured — add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to enable sign-in.</span>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', color: '#d4a84b', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
      >×</button>
    </div>
  );
}
