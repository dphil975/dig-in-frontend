# Dig In — Product Requirements Document

**Owner:** Olive Phillips
**Status:** Draft for internal use — thinking artifact, not a spec for a finished build
**Last updated:** July 11, 2026

**Confidentiality note:** This document contains unreleased product strategy, monetization mechanics, and the specific mechanism (verified check-ins → anonymized data → B2B reports) that makes Dig In defensible. Treat it as confidential. See "Protecting This From Being Copied" at the end before sharing it outside a signed NDA.

---

## 1. One-Line Definition

Dig In is a mobile-first food-discovery game where people check in at grocery stores, get global recipe suggestions, and create shareable pixel-art of their food — and every check-in generates anonymized neighborhood shopping data that independent grocery stores and food brands buy as market intelligence.

Two sides, one flywheel: more consumers → denser check-in data → more valuable B2B reports → B2B revenue funds consumer growth → in-store QR acquisition brings in more consumers.

---

## 2. Who It's For

### Consumer side (the free/low-cost user)

**Primary: Food-curious 18–38 year olds in dense urban/suburban markets.**
They shop at more than one store a week, follow food content on TikTok and Instagram, cook at home most nights but crave variety, and respond to games, streaks, and rewards. Launch geography is NYC and LA — dense, multi-store, ethnically diverse markets that match a 70+ country recipe library.

**Secondary:**
- Home cooks collecting global recipes and trying new cuisines
- Budget-focused households that need ingredient substitutions
- Gen Z users pulled in by the pixel-art creator, even if food isn't their main interest
- Health-conscious shoppers who want to track what they're actually eating

### B2B side (the paying customer)

**Primary: Independent and regional grocery stores.** They can't afford enterprise loyalty programs like Kroger's, so they have no visibility into what the surrounding neighborhood is buying beyond their own register data. Dig In sells them that wider view.

**Secondary: CPG and specialty food brands** (spice makers, sauce brands, etc.) who want zip-code-level demand signals to guide distribution and marketing spend.

The consumer product only exists to make the B2B product possible. A feature that doesn't eventually feed one of these two sides isn't a Dig In feature.

---

## 3. Problem It Solves

**For consumers:** Deciding what to cook and where to shop is a small daily friction with no reward attached. Existing recipe apps are static content libraries — they don't know what's near you, don't make discovery feel like a game, and give you nothing back for showing up. Dig In turns a mundane errand (grocery shopping) into a loop with progress, identity (the pixel character), and payoff (recipes, coins, streaks).

**For grocery stores and brands:** Independent grocers are flying blind on neighborhood demand. They can see their own receipts but not what the surrounding area is buying at competitors, what cuisines are trending, or where to stock next. Enterprise-scale competitors already buy this kind of data; independents currently can't. Dig In packages anonymized, geography-decomposable shopping behavior into a report they can actually afford and act on.

---

## 4. Core Loop

```
Open app → see today's quest
  → Check in at a store (GPS-verified) → earn coins
  → Get a recipe suggestion tied to that store → cook it → mark done → earn coins
  → Create pixel art of the dish → share it (TikTok/IG)
  → Streak +1 → reason to return tomorrow
```

Every check-in does double duty: it's the moment the user gets value, and the moment a data point gets created for the B2B side. That's why the North Star Metric below is built around it rather than around downloads or revenue.

**North Star Metric: Weekly Verified Check-ins (WVC)** — total GPS-verified store check-ins across all users in a 7-day window, trackable per zip code. It's a leading indicator (drives both engagement and data density) rather than a lagging one like MAU or revenue.

---

## 5. MVP Scope — What's In

The MVP is the smallest version of the loop above that is real end-to-end for a first cohort of beta users, not mocked. Based on the current build, that means fixing what's fake and shipping the following as genuinely functional:

**5.1 Account & identity**
- Real authentication (email + Google), persisted server-side — not device-local
- Basic profile (username, pixel avatar, coin balance, streak)

**5.2 The core loop**
- Grocery store map with GPS check-in verification
- Coin earning on check-in and on marking a recipe cooked
- Recipe suggestions tied to nearby stores, pulled from the existing 600+ recipe / 70+ country library
- Ingredient substitution engine (300+ rules) surfaced inside recipe flows
- Pixel-art creator: build a character, unlock outfits with earned coins, export/share the image

**5.3 Retention mechanics**
- Streaks, tied to real (not localStorage-only) check-in history
- A short onboarding flow (3 screens: what the app does, pick a home area, first quest) so new users don't land on a blank map

**5.4 The B2B data pipeline (minimum viable version)**
- Event logging on every verified check-in: anonymized zip code, store, timestamp, associated recipe/ingredient interest
- A basic aggregation job that rolls this into a simple report format (even a manual/CSV export is fine for MVP — the point is proving the data exists and is sellable, not automating delivery yet)
- One pilot relationship with a real independent grocer or CPG brand willing to look at a sample report

