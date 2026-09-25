/* sponsorships.js — click tracking + referral-link wrapping for the
   Referral Shoutout system (see src/data/sponsorships.js for the config and
   why it ships empty).

   Two real, honest signals, no fabricated numbers:
     1. A local click log (localStorage) — the same "durable local counter"
        pattern checkinService/photoMissionEngine already use, so a founder
        checking their own device sees real numbers immediately.
     2. A real PostHog event via lib/analytics.js's track() — the same
        events pipeline the rest of the app already wires through, so this
        shows up in the same dashboard as everything else instead of a
        second parallel one. track() safely no-ops if PostHog isn't
        configured (see analytics.js), same as every other call site. */

import { track } from './analytics';

const CLICK_LOG_KEY = 'dig_in_sponsor_clicks';

function loadClicks() {
  try { return JSON.parse(localStorage.getItem(CLICK_LOG_KEY) || '[]'); } catch { return []; }
}
function saveClicks(list) {
  try { localStorage.setItem(CLICK_LOG_KEY, JSON.stringify(list.slice(-500))); } catch { /* quota */ }
}

/** Record a real click on a sponsor's referral link — call this before
    opening the link, not after (the tab may never come back to fire an
    "after" event). Returns the click record for the caller's own use. */
export function recordSponsorClick({ id, placement }) {
  const entry = { id, placement, at: Date.now() };
  saveClicks([...loadClicks(), entry]);
  track('sponsor_click', { sponsor_id: id, placement });
  return entry;
}

/** Real local click counts, e.g. for a future "sponsor performance" view —
    not shown anywhere yet, but the data is honest and ready. */
export function clickCountFor(sponsorId) {
  return loadClicks().filter(c => c.id === sponsorId).length;
}

/** Wraps a referral URL with a ref + click-id param for attribution, without
    touching whatever query params the brand's own link already has. */
export function buildReferralLink(sponsor) {
  try {
    const url = new URL(sponsor.referralUrl);
    url.searchParams.set('ref', 'digin');
    url.searchParams.set('digin_click', `${sponsor.id}-${Date.now()}`);
    return url.toString();
  } catch {
    return sponsor.referralUrl; // malformed URL in config — fail open, don't crash the card
  }
}
