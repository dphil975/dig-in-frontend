import { createClient } from '@supabase/supabase-js';
import { secureStorage } from './native';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase env vars not set. Auth will not work. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
}

// The auth session (access + refresh tokens) is stored through the platform
// seam: OS-backed secure storage on a device, localStorage on the web. Same
// behavior as before on web; hardened automatically inside a Capacitor shell.
//
// createClient() throws synchronously if supabaseUrl is empty, which would
// crash the whole module graph on import (blank screen, nothing rendered) in
// local dev where .env is left blank. Only construct a real client when
// configured; consumers (useAuth) check isSupabaseConfigured before touching
// `supabase` so a null client here is never dereferenced.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: secureStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
