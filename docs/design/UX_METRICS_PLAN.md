# Dig In — UX Clarity & Metrics Improvement Plan
### What to Change, What to Hide, What to Fix · June 2026

---

## The Core Problem in One Sentence

A new user opens Dig In and sees a map, a recipe slider, a bento grid with 7 cards, a flavor alchemy tool, trust stats, a SmartFinder with 3 sub-tabs, and a nav with 23 destinations across 5 dropdowns — and has no idea what to do first.

**Decision paralysis = no action = no retention.**

The app has genuinely great features. The problem is that showing all of them at once makes none of them feel special. This plan is about what to hide, what to surface, and how to create a loop that brings people back every day.

---

## What the Core Loop Should Be

Everything in the app should serve exactly this loop:

```
Discover a store on the map
    → Check in → earn coins
    → Get a recipe suggestion
    → Cook it → mark as done → earn coins
    → Create pixel art of your dish
    → Share it
```

Any feature that doesn't connect to one of those steps should be hidden from the main UI.

---

## Section 1: The Navigation — Cut It in Half

### Current State (the problem)
Your nav has **23 links** across 5 dropdowns. Here's the full list:

- Food Map
- Cook ▾ → Recipes, Recipe Cards, Cookbook, AI Recipe Helper, Educational Helper, Cooking Science
- Discover ▾ → What's Craving?, Social Feed, Catalog, Commute Route, Craving Compass, Drink Scan, Rural Bridge
- Create ▾ → Pixel Creator, Pixel Map, Ingredient Demo
- Deals
- Profile ▾ → My Profile, Badges, Check-In

That's 7 sections. A new user has no idea where to start. This is the #1 metric killer — users who don't know what to click, don't click anything and leave.

### What to Do
Reduce to **4 top-level nav items, max 3 items per dropdown, 10 total destinations.**

**New Nav:**

| Tab | What's Under It | What It Replaces |
|-----|----------------|-----------------|
| **Map** | (direct link, no dropdown) | Food Map |
| **Cook ▾** | Recipes · AI Helper · Cooking Science | All 6 Cook items collapsed to 3 |
| **Pixel ▾** | Pixel Creator · My Food Art | Create (3 items merged to 2) |
| **Me ▾** | Profile · Daily Quest · Deals | Profile (3 items) + Deals |

