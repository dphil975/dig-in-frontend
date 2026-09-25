import { useAuth } from '../../../hooks/useAuth';
import { isSupabaseConfigured } from '../../../lib/supabase';
import Auth from './Auth';

/* Gate the whole app behind sign-in: a fresh install lands on the account
   screen. If Supabase isn't configured AND we're in local dev (no .env, `vite`
   dev server) we let the app through rather than lock a developer out with no
   way to sign in. A production build with the env still unset does NOT get
   this bypass — silently shipping the entire app with zero auth because
   someone forgot to set VITE_SUPABASE_URL/ANON_KEY on the host is worse than
   a loud, obvious "auth isn't configured" screen. */
export default function AuthGate({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (!isSupabaseConfigured && import.meta.env.DEV) return children;

  if (!isSupabaseConfigured) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column', gap: 12,
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24,
        background: '#12121f', color: '#f0ece2',
        fontFamily: "'Press Start 2P', monospace",
      }}>
        <div style={{ fontSize: 14, color: '#6E8259' }}>DIG&nbsp;IN</div>
        <div style={{ fontSize: 10, lineHeight: 1.8, maxWidth: 420, fontFamily: "'DotGothic16', monospace" }}>
          Auth isn't configured on this deploy — VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
          are missing. Set them on the host and redeploy.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#12121f', color: '#6E8259',
        fontFamily: "'Press Start 2P', monospace", fontSize: 12, letterSpacing: 1,
      }}>
        DIG&nbsp;IN…
      </div>
    );
  }

  return isLoggedIn ? children : <Auth />;
}
