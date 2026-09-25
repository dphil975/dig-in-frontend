/**
 * Username + password validation for sign-up.
 *
 * Password policy (per product spec):
 *   • at least 9 characters
 *   • at least 1 letter
 *   • at least 1 number
 *   • at least 1 special from  ! @ # $ % ^ & *
 *   • no blocked language (profanity / slurs)
 *   • not weak/guessable, and not derived from the username
 *
 * Username policy:
 *   • 3–20 chars, letters/numbers/underscore
 *   • no blocked language (profanity / slurs)
 */

import { containsBannedWord } from './wordFilter';

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const SPECIALS_RE = /[!@#$%^&*]/;

/** A small set of obviously-guessable passwords to reject outright. */
const COMMON_PASSWORDS = new Set([
  'password1!', 'password123', 'qwerty123!', 'letmein123', 'welcome123',
  'admin1234!', 'iloveyou1!', 'password!1', 'abc123456', 'passw0rd!',
]);

/** Returns an error string, or null if the username is valid. */
export function validateUsername(name) {
  const v = (name || '').trim();
  if (!v) return 'Username is required.';
  if (!USERNAME_RE.test(v)) return 'Use 3–20 letters, numbers, or underscores.';
  if (containsBannedWord(v)) return 'That username contains blocked language.';
  return null;
}

function isSequential(s) {
  if (s.length < 4) return false;
  let asc = true, desc = true;
  for (let i = 1; i < s.length; i++) {
    const d = s.charCodeAt(i) - s.charCodeAt(i - 1);
    if (d !== 1) asc = false;
    if (d !== -1) desc = false;
  }
  return asc || desc;
}

/** True if the password is low-entropy / predictable even when it meets the rules. */
function isWeakPassword(pw) {
  const low = pw.toLowerCase();
  if (COMMON_PASSWORDS.has(low)) return true;
  if (new Set(pw).size < 5) return true;          // too few distinct characters
  if (/(.)\1\1/.test(pw)) return true;            // 3+ of the same char in a row
  if (isSequential(low.replace(/[^a-z0-9]/g, ''))) return true; // 1234 / abcd runs
  return false;
}

/**
 * Per-rule booleans, for a live checklist in the UI.
 * `username` is optional; when given, we also verify the password isn't just the name.
 */
export function getPasswordChecks(pw, { username } = {}) {
  const p = pw || '';
  const name = (username || '').trim().toLowerCase();
  return {
    length:  p.length >= 9,
    letter:  /[A-Za-z]/.test(p),
    number:  /[0-9]/.test(p),
    special: SPECIALS_RE.test(p),
    clean:   p.length > 0 && !containsBannedWord(p),
    strong:  p.length > 0 && !isWeakPassword(p),
    noName:  !name || (p.length > 0 && !p.toLowerCase().includes(name)),
  };
}

/** Returns an error string, or null if the password satisfies every rule. */
export function validatePassword(pw, opts = {}) {
  const c = getPasswordChecks(pw, opts);
  if (!c.length)  return 'Password must be at least 9 characters.';
  if (!c.letter)  return 'Add at least one letter.';
  if (!c.number)  return 'Add at least one number.';
  if (!c.special) return 'Add one special character (!@#$%^&*).';
  if (!c.clean)   return 'Password contains blocked language.';
  if (!c.noName)  return 'Password can’t contain your username.';
  if (!c.strong)  return 'That password is too common or predictable — mix it up.';
  return null;
}

export const PASSWORD_RULES = [
  { key: 'length',  label: 'At least 9 characters' },
  { key: 'letter',  label: 'A letter' },
  { key: 'number',  label: 'A number' },
  { key: 'special', label: 'A special character (!@#$%^&*)' },
  { key: 'strong',  label: 'Not common or predictable' },
];
