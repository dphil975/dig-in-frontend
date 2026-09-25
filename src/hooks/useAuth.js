import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { signUpEmail, loginEmail, signUpPhone, verifyPhoneOtp, signUpGoogle, logout } from '../services/authService';
import { pullAndMerge } from '../lib/syncService';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // AuthGate lets the app through unconfigured (no .env), but this hook still
    // runs (Rules of Hooks) — skip touching the null `supabase` client here.
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Re-sync on sign-in so the user sees their cross-device data immediately
      if (event === 'SIGNED_IN') pullAndMerge();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    isLoggedIn: !!user,
    signUpEmail,
    loginEmail,
    signUpPhone,
    verifyPhoneOtp,
    signUpGoogle,
    logout,
  };
}