**5.5 Instrumentation**
- Event tracking for the four funnel stages that feed the North Star Metric: acquisition → first check-in → check-in frequency → week-over-week check-in retention

---

## 6. Explicitly Out of Scope for MVP

Being clear about what's *not* being built now is what keeps this an MVP instead of a rewrite of the whole roadmap. Cutting these isn't a judgment that they're bad ideas — it's a bet that they don't need to be true before the core loop and the B2B pilot are proven.

- **Social feed** — currently fake/randomly generated; not rebuilt for MVP. A real social feed (user-generated posts, real usernames, moderation) is a v2 feature once there's a real user base to populate it.
- **Leaderboard** — currently hardcoded mock users; not rebuilt for real-time ranking in MVP. Revisit once check-in volume is large enough for a leaderboard to mean anything.
- **Barcode/pantry scanner** — not part of the check-in loop; deferred.
- **Boomerang / video creation tool** — nice-to-have virality feature, not core to proving the loop or the data product.
- **Automated, self-serve B2B report delivery** — MVP proves the data is real and sellable via a manual/pilot process. Building a self-serve dashboard for grocers is a post-pilot investment.
- **Paid subscriptions and coin-pack purchases (Stripe billing)** — monetization infrastructure comes after the loop and B2B pilot are validated, not before. Pricing has already been modeled ($4.99/mo consumer tier, $299–$5,000+/mo B2B tiers) but isn't required to prove the MVP.
- **Ad revenue integration** — same reasoning; sequenced after core loop validation.
- **Backend redundancy** — the app currently has three parallel backend services (Node, Python, Flask) with overlapping responsibility. MVP should run on one deployed backend, not three.
- **Legacy vanilla-JS injected features** (Craving Compass, Cooking Science, Educational Helper, etc.) — not deprecated, just not part of the MVP surface area. Revisit post-launch based on what beta users actually use.
- **Multi-market expansion** — MVP stays in one to two launch geographies (NYC and/or LA) rather than a nationwide store database.

---

## 7. How Success Is Measured

MVP success has to be judged on both sides of the flywheel — a win on only the consumer side or only the B2B side isn't a win yet.

**Consumer-side signals (is the loop real?)**
- Activation: % of new signups who complete a first verified check-in within 7 days
- Engagement: check-ins per active user per week (target: 3+)
- Retention: % of users who checked in last week and check in again this week (D7/W2 retention)
- North Star: Weekly Verified Check-ins, tracked in aggregate and per zip code

**B2B-side signals (is the data sellable?)**
- Check-in density in the target zip code(s) — the raw input to data value
- Whether a pilot grocer/brand, shown a sample report, says it's something they'd pay for (qualitative but the real gate)
- Data completeness: % of check-ins with usable, non-duplicate, geographically verified data

**Guardrail metrics (is anything fake slipping through?)**
- Zero mocked/hardcoded data visible to real users in production (the exact failure mode the current build has with the social feed and leaderboard)
- Check-in GPS verification pass rate, to catch spoofing before it corrupts the B2B data product

If, after the MVP period, verified check-ins per active user are climbing, retention holds past week 2, and at least one real B2B contact confirms the data has commercial value, the MVP has done its job and the next phase (billing, self-serve reports, social/leaderboard rebuild) is justified.

---

## 8. Protecting This From Being Copied

A few practical, non-legal habits worth building in now, since monetization is the goal and this document lays out the exact mechanism:

- **Treat documents like this one as confidential by default.** Don't post the two-sided data-flywheel mechanic, pricing tiers, or the B2B pipeline design in public forums, open GitHub issues, pitch competitions without an NDA, or investor decks sent cold. A one-line product description is fine to share publicly; this document is not.
- **Use NDAs before detailed pitches.** Before walking a grocer, CPG brand, investor, or contractor through the full mechanics (not just "it's a food app"), have them sign a mutual NDA. This is standard practice and most legitimate counterparties expect it — hesitation to sign one is itself a signal.
- **Separate "what" from "how" in public materials.** App store listings, marketing, and social content can describe *what* Dig In does (recipes, check-ins, pixel art) without detailing *how* the data pipeline or aggregation logic works.
- **Keep a clear record of authorship and dates.** You already have `ATTORNEY_DOCS/` with a creation timeline and technical summary — that record is valuable for establishing priority if a dispute ever comes up. Keep it current as the product evolves.
- **Copyright is automatic; patents and trademarks are not.** Your code, recipe copy, and pixel art designs are already protected by copyright the moment you create them. The "Dig In" name (trademark) and any novel mechanism you want to lock out competitors from replicating (patent) require separate filings — which is exactly what your attorney meeting is for.
- **This is general practice, not legal advice.** You're already engaging a patent attorney (per `ATTORNEY_DOCS/`) — treat their guidance as authoritative over anything here, especially on what's actually patentable versus what's just a good trade secret to keep quiet.

---

*This PRD is meant to be revised as the MVP gets built and real user data comes in — it's a starting hypothesis, not a locked spec.*
