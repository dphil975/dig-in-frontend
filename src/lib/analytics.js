import posthog from 'posthog-js';

const KEY  = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

// Only initialise when a real key is present (avoids noise in local dev)
if (KEY && KEY !== 'YOUR_KEY') {
  posthog.init(KEY, {
    api_host:         HOST,
    capture_pageview: true,   // auto page-view on every route change
    capture_pageleave: true,
    autocapture:      false,  // we fire events manually for precision
    persistence:      'localStorage',
  });
}

/**
 * Fire a named event with optional properties.
 * Safe to call even before PostHog is initialised.
 */
export function track(event, properties = {}) {
  try {
    posthog.capture(event, properties);
  } catch {}
}

export { posthog };
