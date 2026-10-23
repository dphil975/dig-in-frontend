/* Signup onboarding — who still owes the welcome "madlib" questions, and where
   the answers go.

   The old gate was one per-browser flag (`dig_in_onboarded`) that only Home
   checked: someone who signed up on a browser where a previous person had
   finished it skipped the questions, and someone who landed on /recipes after
   signing up never saw them. Now:

     · a sign-up marks the browser (`flagNewSignup`) and OnboardingGate sends
       the new account to /welcome the first time it's signed in;
     · "done" is remembered per account (`dig_in_onboarded_uid`), so a second
       person on the same browser still gets their own questions;
     · the answers are saved and applied to the SAME stores Settings edits
       (allergy profile, season of life, home borough / ZIP) — the account
       starts with its settings already filled in.

   All localStorage; nothing here calls a server. */

import { LIFE_MODES, setLifeMode } from './lifeMode';
import { guessLocation, guessSnap, guessWic } from '../pantry/pantryTools';
import { seedFlavorProfile } from '../flavor/flavorProfile';

const K_NEEDS = 'dig_in_needs_onboarding';   // '1' once a sign-up was submitted here
const K_DONE = 'dig_in_onboarded';           // legacy boolean Home / Welcome already use
const K_DONE_UID = 'dig_in_onboarded_uid';   // the account that finished on this device
const K_ANSWERS = 'dig_in_onboarding_answers';

const DAY_MS = 86400000;
const FIRST_SIGN_IN_WINDOW_MS = 2 * 60 * 1000;
const FLAG_MAX_ACCOUNT_AGE_MS = 7 * DAY_MS;

export function flagNewSignup() {
  try { localStorage.setItem(K_NEEDS, '1'); } catch { /* quota */ }
}
export function clearSignupFlag() {
  try { localStorage.removeItem(K_NEEDS); } catch { /* ignore */ }
}

/** Should this signed-in account be sent through the welcome questions? */
export function needsOnboarding(user) {
  if (!user?.id) return false;
  try {
    if (localStorage.getItem(K_DONE_UID) === user.id) return false;

    const created = Date.parse(user.created_at);
    const last = Date.parse(user.last_sign_in_at);

    // A sign-up was submitted in this browser — but only trust that for a
    // young account, so a stray flag can't drag an old account into it.
    if (localStorage.getItem(K_NEEDS) === '1'
        && Number.isFinite(created) && Date.now() - created < FLAG_MAX_ACCOUNT_AGE_MS) return true;

    // First sign-in ever (covers Google, and confirm-email links opened here).
    return Number.isFinite(created) && Number.isFinite(last)
      && Math.abs(last - created) < FIRST_SIGN_IN_WINDOW_MS;
  } catch { return false; }
}

/** Home also checks the legacy flag — reset it so a new account can't inherit
    the previous person's "already onboarded" on a shared browser. */
export function beginOnboarding() {
  try { localStorage.removeItem(K_DONE); } catch { /* ignore */ }
}

export function markOnboarded(user) {
  try {
    localStorage.setItem(K_DONE, '1');
    if (user?.id) localStorage.setItem(K_DONE_UID, user.id);
    localStorage.removeItem(K_NEEDS);
  } catch { /* quota */ }
}

/** The four-quadrant read of the madlib: solo/shared × daily/special.
    nova = solo daily · family = shared daily · celebration = solo special ·
    crowd = shared special. Stored so the Recipes quadrants can start from it. */
export function quadrantFor({ people = '', reason = '' } = {}) {
  const shared = /two|family|crowd|someone new/i.test(people);
  const special = /celebrat|love/i.test(reason);
  if (shared) return special ? 'crowd' : 'family';
  return special ? 'celebration' : 'nova';
}

export function saveAnswers(answers) {
  try {
    localStorage.setItem(K_ANSWERS, JSON.stringify({ ...answers, quadrant: quadrantFor(answers), at: Date.now() }));
  } catch { /* quota */ }
}
export function getAnswers() {
  try { return JSON.parse(localStorage.getItem(K_ANSWERS) || 'null'); } catch { return null; }
}

