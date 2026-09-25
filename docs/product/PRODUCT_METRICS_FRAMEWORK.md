# Dig In — The Product Manager's Metric & Operating Framework
### Everything a PM Must Define, Measure, and Hit · Olive Phillips · July 2026

---

## How to Use This Document

You already have four strong strategy docs: `FINANCIAL_MODEL.md` (pricing + RPU math), `MARKET_STRATEGY.md` (personas + growth), `INVESTOR_METRICS_AND_FUNDRAISING.md` (what investors ask for), and `UX_METRICS_PLAN.md` (retention levers). This document is different. It is the **product manager's operating layer** — the one place that defines the full metric system for the app, tells you which numbers you are still missing, and lists what you personally have to accomplish to actually run Dig In by the numbers.

The honest headline: **you have a lot of target numbers written down, but you cannot yet measure almost any of them.** Auth is mocked, so there is no real user identity to attach behavior to; PostHog is installed but only a handful of events are instrumented; and there is no North Star metric, no activation definition, and no metric dictionary that everyone agrees on. Those four gaps — not the lack of a specific number — are the real thing you are missing. This document closes them.

Read it in this order: understand the makeup of the app (Part 1), lock your typical customer (Part 2), learn the full metric taxonomy (Part 3), then go straight to Part 4 — that is the direct answer to *"what metrics am I still missing."*

---

## PART 1: THE GENERIC MAKEUP OF THE APP

Before any metric matters, a PM has to be able to say what the product *is* in one breath, name its core loop, and name the one number that summarizes whether it's working. Most founders can't do all three cleanly. Here they are for Dig In.

### 1.1 The one-line product definition

> **Dig In is a mobile-first food-discovery game where people check in at grocery stores, discover global recipes, and create shareable pixel-art of their food — and every check-in generates anonymized neighborhood shopping data that independent grocery stores buy as market intelligence.**

That sentence contains both sides of the business. A PM must never describe only the consumer app or only the B2B data product — the whole point of Dig In is that they feed each other.

### 1.2 The two-sided model (and why it's the whole business)

| Side | Who | What they get | How it pays |
|------|-----|---------------|-------------|
| **Consumer (supply side of data)** | Food-curious 18–38 urban/suburban shoppers | A game: check-ins, coins, recipes, pixel art, streaks | Freemium subs, coin packs, ads |
| **B2B (demand side of data)** | Independent + regional grocers, CPG brands | Neighborhood-level shopping intelligence they can't get elsewhere | $299–$5,000+/mo data reports |

The flywheel: **more consumers → denser data → more valuable B2B reports → B2B revenue funds consumer growth → in-store QR codes acquire more consumers for free.** Your job as PM is to keep both sides spinning. A metric that only moves one side (e.g., premium conversion) is worth less than a metric that moves both (e.g., check-in density in a target zip code, which grows engagement *and* data value).

### 1.3 The core loop (the thing every feature must serve)

```
Open app → see today's quest
   → Check in at a store (GPS-verified)  → earn coins
   → Get a recipe suggestion for that store  → cook it → mark done → earn coins
   → Create pixel art of the dish  → share it (TikTok/IG)
   → Streak +1 → reason to come back tomorrow
```

This is the loop from `UX_METRICS_PLAN.md`, and it is correct. As PM, your metric system exists to answer one question at each arrow: *what percentage of users make it to the next step, and how do we raise it?* Every drop-off between two arrows is a funnel metric you should be tracking (you currently are not — see Part 4).

### 1.4 Your North Star Metric — the number you are missing at the top

You do not currently have a North Star Metric (NSM). This is the single most important gap in your metric system, because without it every other number is unranked noise. The NSM is the one metric that best predicts long-term value creation for both users and the business.

