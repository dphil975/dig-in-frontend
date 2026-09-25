import { supabase } from '../lib/supabase';

// The username is stored in auth user metadata (`user_metadata.username`).
// Uniqueness + a server-side language re-check should be enforced by a Postgres
// trigger on the profiles table — the client filter is only for instant feedback.
export async function signUpEmail(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: username ? { username } : undefined },
  });
  if (error) throw error;
  return data; // { user, session } — session is null when email confirmation is required
}

export async function loginEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUpGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Phone auth requires an SMS provider (e.g. Twilio) configured in Supabase.
// Sends a one-time code; pass a username on first sign-up so it lands in metadata.
export async function signUpPhone(phone, username) {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { data: username ? { username } : undefined },
  });
  if (error) throw error;
}

// Verify the SMS code the user typed in; on success they're signed in.
export async function verifyPhoneOtp(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) throw error;
  return data;
}