/** Write the answers into the stores Settings reads. Every field is optional —
    a skipped question simply leaves that setting alone. */
export async function applyAnswersToProfile(a = {}) {
  // Flavor palette → seed the 8-flavor profile so Nova's first picks feel
  // personal instead of random. Uses the same seedFlavorProfile() the flavor
  // quiz in Settings uses, so this answer merges cleanly with later signals.
  const flavorPicks = Array.isArray(a.flavor) ? a.flavor : [];
  if (flavorPicks.length) {
    try { seedFlavorProfile(flavorPicks); } catch { /* quota */ }
  }

  // Cuisine preferences → saved to answers for the pick algorithm to read.
  // The cuisines are stored in the answers object (already written by saveAnswers)
  // and read by loadNovaContext → getAnswers() in pick.js.

  // Dietary → Settings → Dietary preferences (the allergy profile). Loaded on
  // demand: this file is imported by the always-mounted OnboardingGate, and the
  // allergy engine isn't needed until someone actually has answers to apply.
  const dietary = Array.isArray(a.dietary) ? a.dietary : [];
  if (dietary.length) {
    try {
      const { setAllergenStatus } = await import('../health/allergyProfile');
      for (const id of dietary) setAllergenStatus(id, 'allergy');
    } catch { /* ignore */ }
  }

  // Life context → Settings → Life context (the same "season" the sidebar sets).
  if (a.life && LIFE_MODES[a.life]) {
    try {
      setLifeMode(a.life);
      window.dispatchEvent(new Event('dig_in_lifemode'));
    } catch { /* ignore */ }
  }

  // Location → Settings → Location: a 5-digit ZIP, or a borough id / free text.
  if (a.place) {
    try {
      if (/^\d{5}$/.test(a.place)) localStorage.setItem('dig_in_zip', a.place);
      else localStorage.setItem('dig_in_home_borough', a.place);
    } catch { /* quota */ }
  }

  // Receipt → Virtual Pantry seed.
  // Items from a scanned/pasted receipt are written straight into the pantry
  // (not the "deciding" tray) so the user's first session has real data. The
  // trip record goes into dig_in_receipts so the store appears in store history.
  const receiptItems = Array.isArray(a.receiptItems) ? a.receiptItems : [];
  if (receiptItems.length) {
    try {
      const now = Date.now();
      const boughtAt = a.receiptDate
        ? new Date(`${a.receiptDate}T12:00:00`).toISOString()
        : new Date().toISOString();
      const tripId = now;
      const pantryItems = receiptItems.map((it, idx) => ({
        id: now + idx,
        name: it.name,
        price: it.price ?? null,
        location: guessLocation(it.name),
        snap: guessSnap(it.name),
        wic: guessWic(it.name),
        at: new Date().toISOString(),
        boughtAt,
        fromReceipt: true,
        store: a.receiptStore || null,
        tripId,
      }));

      const existingPantry = (() => {
        try { return JSON.parse(localStorage.getItem('dig_in_pantry') || '[]'); } catch { return []; }
      })();
      localStorage.setItem('dig_in_pantry', JSON.stringify([...pantryItems, ...existingPantry]));

      const trip = {
        id: tripId,
        store: a.receiptStore || 'Unknown store',
        address: null,
        date: a.receiptDate || null,
        time: null,
        total: a.receiptTotal ?? (receiptItems.reduce((s, i) => s + (i.price || 0), 0) || null),
        itemCount: receiptItems.length,
        items: receiptItems.map(i => i.name),
        attachment: a.receiptPhoto ? { dataUrl: a.receiptPhoto } : null,
        importedAt: new Date().toISOString(),
        fromOnboarding: true,
      };
      const existingReceipts = (() => {
        try { return JSON.parse(localStorage.getItem('dig_in_receipts') || '[]'); } catch { return []; }
      })();
      localStorage.setItem('dig_in_receipts', JSON.stringify([trip, ...existingReceipts]));
    } catch { /* quota — pantry write is best-effort during onboarding */ }
  }
}
