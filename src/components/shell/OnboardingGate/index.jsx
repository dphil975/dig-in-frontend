import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { needsOnboarding, beginOnboarding } from '../../../lib/personalization/onboarding';

/* Sends a brand-new account to /welcome (the madlib questions) the first time
   it's signed in — wherever it happened to land. Renders nothing.

   Once per session: after that first redirect the user isn't trapped (they can
   skip from /welcome), and Home's own "not onboarded → /welcome" check keeps
   catching them until they finish or skip. */
const PROMPTED = 'dig_in_onboarding_prompted';

export default function OnboardingGate() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || pathname === '/welcome') return;
    try { if (sessionStorage.getItem(PROMPTED) === user.id) return; } catch { /* ignore */ }
    if (!needsOnboarding(user)) return;
    try { sessionStorage.setItem(PROMPTED, user.id); } catch { /* ignore */ }
    beginOnboarding();
    navigate('/welcome', { replace: true });
  }, [user, pathname, navigate]);

  return null;
}
