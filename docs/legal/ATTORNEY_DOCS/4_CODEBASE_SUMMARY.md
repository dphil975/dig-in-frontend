# Dig In — Codebase & Technical Scope Summary
### In Place of GitHub URL · July 2026

---

## YOUR SIMPLE EXPLANATION

**Why does the attorney need this?**
The attorney needs to understand that this isn't just an idea on paper — it's a real, working, built thing. Code that exists has copyright protection automatically. This document proves scope: how much was built, what it does, and that you are the one who built it.

**What to say:** "I have a private GitHub repository. I haven't shared the URL publicly because I don't want to expose the code before I have IP protection in place. Here's a summary of what's in it."

---

## Repository Overview

**Repository:** Private (not publicly accessible)
**Owner:** Olive Phillips
**Status:** Active development — working application deployed on Vercel

**Two repositories:**
1. `Dig In-Frontend` — The consumer-facing React application
2. `Dig In-backend` — The Python/Flask data and AI backend

---

## Frontend Repository (`Dig In-Frontend`)

**Technology:** React 18, Vite, JavaScript, Leaflet.js, React Router DOM

**Scale:**
- 77 commits (documented development history with timestamps)
- 27 distinct application pages / route destinations
- 13 service/utility modules
- 14 reusable React components
- 30+ supporting JavaScript modules in the public asset layer

**Key directories and what they contain:**

| Directory | What's Inside |
|-----------|--------------|
| `src/pages/` | 27 full application pages including: Home (map), Recipes, PixelCreator, CheckIn, Profile, Badges, SocialFeed, BarcodeScanner, CravingCompass, MarketMetrics, Analytics, RuralTrend, GlobalFood, Leaderboard, and more |
| `src/services/` | 7 service modules: API client, auth service, behavior tracker, check-in service, geo service, photo mission engine, save service, seasoning pairing engine |
| `src/lib/` | Core logic libraries: analytics, dynamic pricing, recipe alchemist, recipe recommender, regional data, Supabase client, sync service |
| `src/components/` | 14 reusable UI components including: Nav, RecipeSlider, SmartFinder, PixelCreator sub-components, OnboardingModal, RecipeAlchemist, DiscoverBento, TrustStats |
| `public/data/` | Recipe database: JSON files covering 70+ countries (Afghanistan through Zimbabwe), herb encyclopedia, flavor science data |
| `public/js/` | 30+ supporting JavaScript modules including: analytics tracker, behavior systems, gamification engines, store mapper, receipt scanner, route planner |

**Proprietary modules of note:**
- `behaviorTracker.js` — Records and learns from user departure times, check-in patterns, and recipe views to personalize recommendations
- `checkinService.js` — Full check-in logic including streak calculation, coin awarding, boost mechanics, and quest tracking
- `seasoningPairingEngine.js` — Decodes natural language cravings into flavor layer components
- `dynamicPricing.js` — Ranks nearby stores by price competitiveness for specific recipe ingredients
- `recipeAlchemist.js` — Transforms a described dish into a structured recipe with ingredients, steps, and format options

---

## Backend Repository (`Dig In-backend`)

**Technology:** Python 3, Flask, Flask-CORS

**Scale:**
- 7 distinct Python modules (classes)
- 4 commits covering initial setup through major feature additions

**Modules:**

| File | Class | What It Does |
|------|-------|-------------|
| `app.py` | Flask App | API server with 15+ endpoints routing to all backend modules |
| `pantry_ai.py` | `PantryScanner` | Computer vision + manual input pantry scanning, recipe matching at 60%+ ingredient overlap threshold |
| `substitution_engine.py` | `SubstitutionEngine` | 300+ ingredient substitution rules with ratios, prep notes, and use-case restrictions |
| `recipe_rolodex.py` | `RecipeRolodex` | 10,000+ global recipe database with flashcard format, cultural notes, pixel art references, organized by 15 cuisine types |
| `grocery_locator.py` | `GroceryLocator` | Geolocation-based store finder with classification by store type (chain, specialty, discount, corner, organic) |
| `time_manager.py` | `CookingTimer` | Multi-step recipe timer management |
| `data_monetization.py` | `DataMonetization` | **Core B2B module** — anonymized behavioral data collection, aggregation, trend analysis, and custom report generation for retail clients |

---

## The `DataMonetization` Module — Detail for Attorney

This is the most IP-sensitive module. Key methods:

- `collect_anonymous_data()` — Hashes user ID with SHA-256, captures zip code, store, timestamp, ingredients, recipe, substitutions, and price sensitivity. No PII stored.
- `get_trending_insights()` — Aggregates data into trending ingredients, substitution patterns, peak shopping hours, and regional store preferences. Configurable by timeframe.
- `generate_report_for_store()` — Produces a custom market intelligence report for a named grocery store: their market share vs. competitors, peak shopping times, frequently bundled items, opportunities, and price sensitivity score for that zip code.
- `measure_price_sensitivity()` — Calculates coupon usage rate per zip code to classify shoppers as "very price sensitive," "moderately price sensitive," or "premium shopper."

---

## Copyright Notice

All code in both repositories was written by Olive Phillips beginning June 2026, with AI coding assistance from Claude (Anthropic). Per Anthropic's Terms of Service, outputs generated using Claude belong to the user. All creative and architectural decisions were made by Olive Phillips. Copyright is automatically established at the time of creation under 17 U.S.C. § 102.

---

## What the Attorney Should Know

- The codebase is fully private and has not been publicly disclosed
- No open-source license has been applied
- No code has been shared with third parties under any license
- No contractors or co-founders have contributed code to date — all work is sole-inventor
- The repository URL can be shared under NDA for technical due diligence

---

*Codebase Summary · Dig In · July 2026 · Confidential — Attorney-Client Privilege*
