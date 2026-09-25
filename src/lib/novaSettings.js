/* novaSettings.js — the Nest customization panel's persisted state.

   Real control over the emotional experience, not the illusion of it. Defaults
   are chosen to protect a fragile new user (Listener tone, Small nest, Rarely
   notified) — the safe version of every dial. */

import { DEFAULT_TONE, DEFAULT_REFRAME } from './novaVoice';

const KEY = 'dig_in_nova_settings';

export const DEFAULTS = {
  tone: DEFAULT_TONE,        // who Nova is
  reframe: DEFAULT_REFRAME,  // how hard she pushes the Phase-3 reframe
  filter: 'all',             // positivity | all | venting
  size: 'small',             // small | medium | large
  notify: 'rarely',          // never | rarely | sometimes | often
  anonymity: 'pseudonymous', // public | pseudonymous | anonymous
  plainLanguage: false,      // simpler sentences, common words — accessible phrasing, off by default
};

export const OPTIONS = {
  filter:    [['positivity', 'Positivity only'], ['all', 'Show all'], ['venting', 'Venting welcome']],
  size:      [['small', 'Small · 10–50'], ['medium', 'Medium · 50–200'], ['large', 'Large · 200+']],
  notify:    [['never', 'Never'], ['rarely', 'Rarely'], ['sometimes', 'Sometimes'], ['often', 'Often']],
  anonymity: [['public', 'Public'], ['pseudonymous', 'Pseudonymous'], ['anonymous', 'Fully anonymous']],
  reframe:   [['gentle', 'Gentle'], ['balanced', 'Balanced'], ['direct', 'Direct']],
};

export function loadSettings() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULTS, ...(v && typeof v === 'object' ? v : {}) };
  } catch { return { ...DEFAULTS }; }
}

export function saveSettings(next) {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}