**What gets removed from nav (not deleted, just hidden):**
- Catalog → accessible via the Map page as a "Browse Stores" button
- Commute Route → accessible from the Map via "Plan Route" 
- Craving Compass → accessible from Recipes page as "Find Ingredients Nearby"
- Craving Search → merged into Recipes search bar
- Social Feed → accessible from Profile as "Community Feed"
- Educational Helper → merge into Cooking Science page as a tab
- Drink Scan → accessible from Barcode/Pantry as a sub-feature
- Rural Bridge → remove from consumer nav entirely (B2B story, not consumer feature)
- Recipe Cards → merge into Recipes page as a view toggle
- Cookbook → merge into Profile as "My Cookbook" tab
- Leaderboard → surface on Profile/Me page, not standalone
- Pixel Map → merge into main Map (it's the same map)
- Ingredient Demo → remove from nav (it's a demo, not a feature)
- Analytics / MarketMetrics / UserMetrics → admin-only, never in consumer nav

**The coin counter in the nav:**
Currently shows "COINS: 0" with no context. Users don't know what coins do.
→ Replace with: a check-in streak indicator (🔥 3-day streak) — this is your daily retention hook.

---

## Section 2: The Home Page — From 9 Components to 3

### Current State (the problem)
Home page (`index.jsx` is 1,424 lines) renders:
1. Map (Leaflet, full borough switching)
2. RecipeSlider
3. OnboardingModal
4. SmartFinder (3 sub-tabs: CRAVING, RURAL BRIDGE, SCAN)
5. InteractiveHeroRecipe
6. TrustStats
7. TransformationExamples
8. DiscoverBento (7 bento cards)
9. RecipeAlchemist

This is 9 distinct UI sections competing for the user's first impression. No one knows what Dig In is when they land here.

### What to Do

**Keep on Home:**
1. **Map** — this is the hero. It's unique, it's NYC-specific, it's beautiful. Let it breathe.
2. **Floating Daily Quest card** — bottom of screen, always visible. "✅ Check in to 1 store today → +50 coins." This drives daily return.
3. **Recipe Slider** — below the map fold. Shows "Based on stores near you" recipes.

**Remove from Home, move elsewhere:**
- `SmartFinder` → The RURAL BRIDGE sub-tab does not belong on the home page of a food discovery app. Move Craving sub-tab to Recipes page. Move Scan to Barcode page.
- `DiscoverBento` → Move to a dedicated "Explore" section inside Recipes page.
- `InteractiveHeroRecipe` → Move to Recipes page as a featured recipe.
- `TrustStats` (600+ recipes, 70 countries, 9,000 combinations) → Move to onboarding or an About section.
- `TransformationExamples` → Move to onboarding.
- `RecipeAlchemist` → Move to Recipes page as a "Remix This Recipe" tool. It's powerful but it's not a home-page feature.

**Result:** Home page = Map + Floating Quest Card + Recipe Slider. That's a clear, focused screen. Users know exactly what to do.

---

## Section 3: Duplicate Features — Pick One

You have multiple pages doing the same thing. Consolidate these:

### 3A: Three "What Should I Eat?" Flows → One
- **CravingSearch** (`/craving`) — type a craving, get YouTube/Pinterest recipes (demo data)
- **CravingCompass** (`/craving-compass`) — type a craving, get store price comparisons
- **SmartFinder** on Home — craving sub-tab with budget slider and store ranking

**Fix:** Merge into one page `/discover`. Left side: type a craving → get recipe results. Right side: find ingredients at nearby stores with price comparison. These belong together — they complete each other.

### 3B: Four Recipe Browsing UIs → Two
- **Recipes** (`/recipes`) — main recipe browser
- **RecipeCards** (`/recipe-cards`) — flashcard format
- **Cookbook** (`/cookbook`) — not found during audit (may be missing)
- **GlobalFood** (`/global-food`) — country-based recipe browsing

**Fix:** 
- `Recipes` = the main page. Add a view toggle: Grid / Cards / Global (3 views, one URL)
- `GlobalFood` content becomes a tab inside Recipes ("Explore by Country")
- Remove `/recipe-cards` and `/cookbook` as separate nav items

### 3C: Four Map UIs → One
- **Home** (`/`) — main Leaflet map with borough tabs
- **Catalog** (`/catalog`) — another Leaflet map, loads via CDN script tag
- **PixelMap** (`/pixel-map`) — pixel-styled map
- **CommuteRoute** (`/commute`) — map with routing and transit lines

**Fix:**
- **Home map** is the one map. Period.
- **PixelMap** becomes the Home map's visual style (it's already close to this in practice)
- **Catalog** is removed — its store data can feed into the Home map
- **CommuteRoute** is accessible via a "Plan Route" button inside a store popup, not its own page

### 3D: Two Scanner Features → One
- **BarcodeScanner** (`/barcode`) — currently a meal-time scheduler
- **DrinkScan** (`/drink-scan`) — drink ingredient analyzer

**Fix:** Merge into one `/scan` page with two tabs: "Scan Food" and "Scan Drink." Keep the drink analysis (it's genuinely cool) but don't bury it as a separate nav item.

### 3E: Two Analytics Pages for Badges/Profile
- **Profile** (`/profile`) — has badges section, daily quests, history reel
- **Badges** (`/badges`) — standalone badges page with identical badge data

**Fix:** Remove `/badges` as a standalone page. Its content lives in Profile. The nav item "Badges" becomes a deep link to the badges section of Profile.

---

## Section 4: Pages to Hide Entirely (Not Delete)

These are real features worth keeping in the codebase, but they are **confusing to show to a new user** and they dilute what the app is.

### Hide from Consumer UI:

**`/analytics`** — Shows session data, engagement score, recipe views. This is an admin/analytics tool. It should only be visible if the user is logged in as an admin. Regular users don't need to see their own raw session data.

**`/market-metrics`** — This is B2B data: trending ingredients, peak shopping hours, market share by store. This is what you sell to Kroger. It should live at `/admin/market` behind auth.

**`/user-metrics`** — Same issue as above. Internal analytics, not consumer-facing.

**`/rural-trend`** — This is a genuinely important social mission (food access in rural areas, SNAP/WIC integration, OSRM routing). But it's not a consumer feature for your NYC user base. Make it a marketing story ("How Dig In helps rural communities") not a nav item.

**`/pixel-ingredient`** — The name says "Demo." It's a technical demonstration. Merge what's worth keeping into PixelCreator and retire the standalone page.

**`/global-food`** — Not a bad page, but it's redundant with what's in the recipe database. Fold it into Recipes as a tab.

---

## Section 5: Metric-Specific Changes

### 5A: DAU (Daily Active Users)
**Problem:** There is no compelling reason to open Dig In every day.
**Fix:**
- Move the daily quest to the **center of the home screen** — not buried in Profile. A card that reads "🎯 Today's Quest: Check in to 1 new store → +75 coins" with a progress bar.
- Add the **check-in streak to the nav** (replace the coin counter with 🔥 3 streak). Streaks are addictive. Duolingo's entire retention strategy is built on this.
- Daily quest resets at midnight. This creates a natural reason to open the app daily.

### 5B: D7 Retention (Coming Back After 1 Week)
**Problem:** Nothing gets better for the user over time. Their profile gets richer (more badges, more coins) but there's no payoff.
**Fix:**
- **Week 1 milestone**: "You've cooked 5 recipes! Unlock the Chef Hat for your pixel avatar." 
- Make coins spendable on pixel creator outfits from day one. Currently the PixelCreator shows outfit prices (Chef Hat: 100 coins, Royal Cape: 200 coins) but coins are earned from check-ins. Wire these together explicitly. The game loop is: check in → earn coins → unlock outfit → create art → share it.
- Show a "Your progress this week" summary at the top of Profile. Users who see their progress stay.

### 5C: Session Length
**Problem:** Most pages are dead ends. User reads a recipe → nothing prompts them to do the next thing.
**Fix:**
- End of every recipe page: "Cooked this? Mark it done and earn 30 coins →" button
- End of check-in: "Here's what you can make with ingredients from [store] →" auto-suggestions
- End of pixel creator: "Share your creation →" with native share sheet
- These "next step" prompts can increase session length by 40–60%.

### 5D: Viral Coefficient (User Sharing)
**Problem:** The pixel art creator is the app's most visually unique feature. There is no share button.
**Fix:**
- Add "Export & Share" to PixelCreator — generates a PNG of the pixel food art
- Uses `navigator.share()` on mobile (native share sheet), fallback download on desktop
- Suggested share text: "Made [dish] with Dig In 🍳 [link]"
- Every shared image is free marketing. This is the TikTok hook.

### 5E: Activation Rate (First Meaningful Action)
**Problem:** Users land on the map with no guidance. Many leave without doing anything.
**Fix:**
- The OnboardingModal already exists (`/src/components/OnboardingModal`). Check if it's actually showing and completing correctly.
- The onboarding should end with a specific first action: "Tap a store on the map to check in and earn your first 50 coins." Not a general tour — a specific task.
- Time to first check-in should be under 2 minutes.

---

## Section 6: Clarity Changes Per Page

### Home
- Remove: SmartFinder (RURAL BRIDGE tab especially), DiscoverBento, TransformationExamples, TrustStats, RecipeAlchemist, InteractiveHeroRecipe
- Keep: Map, floating daily quest card, recipe slider below fold
- Add: Streak counter visible on the map screen (top corner: "🔥 3 days")

### Nav
- Cut from 23 items to 10
- Replace "COINS: [n]" with "🔥 [n]-day streak"
- Remove all redundant, admin, and demo items

### Profile
- This page is actually great — rich, gamified, shows history
- Add: "My Cookbook" tab (saved recipes) so Cookbook has a home here
- Merge: Badges page into this page (it already has a badges section)
- Add: "Share Profile" button — shareable card showing coins, streak, badges earned

### Recipes
- Add: View toggle (Grid · Cards · By Country) to consolidate RecipeCards and GlobalFood
- Add: "Cook It" button that marks recipe as cooked and awards coins
- Add: "Find Ingredients Nearby" button that opens CravingCompass for that recipe's ingredients

### Check-In
- This page is solid. One change: make the streak number **huge** — this is your Duolingo moment. 
- Add: After check-in animation, show "Here's what you can cook with ingredients from this store →"

### Pixel Creator
- Add: Export as PNG button
- Add: Share button (navigator.share)
- Add: "Your outfits" section showing what's unlocked vs. locked with coin cost
- Make the coin→outfit economy explicit: "You have 150 coins. Chef Hat costs 100. Buy it →"

### Recipe Cards / Recipes
- Merge these into one page with a toggle
- The flashcard format is genuinely charming — keep it, just don't make it a separate nav item

---

## Section 7: The "30% Rule" Applied — What to Show vs. What to Hold

You have 27+ pages. Show investors (and new users) exactly this:

**Show (your 30%):**
1. The Map — check in to a store, earn coins (30 seconds)
2. Recipe discovery → pixel-art recipe card (30 seconds)
3. Pixel Creator → create food character → export (30 seconds)

**Hold back (your 70%):**
- DataMonetization / MarketMetrics / RuralTrend (B2B story — tell it in words, not by showing the page)
- CookingScience, EducationalHelper, GlobalFood (great content, but dilutes the first impression)
- CommuteRoute, Barcode, DrinkScan (cool features, but they confuse what the app *is* before someone understands the core)
- Analytics, UserMetrics (admin tools)

When asked "what else does it do?" you pull back the curtain on the 70%. That's the conversation you want — not someone scrolling through 27 nav items trying to understand the app.

---

## Priority Summary

| Priority | Change | Impact | Effort |
|----------|--------|--------|--------|
| 🔴 P0 | Cut nav from 23 to 10 items | Massive clarity improvement | 2 hours |
| 🔴 P0 | Remove SmartFinder (Rural Bridge tab) from Home | Removes confusing sub-feature | 30 min |
| 🔴 P0 | Remove DiscoverBento, TransformationExamples, TrustStats, RecipeAlchemist from Home | Home becomes focused | 1 hour |
| 🔴 P0 | Move daily quest to Home screen (not buried in Profile) | DAU improvement | 2 hours |
| 🔴 P0 | Replace nav coin counter with streak counter | D7 retention hook | 1 hour |
| 🟠 P1 | Merge CravingSearch + CravingCompass → /discover | Eliminates confusing duplication | 3–4 hours |
| 🟠 P1 | Add "next step" prompts after every action | Session length +40% | 4 hours |
| 🟠 P1 | Add Share button to Pixel Creator (html2canvas) | Viral loop | 1 day |
| 🟠 P1 | Wire coins → outfits in Pixel Creator explicitly | Retention game loop | 2–3 hours |
| 🟠 P1 | Add "Cook It" button to recipe pages | Completes the cook loop | 2 hours |
| 🟡 P2 | Merge Recipes + RecipeCards + GlobalFood → one page with tabs | Reduces nav sprawl | 1 day |
| 🟡 P2 | Hide Analytics, MarketMetrics, UserMetrics from consumer nav | Brand clarity | 30 min |
| 🟡 P2 | Merge Profile + Badges → one page | Eliminates duplicate | 2 hours |
| 🟡 P2 | Move Catalog into Home map as "Browse All Stores" | One less redundant page | 1 hour |
| 🟢 P3 | Remove /pixel-ingredient, /commute, /rural-trend from nav | Clean up nav | 30 min |
| 🟢 P3 | Shareable profile card | Social proof | 1 day |

---

## What This Achieves

After these changes:
- A new user lands on the map, sees one daily quest, and knows exactly what to do
- The nav has 10 clear options instead of 23 confusing ones
- Your best 30% of features (map, pixel creator, gamification) are front and center
- The B2B layer (market data, rural trends) is invisible to users but present in the codebase — ready to demo separately to investors
- Every action has a natural "what's next?" prompt that extends sessions
- The streak in the nav gives users a reason to come back tomorrow

---

*UX & Metrics Plan · Dig In · June 2026 · Confidential*
