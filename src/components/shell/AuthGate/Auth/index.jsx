import { useState } from 'react';
import {
  signUpEmail, loginEmail, signUpPhone, verifyPhoneOtp, signUpGoogle,
} from '../../../../services/authService';
import { validateUsername, validatePassword, getPasswordChecks, PASSWORD_RULES } from '../../../../lib/authValidation';
import { flagNewSignup, clearSignupFlag } from '../../../../lib/personalization/onboarding';
import './Auth.css';

/* The app's home-screen login. Shown by AuthGate whenever no one is signed in,
   so a fresh install is greeted with "create an account". Supports Google,
   email + password, and phone (SMS one-time code). */
export default function Auth() {
  const [mode, setMode]       = useState('signup');   // 'signup' | 'login'
  const [method, setMethod]   = useState('email');    // 'email' | 'phone'
  const [step, setStep]       = useState('form');     // 'form' | 'otp' | 'check-email'

  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState('');

  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState(null);

  const isSignup = mode === 'signup';
  const pwChecks = getPasswordChecks(password, { username });

  function switchMode(next) {
    setMode(next);
    setStep('form');
    setError(null);
    setPassword('');
    setOtp('');
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try { await signUpGoogle(); }        // redirects out; AuthGate closes on return
    catch (e) { setError(e.message || 'Google sign-in failed.'); setBusy(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Sign-up gets the full username + password gauntlet.
    if (isSignup) {
      const uErr = validateUsername(username);
      if (uErr) { setError(uErr); return; }
      if (method === 'email') {
        const pErr = validatePassword(password, { username });
        if (pErr) { setError(pErr); return; }
      }
    }

    setBusy(true);
    // A sign-up owes the welcome questions — mark it before the session lands so
    // the OnboardingGate sees it; undone below if the sign-up fails.
    if (isSignup) flagNewSignup();
    try {
      if (method === 'phone') {
        await signUpPhone(phone.trim(), isSignup ? username.trim() : undefined);
        setStep('otp');                  // now collect the SMS code
      } else if (isSignup) {
        const { session } = await signUpEmail(email.trim(), password, username.trim());
        if (!session) setStep('check-email'); // email confirmation required
        // if session exists, onAuthStateChange (AuthGate) drops us into the app
      } else {
        await loginEmail(email.trim(), password);
      }
    } catch (err) {
      if (isSignup) clearSignupFlag();
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await verifyPhoneOtp(phone.trim(), otp.trim());
      // success → AuthGate closes via onAuthStateChange
    } catch (err) {
      setError(err.message || 'That code didn’t work. Try again.');
    } finally {
      setBusy(false);
    }
  }

  // ── "Check your email" confirmation screen ──
  if (step === 'check-email') {
    return (
      <div className="auth-screen">
        <div className="auth-card auth-centered">
          <div className="auth-logo">DIG&nbsp;IN</div>
          <div className="auth-emoji">MAIL</div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-sub">We sent a confirmation link to <strong>{email}</strong>. Tap it to finish creating your account.</p>
          <button className="auth-link-btn" onClick={() => switchMode('login')}>Back to log in</button>
        </div>
      </div>
    );
  }

  // ── SMS code entry ──
  if (step === 'otp') {
    return (
      <div className="auth-screen">
        <form className="auth-card auth-centered" onSubmit={handleVerifyOtp}>
          <div className="auth-logo">DIG&nbsp;IN</div>
          <div className="auth-emoji">CODE</div>
          <h1 className="auth-title">Enter the code</h1>
          <p className="auth-sub">We texted a 6-digit code to <strong>{phone}</strong>.</p>
          <input
            className="auth-input auth-otp" inputMode="numeric" autoComplete="one-time-code"
            placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
          />
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-primary" type="submit" disabled={busy || otp.length < 4}>
            {busy ? 'Verifying…' : 'Verify & continue'}
          </button>
          <button type="button" className="auth-link-btn" onClick={() => { setStep('form'); setOtp(''); setError(null); }}>
            ← Use a different number
          </button>
        </form>
      </div>
    );
  }

  // ── Main sign-up / log-in form ──
  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">DIG&nbsp;IN</div>
        <h1 className="auth-title">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-sub">
          {isSignup ? 'One account to save recipes, check in at stores, and earn coins.' : 'Log in to pick up where you left off.'}
        </p>

        <div className="auth-tabs">
          <button type="button" className={`auth-tab${isSignup ? ' on' : ''}`} onClick={() => switchMode('signup')}>Sign up</button>
          <button type="button" className={`auth-tab${!isSignup ? ' on' : ''}`} onClick={() => switchMode('login')}>Log in</button>
        </div>

        <button type="button" className="auth-google" onClick={handleGoogle} disabled={busy}>
          <span className="auth-g">G</span> Continue with Google
        </button>

        <div className="auth-or"><span>or</span></div>

        <div className="auth-method">
          <button type="button" className={`auth-method-btn${method === 'email' ? ' on' : ''}`} onClick={() => { setMethod('email'); setError(null); }}>Email</button>
          <button type="button" className={`auth-method-btn${method === 'phone' ? ' on' : ''}`} onClick={() => { setMethod('phone'); setError(null); }}>Phone</button>
        </div>

        {isSignup && (
          <label className="auth-field">
            <span className="auth-label">Username</span>
            <input
              className="auth-input" value={username} autoCapitalize="none" autoCorrect="off"
              onChange={e => setUsername(e.target.value)} placeholder="digin_chef" maxLength={20}
            />
          </label>
        )}

        {method === 'email' ? (
          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              className="auth-input" type="email" value={email} autoCapitalize="none"
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
            />
          </label>
        ) : (
          <label className="auth-field">
            <span className="auth-label">Phone</span>
            <input
              className="auth-input" type="tel" value={phone}
              onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" required
            />
          </label>
        )}

        {method === 'email' && (
          <label className="auth-field">
            <span className="auth-label">Password</span>
            <input
              className="auth-input" type="password" value={password} autoComplete={isSignup ? 'new-password' : 'current-password'}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••• " required
            />
          </label>
        )}

        {/* Live password rule checklist — sign-up + email only */}
        {isSignup && method === 'email' && password.length > 0 && (
          <ul className="auth-rules">
            {PASSWORD_RULES.map(r => (
              <li key={r.key} className={pwChecks[r.key] ? 'ok' : ''}>
                <span className="auth-rule-mark">{pwChecks[r.key] ? '✓' : '○'}</span>{r.label}
              </li>
            ))}
          </ul>
        )}

        {error && <div className="auth-error">{error}</div>}

        <button className="auth-primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : method === 'phone' ? 'Send code' : isSignup ? 'Create account' : 'Log in'}
        </button>

        <p className="auth-fine">
          By continuing you agree to Dig In’s Terms & Privacy Policy.
        </p>
      </form>
    </div>
  );
}
