# Dig In — App Readiness Plan
### Prioritized Next Steps · June 2026

---

## What I Found: Honest Audit

After reviewing every page, service, and backend file, here's the real state of the app:

**Working & solid:**
- Static recipe browsing (JSON data is rich — hundreds of global recipes)
- Leaflet map with grocery store markers
- Pixel Creator (canvas, palettes, outfits)
- Gamification logic (check-ins, coins, streaks, badges) — works, but only per-device
- Nav (hamburger, dropdowns, coin counter)
- Craving Compass, Deals, Catalog, CookingScience, EducationalHelper
- Recipe cards, recipe AI sample flows
- Profile page

**Broken or fake right now:**
- Auth — `signUpGoogle()` is a `setTimeout` that returns hardcoded fake data. No real login exists.
- Social Feed — generates random fake posts with random usernames/dishes every render
- Leaderboard — hardcoded `MOCK_USERS` array, "loading" tabs just timeout back to the same fake data
- Barcode Scanner — no actual camera or barcode scanning; it's a meal-time tracker
- Backends — all three (Node :5000, Python :5001, Flask :5002) default to `''` on Vercel; nothing is deployed
- Analytics, MarketMetrics, UserMetrics — inject vanilla JS and manually update DOM nodes, not React state

**Architectural debt:**
- 30+ legacy vanilla JS files in `/public/js/` are injected via `document.createElement('script')` inside React `useEffect` hooks — messy and unmaintainable
- No PWA manifest (can't install on phone)
- No onboarding flow (users land on a map with no guidance)
- No error boundaries (one crash = blank white screen)
- Coins, badges, checkins are localStorage-only — clearing the browser wipes all progress

---

## Priority Tiers

### 🔴 P0 — Fix Before Showing Anyone (This Week)

These are things that will embarrass you in a demo or break for a first-time user.

---

#### P0-1: Real Authentication
**Problem:** Google Sign-In is a fake `setTimeout`. Email login creates a random ID that disappears on browser clear. No real user accounts exist.

**Fix:** Swap `authService.js` for Supabase Auth.
- Supabase is free, has Google OAuth + email/password built in, takes ~3 hours to set up
- One environment variable: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Replace `signUpGoogle()` with `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Replace localStorage session with `supabase.auth.getUser()`

**Effort:** 3–5 hours
**Why now:** Every other feature depends on knowing who the user is.

---

#### P0-2: Fix the Social Feed
**Problem:** The Social Feed generates 6 random fake posts on every render. Usernames like `@eats_3`, dishes chosen randomly, locations random. An investor will see through this in 5 seconds.

**Fix (fast path — 2 hours):** Curate 12–20 real-looking hardcoded posts with realistic content, real dish photos (use Unsplash food images), real usernames, real recipe steps. Rotate them. This looks real enough for demo.

**Fix (real path — 2–3 days):** Connect to your Flask backend, store posts in a Supabase table, let users share their cooked recipes as posts.

**Effort:** 2 hours (demo) or 2–3 days (real)

---

#### P0-3: Fix the Leaderboard
**Problem:** Shows the same 5 hardcoded fake users (FoodieNYC, HomeChef, PizzaLover...) regardless of tab. "Loading" spinner just times out back to same data.

**Fix (fast path — 1 hour):** Seed 20+ realistic users with varying scores, boroughs, and badge counts. Make borough/weekly tabs show different subsets.

**Fix (real path — 1 day):** Supabase table `leaderboard_scores`, update on each checkin, query on load.

**Effort:** 1 hour (demo) or 1 day (real)

---

#### P0-4: Mobile Responsiveness Check
**Problem:** No explicit mobile breakpoints confirmed. The app uses pixel-art fonts (`Press Start 2P`) which can be unreadable at small sizes.

**Fix:** Test every major page on 375px (iPhone SE) and 390px (iPhone 14). Fix font sizes, touch targets, nav collapse. The map especially needs a mobile-first check.

**Effort:** 4–6 hours

---

#### P0-5: Add an Onboarding Flow
**Problem:** New users land on a full map with no explanation of what Dig In is or what to do first. Retention will be near zero without guidance.

**Fix:** A 3-screen intro modal on first visit:
- Screen 1: "Welcome to Dig In 🍳" — what the app does
- Screen 2: "Pick your home borough" — sets context for the map
- Screen 3: "Your first quest" — gives them a goal (check in to a store, make a recipe)

Store `onboarded: true` in localStorage, skip if returning user.

**Effort:** 3–4 hours

---

### 🟠 P1 — Core Loop Must Work (Week 2–3)

These make the app actually useful for real beta users.

---

#### P1-1: Deploy the Flask Backend
**Problem:** The pantry scanner, recipe rolodex, grocery locator, and substitution engine are all built in Python but none are deployed. `VITE_FLASK_BASE` defaults to `''`.

**Fix:** Deploy to Render.com (free tier for hobby projects).
- `render.yaml` config file, point to `/backend/app.py`
- Set `VITE_FLASK_BASE=https://dig-in-api.onrender.com` in Vercel env vars
- Free tier spins down after 15 min inactivity (warning: slow cold start)
- For production, upgrade to $7/month paid Render instance

**Effort:** 2–4 hours
**What unlocks:** Pantry scanner, recipe rolodex, grocery locator, substitution engine all become real

---

#### P1-2: Real Barcode Scanning
**Problem:** The BarcodeScanner page is actually a meal-time scheduler, not a barcode scanner. It loads external JS scripts but has no camera access or barcode decoding.

**Fix:** Integrate `ZXing.js` (browser-native barcode reading):
```bash
npm install @zxing/library
```
- Use `BrowserQRCodeReader` or `BrowserMultiFormatReader`
- Access `getUserMedia()` for camera
- On scan: look up barcode in Open Food Facts API (free, no key needed)
- Display nutrition info + suggest recipes that use that ingredient

**Effort:** 1–2 days
**What unlocks:** This is a genuinely impressive demo feature — scan a product and get recipes

---

#### P1-3: Persist User Data to Backend
**Problem:** All coins, badges, check-ins, saved recipes, and profile data live in `localStorage`. Browser clear = all progress lost. Works on one device only.

**Fix:** After Supabase Auth is set up (P0-1), create tables:
- `user_profiles` (coins, xp, home_borough)
- `checkins` (store_id, timestamp, user_id)
- `user_badges` (badge_id, earned_at, user_id)
- `saved_recipes` (recipe_id, user_id, notes)

Sync on login: pull from Supabase, merge with localStorage, write back on changes.

**Effort:** 2–3 days
**Why it matters:** Real users will switch devices. Progress loss = churn.

---

#### P1-4: Connect RecipeAI to Real AI
**Problem:** RecipeAiHelper shows 3 hardcoded sample recipes (Cacio e Pepe, Tacos al Pastor, Matcha Daifuku). "AI" tips are static arrays. There's no actual AI.

**Fix:** Add an edge function (Vercel serverless) that:
- Takes user's current ingredients (from pantry or manual input)
- Calls OpenAI `gpt-4o-mini` (cheap — $0.002/1K tokens)
- Returns recipe suggestions, step-by-step instructions, substitution tips

This is the feature investors will want to see working.

**Effort:** 1 day
**Cost:** ~$5–20/month at scale

---

#### P1-5: Make Recipe Saving Work
**Problem:** The save/bookmark system (`useSave.js`, `saveService.js`) exists but unclear if it persists anywhere beyond localStorage.

**Fix:** Wire save actions to Supabase `saved_recipes` table. Add a "My Cookbook" view that shows saved recipes, filterable by cuisine/time/dietary.

**Effort:** 4–6 hours

---

### 🟡 P2 — Growth Features (Week 3–4)

These drive traction, sharing, and the metrics investors want to see.

---

#### P2-1: PWA Manifest + Installability
**Problem:** `index.html` has no `<link rel="manifest">`. The app cannot be installed on a phone home screen. No service worker = no offline support.

**Fix:**
1. Create `/public/manifest.json` with name, icons, theme colors, start URL
2. Add `<link rel="manifest" href="/manifest.json">` to `index.html`
3. Add a simple service worker (Workbox via Vite plugin) to cache static assets

This lets beta users install Dig In like a native app — huge for retention.

**Effort:** 3–4 hours

---

#### P2-2: Shareable Recipe Cards
**Problem:** The pixel art food aesthetic is the app's biggest viral hook — but there's no way to share it. Users can't post their pixel recipes to Instagram or TikTok.

**Fix:** On the PixelCreator and RecipeCards pages, add a "Share" button that:
- Uses `html2canvas` to capture the pixel art card as a PNG
- Triggers native share sheet (`navigator.share()`) on mobile
- Falls back to download on desktop

This is the TikTok/Instagram content engine. Every share is free marketing.

**Effort:** 1 day

---

#### P2-3: Real Analytics (PostHog)
**Problem:** The Analytics page loads a local `analytics-tracker.js` script that only tracks the current session in localStorage. You have no visibility into real user behavior.

**Fix:** Install PostHog (free up to 1M events/month):
```bash
npm install posthog-js
```
Add to `main.jsx`:
```js
posthog.init('YOUR_KEY', { api_host: 'https://app.posthog.com' })
```
Track: page views, recipe views, check-ins, badge earned, recipe saved, pixel art exported.

**Effort:** 2 hours
**Why:** You need DAU, session length, and D7 retention before any investor meeting.

---

#### P2-4: Fix Analytics/MarketMetrics/UserMetrics Pages
**Problem:** These pages inject vanilla JS scripts via `document.createElement('script')` and then call `setText()` to update DOM nodes directly. This fights React's rendering model and causes bugs.

**Fix:** Convert each to proper React components with `useState`/`useEffect` that read from localStorage or Supabase — no external script injection.

**Effort:** 1 day per page (3 pages = 3 days total)

---

#### P2-5: Data Collection Pipeline (B2B Revenue Enabler)
**Problem:** Your `DataMonetization` Python class is built but collects no real data — the Flask backend isn't deployed, and even if it were, there's no frontend code sending user behavior to it.

**Fix:** After P1-1 (Flask deployed) and P0-1 (real auth):
- On each check-in: POST anonymized data to `/api/collect_data` (zip_code, store, timestamp)
- On each recipe cook: POST recipe_name, substitutions_used, actual_time
- Store in a Supabase table (or PostgreSQL on Render)
- Build a simple admin page that runs `get_trending_insights()` and shows a table

**Effort:** 2–3 days
**Why:** This is the B2B product. Every real beta user generates data. You want this collecting from day one.

---

### 🟢 P3 — Monetization & Scale (Month 2+)

Do these after you have real users.

---

#### P3-1: Premium Subscription (Stripe)
- Paywall: unlimited pixel exports, advanced recipe AI, offline cookbooks
- Stripe Checkout integration (serverless function on Vercel)
- Supabase column `is_premium: boolean` per user
- Price: $4.99/month or $39.99/year

**Effort:** 2–3 days

---

#### P3-2: B2B Data Report Dashboard
- Admin-only page showing trending ingredients, store traffic, substitution patterns by zip code
- Export as PDF for grocery store sales
- This is the product you sell to Kroger / Whole Foods / Unilever

**Effort:** 3–5 days

---

#### P3-3: Real Leaderboard Backend
- Supabase real-time subscriptions for live leaderboard updates
- Borough, weekly, and all-time tabs hitting real data
- Push notification when you move up/down in rank

**Effort:** 2 days

---

#### P3-4: Native Mobile App
- Capacitor.js to wrap current React app as iOS/Android app (fastest path)
- Or React Native rewrite for better performance (longer path)
- Enables push notifications, camera access, App Store listing

**Effort:** 1 week (Capacitor) or 4–8 weeks (React Native)

---

## Clean-Up Tasks (Do These Throughout)

These aren't features but they'll bite you during due diligence or if you bring on an engineer.

| Task | What to Do | Effort |
|------|-----------|--------|
| Audit `/public/js/` | 30+ vanilla JS files — identify which are actively used, delete dead ones | 2–3 hours |
| Migrate vanilla JS injections | Pages that do `document.createElement('script')` — convert to real React | 1–2 days |
| Add React Error Boundaries | Wrap each major page so crashes don't white-screen the whole app | 2 hours |
| Add loading skeletons | Every page that fetches data needs a loading state | 4 hours |
| Environment variables | Document all `VITE_*` vars in `.env.example` (already started, keep updated) | 30 min |
| Remove dead imports | Several pages import things that don't exist or aren't used | 1–2 hours |

---

## The 3-Screen Demo Stack (Jobs 30% Rule)

When you demo to investors, show exactly these three flows — nothing else:

**Flow 1 — "What can I cook?" (2 min)**
Map → tap a store → Craving Compass → get a recipe suggestion → Recipe card

**Flow 2 — "This is fun" (1.5 min)**
Pixel Creator → create a food character → Export card → Share button

**Flow 3 — "This is a business" (1 min)**
Check in to a store → earn coins → badge unlocks → "your data feeds our grocery store intelligence reports"

That's 4.5 minutes. Perfect demo length. Practice it 20 times.

---

## Recommended Tool Stack for the Fixes

| Need | Tool | Cost |
|------|------|------|
| Real auth | Supabase Auth | Free |
| Database | Supabase PostgreSQL | Free (up to 500MB) |
| Backend hosting | Render.com | Free / $7/mo |
| AI API | OpenAI gpt-4o-mini | ~$5–20/mo |
| Analytics | PostHog | Free (1M events/mo) |
| Barcode scanning | ZXing.js (npm) | Free |
| PWA | Vite PWA plugin | Free |
| Image sharing | html2canvas (npm) | Free |
| Payments (later) | Stripe | 2.9% + 30¢/transaction |

---

## 30-Day Sprint Sequence

| Week | Tasks | Goal |
|------|-------|------|
| Week 1 | P0-1 (Auth), P0-2 (Social Feed), P0-3 (Leaderboard), P0-5 (Onboarding) | App doesn't embarrass you |
| Week 2 | P0-4 (Mobile), P1-1 (Deploy backend), P1-2 (Barcode scan), P2-3 (PostHog) | Core features actually work |
| Week 3 | P1-3 (Persist data), P1-4 (Real AI), P2-1 (PWA), P2-2 (Share cards) | Beta users can use it daily |
| Week 4 | P2-5 (Data pipeline), P1-5 (Recipe save), Fix analytics pages | B2B layer starts collecting data |

---

*App Readiness Plan · Dig In · June 2026 · Confidential*