For a two-sided data-flywheel app like Dig In, revenue or MAU are **wrong** as the NSM (they're lagging and they only measure one side). The right NSM captures the behavior that simultaneously means "the user got value" and "the data got more valuable":

> **Recommended North Star Metric: Weekly Verified Check-ins (WVC)** — the total number of GPS-verified store check-ins across all users in a 7-day window.

Why this one:
- A verified check-in is the atomic unit of value on *both* sides — it's the moment the user engages the core loop *and* the moment a data point is created for the B2B product.
- It is a leading indicator of revenue (more check-ins → more engaged users → more premium conversions and more sellable data), not a lagging one.
- It forces quality: "verified" (not faked) keeps you honest, which is exactly what the B2B buyer is paying for (see VC Gap #12).
- It is geography-decomposable, so you can watch it *per zip code* — which is how you actually build sellable data density.

Supporting metrics tree (the NSM breaks down into inputs you can act on):

```
North Star: Weekly Verified Check-ins
├── Acquisition: new users starting per week × % who reach first check-in
├── Frequency:   check-ins per active user per week  (target 3+)
├── Retention:   % of last week's checker-inners who check in again this week
└── Density:     verified check-ins per target zip code  (drives B2B value)
```

Everything in Part 3 rolls up into one of these four branches. If a proposed feature doesn't plausibly move one of these four, it's a distraction.

---

## PART 2: WHO IS YOUR TYPICAL CUSTOMER (THE ICP YOU ASKED ABOUT)

You said you need to figure out your typical customer. You actually have ten personas in `MARKET_STRATEGY.md` — which is a research asset, but it is *not* an ICP. Ten personas is too many to build against. A PM has to collapse them into **one primary Ideal Customer Profile (ICP) you optimize for, plus a small number of secondary segments you serve but don't chase.** Here is that collapse.

### 2.1 Your primary ICP (build the product for this person)

> **"The food-curious urban sharer" — 22–30, lives in a dense, grocery-rich neighborhood (Brooklyn, East LA, Atlanta), shops at 2+ stores a week, cooks 3–5 nights, and posts food content on TikTok/IG. Budget-conscious but will splurge on one cool ingredient. Comes for the aesthetic and the game; stays for the streak.**

This is Zara Malik (Profile 1) with a bit of Jaylen (Profile 6). Why this person is the ICP and not the others:
- **They power the flywheel best.** They check in often (data density), they share pixel art (free acquisition), and they cluster geographically in your launch cities (sellable zip-code data).
- **They're cheapest to acquire.** They're already on the exact channels (TikTok, IG) where your viral loop lives — CAC ≈ time, not cash.
- **They convert.** Aesthetic + gamification + community is a proven willingness-to-pay bundle for this cohort at $4.99.

Every roadmap decision should be scored against this person first. If Zara wouldn't use it, it's a secondary priority.

### 2.2 Secondary segments (serve them, don't build for them yet)

| Segment | Example persona | Why they matter | What NOT to do |
|---------|-----------------|-----------------|----------------|
| Budget multi-store families | Elena (21, East LA), Priya (44, TX) | Highest-value B2B data (multi-store behavior) even as free users | Don't over-invest in family/meal-plan features pre-PMF |
| Power collectors / superfans | David Kim (38, Koreatown) | Drive coin-pack + Premium+ revenue, high LTV | Don't build Premium+ until you have 500 Premium users |
| Fitness / health trackers | Marcus (31), Sofia (33) | Retention via macro/nutrition tracking | Nice-to-have; not core loop |

### 2.3 The metric implication: you need per-segment metrics, not just blended ones

Right now every number in your docs is **blended** (e.g., "$1.15 blended RPU"). That hides the truth. A PM must segment. The three cuts that matter most for Dig In:

1. **By monetization behavior:** Free / Premium / Coin-buyer / Premium+ — needed for real ARPU (Part 3.5).
2. **By engagement tier:** Casual (1 check-in/wk) / Regular (2–4) / Power (5+) — needed for coin-economy balance and retention (Part 6).
3. **By geography (zip cluster):** the unit of B2B value — needed to know when a zip is "sellable."

You are missing all three cuts today. Defining them is a Part 7 deliverable.

---

## PART 3: THE FULL METRIC TAXONOMY (WHAT A PM OWNS)

This is the complete set of product metrics a PM for a consumer + B2B app must track, organized by the AARRR framework (Acquisition → Activation → Engagement → Retention → Revenue → Referral) plus product-health and B2B. For each: what it is, the formula, a stage-appropriate target, and — most importantly — **whether you can measure it today.**

Status key: ✅ measurable now · 🟡 partially instrumented · ❌ not measurable yet (no data / not tracked / blocked by fake auth).

### 3.1 Acquisition — are new people arriving, and how?

| Metric | Formula | Target (Month 6) | Status |
|--------|---------|------------------|--------|
| New users / week | Count of new real signups | Growing 15–25% WoW | ❌ auth is mocked — no real signups |
| Traffic → signup conversion | Signups ÷ unique visitors | 20%+ | ❌ no funnel instrumented |
| CAC (blended) | Marketing spend ÷ new users | < $3 free, < $25 premium | ❌ no attribution set up |
| Acquisition by channel | New users grouped by source | Know your top 3 | ❌ no UTM / source tracking |
| Install → open rate | First opens ÷ installs | 60%+ | ❌ PWA/app install not tracked |

**PM takeaway:** You can't yet answer "where do users come from?" — the single most important acquisition question. UTM tagging + a real signup event are prerequisites.

### 3.2 Activation — did the new user reach the "aha" moment?

This is the metric category you are most dangerously missing, because **you have never defined what activation *is* for Dig In.** Without an activation definition, you can't measure it, and you can't improve the thing that most determines retention.

> **Proposed activation definition: a new user is "activated" when they complete their first verified check-in AND either save a recipe or create one pixel-art item, within 48 hours of signup.**

That's two core-loop actions inside two days — it captures "they got the point of the app." From `UX_METRICS_PLAN.md`, time-to-first-check-in should be under 2 minutes.

| Metric | Formula | Target | Status |
|--------|---------|--------|--------|
| Activation rate | Activated users ÷ new users | 35–45% | ❌ activation undefined + not tracked |
| Time to first check-in | Median minutes signup → 1st check-in | < 2 min | 🟡 `checkin` event exists, no signup anchor |
| Onboarding completion | Finished onboarding ÷ started | 70%+ | ❌ OnboardingModal not instrumented |
| First-session action rate | % who do any core action in session 1 | 60%+ | 🟡 some events exist, no session model |

### 3.3 Engagement — are activated users using the core loop?

| Metric | Formula | Target | Status |
|--------|---------|--------|--------|
| DAU / MAU (stickiness) | DAU ÷ MAU | 30%+ | ❌ no real users to count |
| Check-ins per active user / wk | Total check-ins ÷ WAU | 3+ | 🟡 `checkin` tracked; no WAU denominator |
| Recipe completion rate | "Cooked" marks ÷ recipe views | 15–25% | ❌ no "cooked" event; button doesn't exist yet |
| Pixel-art creation rate | % of MAU who create ≥1 art in 30d | 40%+ | 🟡 `finished_dish_pixelated` exists, partial |
| Coin velocity | Coins earned + spent per WAU | Trend up | ❌ coin earn/spend not tracked as events |
| Session length / frequency | Avg minutes & sessions per user | Trend up | ❌ no session instrumentation |
| Feature adoption | % using each core feature | Know top/bottom | 🟡 a few features fire events, most don't |

**PM takeaway:** Check-in and pixel-art are your two lit-up features. Recipe completion, coins, and sessions are dark — and recipe completion is half your core loop. The "Cook It" button from the UX plan is a prerequisite to measuring the cook half of the loop.

### 3.4 Retention — do they come back? (the metric that decides everything)

| Metric | Formula | Target | Status |
|--------|---------|--------|--------|
| D1 retention | % back 1 day after signup | 40%+ | ❌ no cohort tracking |
| D7 retention | % back 7 days after signup | 20–25%+ | ❌ no cohort tracking |
| D30 retention | % back 30 days after signup | 10%+ | ❌ no cohort tracking |
| Streak: avg length | Mean consecutive check-in days | 8+ | ❌ streak computed in UI, not logged |
| Rolling retention / resurrection | % of churned who return | Track | ❌ |
| Weekly retention curve (cohort) | Retention by weekly signup cohort | Flattens > 0 | ❌ |

Retention is the highest-leverage category and you have **zero** of it measurable today. This is the "leaky bucket" risk called out in `INVESTOR_METRICS`. It's also the first thing a technical investor checks. Cohort retention requires real auth + a durable user ID + event timestamps — none of which exist while auth is mocked.

### 3.5 Revenue — RPU, ARPU, and the money metrics (the "RPU and etc." you asked about)

You have RPU *targets* in `FINANCIAL_MODEL.md` and `MARKET_STRATEGY.md` ($1.15 blended/month, ~$18–22/yr with data value). What you're missing is (a) the **per-segment** breakdown, (b) any way to measure actuals, and (c) several standard revenue metrics that aren't in your docs at all.

First, the vocabulary, because RPU and ARPU get used loosely:

- **ARPU** = Average Revenue Per **User** (all users, incl. free) = total revenue ÷ all active users. This is your "$1.15/mo blended."
- **ARPPU** = Average Revenue Per **Paying** User = total revenue ÷ paying users only. Always much higher; you don't currently compute it.
- **RPU** as you've used it = the same idea as ARPU. Keep one term. Recommend: use **ARPU** (blended) and **ARPPU** (payers) and retire the ambiguous "RPU."

| Metric | Formula | Target / Value | Status |
|--------|---------|----------------|--------|
| ARPU (blended, monthly) | Total consumer rev ÷ all active users | $1.15 | ❌ no billing/rev events |
| ARPPU (payers only) | Consumer rev ÷ paying users | ~$4.60 (derive) | ❌ |
| Premium conversion rate | Premium subs ÷ active users | 10–18% | ❌ no subscription state |
| Coin-pack buyer rate | Coin buyers ÷ active users | 8–12% | ❌ no purchase events |
| Avg coin-pack purchase | Coin revenue ÷ coin buyers | ~$4.00–4.50 | ❌ |
| MRR | Σ subscription + B2B monthly rev | Seed: $10–30K | ❌ no Stripe yet |
| MRR growth rate | (This mo − last mo) ÷ last mo | 15–25% MoM | ❌ |
| Gross margin | (Rev − direct cost) ÷ rev | 85–93% | 🟡 computable from cost est. |
| LTV | ARPU × avg months retained | ≥ 3× CAC | ❌ needs retention + ARPU |
| LTV : CAC | LTV ÷ CAC | 3:1 min, 5:1+ great | ❌ |
| CAC payback (months) | CAC ÷ (ARPU × gross margin) | < 12 mo | ❌ |

**PM takeaway:** none of your revenue metrics are measurable because there is no payments integration (Stripe) and no subscription/purchase events. Even after Stripe, you need ARPPU and CAC payback, which aren't in your existing docs.

### 3.6 Referral / Virality — does each user bring more users?

| Metric | Formula | Target | Status |
|--------|---------|--------|--------|
| Viral coefficient (k) | Invites sent × conversion per user | > 0.5 | ❌ no referral tracking |
| Pixel-art shares / user | Shares ÷ WAU | Trend up | ❌ share button not built (per UX plan) |
| Referral signup rate | Signups from referral codes ÷ total | 15%+ | ❌ referral codes not implemented |
| K-factor by content type | Which shares actually convert | Know it | ❌ |

Your entire acquisition thesis is "pixel art is viral on TikTok." **You cannot currently prove or measure that**, because there's no share button and no referral attribution. This is the highest-ROI instrumentation to add, because it validates the core growth assumption.

### 3.7 B2B / data-product metrics (the side investors care most about)

| Metric | Formula | Target | Status |
|--------|---------|--------|--------|
| Data density per zip | Verified check-ins / active users per zip | 50–100 MAU/zip | ❌ not aggregated |
| B2B clients signed | Count of paying stores/brands | 5+ by Mo 6 | ❌ zero today |
| B2B MRR | Σ monthly B2B contracts | $2,000+ | ❌ |
| NRR (net revenue retention) | (Start + expansion − churn) ÷ start | 100%+, aim 120% | ❌ no clients |
| Report delivery rate | On-time reports ÷ due | 100% | ❌ |
| Time-to-sellable-zip | Weeks for a zip to hit density threshold | Track | ❌ |
| Fake/invalid check-in rate | Rejected check-ins ÷ attempts | < 2% | ❌ no GPS verification built |

The last row is critical: until GPS verification exists (VC Gap #12), your data is unsellable, so "data density" is a vanity number. Verification is a product requirement *and* a metric.

---

## PART 4: THE METRICS YOU ARE STILL MISSING (DIRECT ANSWER)

This is the answer to your question, in priority order. "Missing" here means one of three things: **(A) not defined** (you've never decided what it means), **(B) not measurable** (no data pipeline), or **(C) not in any of your docs at all.**

### The 12 gaps that matter most

1. **North Star Metric** — *(A) not defined.* You have no single top metric. Recommend Weekly Verified Check-ins (Part 1.4). Nothing else can be prioritized without this.
2. **Activation definition + rate** — *(A) + (B).* You've never defined "activated." This is the #1 driver of retention and you can't see it. (Part 3.2.)
3. **The retention suite (D1/D7/D30 + cohort curves)** — *(B) blocked by fake auth.* Zero retention is measurable. Investors check this first.
4. **A single Ideal Customer Profile** — *(A).* You have 10 personas but no chosen ICP to build against. (Part 2.1.)
5. **Per-segment ARPU + ARPPU** — *(A) + (C).* You only have blended RPU. ARPPU (revenue per *paying* user) is absent from every doc.
6. **The activation/core-loop funnel** — *(C).* No step-by-step drop-off funnel from open → check-in → recipe → cook → pixel → share exists anywhere.
7. **Viral coefficient (k) + share metrics** — *(B) + (C).* Your growth thesis is virality, and it is entirely unmeasured (no share button, no referral codes).
8. **Recipe completion rate** — *(B).* Half your core loop (the "cook" half) has no completion event and no "Cook It" button to fire one.
9. **Coin-economy health metrics** — *(A) + (B).* Earn rate, spend rate, sink balance, coins-outstanding. In-app economies break without these (VC Gap #14).
10. **CAC, LTV, LTV:CAC, CAC payback** — *(B).* No attribution and no billing, so none of the unit-economics ratios are real yet.
11. **B2B data density per zip + fake-check-in rate** — *(B).* The metrics that decide whether data is *sellable*, not just collected.
12. **A metric dictionary + owner + cadence** — *(C).* No agreed definitions, no single owner, no review rhythm. Two docs can define "retention" differently and nobody would notice.

### Why you can't just "start tracking" — the instrumentation reality

Most of the above are ❌ for the same root reason, and a PM has to understand it: **you cannot measure user behavior over time without a stable, real user identity.** Today:

- **Auth is mocked** (`authService.js` returns hardcoded data via `setTimeout`). No real user IDs means no cohorts, no retention, no per-user ARPU, no funnel that survives a page reload. This single fact blocks ~70% of the metrics above.
- **PostHog is installed but partial.** `src/lib/analytics.js` exists and `track()` fires on: `checkin`, `commute_planned`, `commute_stop_clicked`, `badge_earned`, `recipe_alchemized(_saved)`, `smartfinder_search`, `smartfinder_scan_add`, `finished_dish_pixelated`. That's it. **Missing events:** `signup`, `login`, `onboarding_started/completed`, `recipe_viewed`, `recipe_cooked`, `pixel_created`, `pixel_shared`, `coins_earned`, `coins_spent`, `subscription_started`, `coin_pack_purchased`, `referral_sent/redeemed`. And `VITE_POSTHOG_KEY` must be set in prod or nothing sends at all.
- **No payments.** No Stripe = no revenue events = no ARPU/MRR/LTV actuals.
- **No GPS verification.** Check-ins can be faked, so even the check-in data you *do* have isn't yet trustworthy enough to sell or to trust as your NSM.

**The unlock sequence** (this is the order that makes metrics appear): real auth → identify users in PostHog → fire the missing core-loop events → add Stripe + billing events → add GPS verification → build the funnel/retention/cohort dashboards on top. You don't need all of it at once, but retention and revenue metrics literally cannot exist before the first two steps.

### The minimum event schema to instrument (hand this to whoever builds it)

```
identify(user_id, { signup_date, city, zip_cluster, plan })

signup                { source, utm_campaign }
onboarding_completed  { seconds_elapsed }
checkin               { store_id, zip, gps_verified: true/false }   // add gps_verified
recipe_viewed         { recipe_id, cuisine }
recipe_cooked         { recipe_id }                                  // needs "Cook It" button
pixel_created         { item_type }
pixel_shared          { destination }                               // needs share button
coins_earned          { amount, source }
coins_spent           { amount, item }
subscription_started  { plan, price }                               // needs Stripe
coin_pack_purchased   { pack, price }
referral_redeemed     { referrer_id }
```

Every ❌ in Part 3 turns into a ✅ once its event above is firing against a real `user_id`.

---

## PART 5: UNIT ECONOMICS A PM MUST OWN

Investors and your own runway both live here. Beyond the target numbers already in `FINANCIAL_MODEL.md`, these are the ones a PM should be able to derive on demand:

- **ARPU (blended):** total revenue ÷ all active users. Your $1.15/mo. Watch the trend, not the absolute.
- **ARPPU:** total revenue ÷ *paying* users only. If 250 of 1,000 users pay and they generate $1,150, ARPPU = $4.60. This tells you how much a converted user is actually worth — critical for deciding how hard to push conversion vs. growth.
- **LTV:** ARPU × average lifetime in months. With retention unknown, LTV is currently a guess. This is why retention instrumentation is a *revenue* project, not just an engagement one.
- **CAC payback period:** months to earn back acquisition cost = CAC ÷ (ARPU × gross margin). Under 12 months is healthy for consumer; your organic channels should make this near-instant.
- **Contribution margin per user:** ARPU minus per-user variable cost (infra, payment fees). At ~$100–350/mo infra, this is very high — a genuine strength to state.
- **Coin liability:** total coins outstanding × implied cash value (100 coins ≈ $1). An unbudgeted coin balance is a hidden liability and an inflation risk — track coins issued vs. redeemed monthly.

---

## PART 6: THE COIN ECONOMY — A METRIC SYSTEM OF ITS OWN

Your coins are the retention engine *and* a currency you're effectively printing. VC Gap #14 flags that you haven't modeled it. A PM owns these:

| Metric | Why it matters | Healthy signal |
|--------|----------------|----------------|
| Earn rate / user / week | Are coins too easy to get? | Stable, capped daily |
| Spend rate / user / week | Are there enough things to buy? | ≈ earn rate |
| Coins outstanding (float) | Inflation risk | Not growing unbounded |
| Sink coverage | Do sinks scale with earning? | New sinks added on cadence |
| Earn : spend ratio by tier | Casual vs. power balance | Power users still have goals |

The failure mode: a power user hits 50,000 coins with nothing to buy, coins feel worthless, purchasing (real revenue) collapses. Prevent it with a daily earning cap and a steady pipeline of coin sinks (seasonal outfits, exclusive recipes). Model earn vs. spend per engagement tier *before* you scale.

---

## PART 7: WHAT A PM MUST ACCOMPLISH (PRIORITIZED DELIVERABLES)

Concrete artifacts and decisions you personally need to produce. Ordered so each unlocks the next.

**P0 — define the system (this week, no engineering needed):**
1. **Pick the North Star Metric** and write it down (recommend Weekly Verified Check-ins). One sentence, posted where you'll see it daily.
2. **Write the activation definition** (first verified check-in + one recipe/pixel action within 48h). This becomes a measurable goal the moment events exist.
3. **Choose the single ICP** (the food-curious urban sharer) and demote the other nine personas to secondary. Score the roadmap against it.
4. **Write the metric dictionary** — one page, every metric name → exact formula → owner → target. Kills the "two docs, two definitions" problem. (Appendix A is your starting draft.)

**P1 — make metrics measurable (unblocks ~70% of Part 3):**
5. **Ship real auth** (Supabase — already a dependency) and `identify()` users in PostHog. This is the master unlock.
6. **Instrument the missing events** (Part 4 schema). Prioritize the core-loop funnel first: signup → checkin → recipe_cooked → pixel_shared.
7. **Build the "Cook It" and "Share" buttons** — not just UX wins, they're the sensors for recipe-completion and virality, two currently-dark metrics.
8. **Add GPS verification** to check-ins — turns check-in data from vanity into sellable, and makes your NSM trustworthy.

**P2 — turn on revenue + growth measurement:**
9. **Integrate Stripe** and fire subscription/coin-pack events → ARPU, ARPPU, MRR, conversion become real.
10. **Add referral codes + UTM tagging** → viral coefficient and channel CAC become real.
11. **Stand up one dashboard** (PostHog + a simple funnel/retention/revenue view) as your weekly source of truth. Consider a live artifact so you can reopen it each morning.

**P3 — the B2B metric layer:**
12. **Aggregate check-ins by zip** and define your "sellable density" threshold (start ~50–100 MAU/zip); track time-to-sellable per zip.
13. **Model the coin economy** (Part 6) before scaling.

### Priority-vs-effort snapshot

| Deliverable | Impact | Effort | When |
|-------------|--------|--------|------|
| North Star + activation + ICP + metric dictionary | Foundational | Low (thinking) | Now |
| Real auth + PostHog identify | Unlocks everything | Med | Next |
| Core-loop event instrumentation | High | Med | Next |
| Cook It + Share buttons | High (2 dark metrics) | Med | Next |
| GPS verification | High (B2B unlock) | Med | Soon |
| Stripe + revenue events | High | Med | Soon |
| Referral + UTM | High (validates virality) | Med | Soon |
| Weekly dashboard | High | Low once events flow | After events |
| Zip density + coin model | Med | Med | Before scaling |

---

## PART 8: HOW A PM REVIEWS THESE (CADENCE)

Metrics you don't look at on a rhythm don't get managed. Suggested cadence once data is flowing:

- **Daily (30 seconds):** North Star (Weekly Verified Check-ins, trailing 7d) and yesterday's new users. Just direction.
- **Weekly (30 min):** Activation rate, the core-loop funnel (where's the biggest drop-off?), D1/D7 retention for the newest cohort, viral coefficient. Pick *one* drop-off to attack next week.
- **Monthly (1–2 hrs):** ARPU/ARPPU, MRR + growth rate, conversion, cohort retention curves, coin-economy balance, B2B pipeline + density per zip. This is your investor-update data.
- **Quarterly:** LTV:CAC, CAC payback, NRR, TAM progress. Re-check whether the North Star is still the right one.

The rule: **weekly you optimize the funnel, monthly you optimize the economics, quarterly you optimize the strategy.**

---

## APPENDIX A: METRIC DICTIONARY (QUICK REFERENCE)

| Metric | Formula | Stage target | Owner |
|--------|---------|--------------|-------|
| North Star: Weekly Verified Check-ins | Σ GPS-verified check-ins / 7d | Grow WoW | PM |
| Activation rate | Activated ÷ new users | 35–45% | PM |
| D1 / D7 / D30 retention | % back at day N | 40 / 22 / 10% | PM |
| DAU/MAU | DAU ÷ MAU | 30%+ | PM |
| Check-ins per WAU | Check-ins ÷ WAU | 3+ | PM |
| Recipe completion | Cooked ÷ viewed | 15–25% | PM |
| Pixel creation rate | Creators ÷ MAU (30d) | 40%+ | PM |
| Viral coefficient (k) | Invites × conv/user | > 0.5 | PM |
| ARPU (blended) | Rev ÷ all active users | $1.15/mo | PM/Finance |
| ARPPU | Rev ÷ paying users | ~$4.60+/mo | PM/Finance |
| Premium conversion | Premium ÷ active | 10–18% | PM |
| MRR / MRR growth | Σ monthly rev / MoM % | 15–25% MoM | Founder |
| Gross margin | (Rev−cost) ÷ rev | 85–93% | Finance |
| LTV : CAC | LTV ÷ CAC | 3:1+ | PM/Finance |
| CAC payback | CAC ÷ (ARPU×margin) | < 12 mo | PM/Finance |
| B2B MRR / clients | Σ contracts / count | $2K+ / 5+ | Founder |
| NRR | (start+exp−churn)÷start | 100%+ | Founder |
| Data density / zip | Verified check-ins/users per zip | 50–100 MAU/zip | PM |
| Fake check-in rate | Rejected ÷ attempts | < 2% | PM/Eng |

## APPENDIX B: RELATED DOCS

- `FINANCIAL_MODEL.md` — pricing tiers, coin-pack economics, RPU math, break-even.
- `MARKET_STRATEGY.md` — 10 personas (source for the ICP), channel plan, RPU walkthrough.
- `INVESTOR_METRICS_AND_FUNDRAISING.md` — investor-facing metric benchmarks + fundraising.
- `VC_DUE_DILIGENCE_GAPS.md` — the technical/legal gaps (auth, verification, entity) that block measurement here.
- `UX_METRICS_PLAN.md` — the UX changes (streak in nav, Cook It / Share buttons) that create the sensors for the dark metrics above.

---

*Product Metrics & Operating Framework · Dig In · July 2026 · Confidential*
*This is the PM layer: it defines the metric system, names what's missing, and lists what to build to make it all measurable.*
