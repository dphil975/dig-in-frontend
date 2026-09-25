# Dig In — Financial Model, Pricing & Passive Income Plan
### Olive Phillips | July 2026

---

## SIMPLE VERSION (Start Here)

**The big idea:** Dig In has 5 ways to make money. Three of them run completely on their own — you don't have to do anything after setup. That's your passive income.

Here's the short version of each:

| # | Income Stream | How Passive? | When It Starts |
|---|--------------|--------------|----------------|
| 1 | Premium subscriptions ($4.99/mo) | 100% — Stripe bills them automatically | When you add Stripe |
| 2 | Coin pack purchases | 100% — impulse buys, fully automatic | When you add Stripe |
| 3 | Ad revenue | 100% — ads run 24/7, money deposits weekly | After 1,000 users |
| 4 | B2B data reports | 90% — reports generate automatically, you email PDF | After first client |
| 5 | Sponsored recipes | 50% — brands pay upfront, you schedule the post | Once you have traffic |

**The one thing to understand:** You don't need millions of users to make real money. You need a few hundred loyal users AND a few grocery store clients. Those two together can cover your living expenses faster than you think.

---

## PART 1: EXACT PRICING — WHAT TO CHARGE

### Consumer Pricing (The App Users)

**Free Tier — $0**
What they get: The core app. Map, recipes, pixel art basics, 50 starting coins, 3 check-ins per day, standard leaderboard.

Why offer free at all: Free users generate the behavioral data that makes the B2B product worth paying for. A free user who checks in at a grocery store 3× a week is worth $3–5/year to you in data value, even if they never pay a cent. Never make the app paid-only. The free tier is the engine.

---

**Premium — $4.99/month or $39.99/year**

What's the right price? $4.99 is the sweet spot for a food lifestyle app. It's below the psychological resistance of $5 ("basically free"), converts at 10–18% of active users, and is competitive with Yummly Premium ($4.99) and Food52 ($4.99). Do not charge $9.99 at launch — you don't have enough brand trust yet.

What premium users get:
- Unlimited daily check-ins (vs. 3 on free)
- Access to all 26,000+ recipes (free gets the top 500 per cuisine)
- Exclusive monthly pixel art outfit drops (only premium can unlock)
- No ads — completely ad-free experience
- Advanced craving compass with dietary filters
- Priority access to new features

Annual plan ($39.99) saves the user $19.89 vs. paying monthly. Push this hard — it locks in a full year of revenue and reduces churn.

**Stripe processing fee:** 2.9% + $0.30 per transaction
- Monthly: $4.99 → Stripe takes $0.44 → You keep $4.55
- Annual: $39.99 → Stripe takes $1.46 → You keep $38.53

---

**Coin Packs — One-Time Purchases**

Coins are earned by playing but can also be bought. This is a low-friction impulse purchase — someone wants an outfit NOW and doesn't want to wait 2 weeks to earn enough coins.

| Pack Name | Price | Coins | After Stripe Fee | Target Buyer |
|-----------|-------|-------|-----------------|--------------|
| Quick Top-Up | $1.99 | 100 coins | $1.64 | Casual — just needs a little more |
| Booster Pack | $4.99 | 300 coins | $4.40 | Regular user, impatient |
| Big Bag | $9.99 | 700 coins | $9.40 | Dedicated user, loves collecting |
| Collector's Bundle | $19.99 | 1,600 coins | $18.89 | Superfan, wants everything |

**Important pricing rule:** 100 coins = about $1.00 worth of value (the cheapest outfit costs 50 coins). This makes the math feel fair to users. Never inflate coin prices — it feels scammy and kills trust.

**Expected behavior:** About 8–12% of free users and 15–20% of premium users buy at least one coin pack per month. Average purchase: ~$4.50.

---

**Premium+ Tier (Add After Month 6) — $9.99/month**

Once you have 500+ premium users and solid reviews, add a second tier:
- Everything in Premium
- Early access to new features before free users
- Personalized weekly meal plan (AI-generated, 5 recipes)
- Recipe history — your full cooking journal going back forever
- Family account (up to 4 profiles under one plan)

This tier captures the power users who want more than $4.99 gives. David Kim (from the customer profiles) is already the target — he'd pay this immediately.

---

### B2B Pricing (Grocery Stores & Brands)

This is where the serious revenue is. Price these with confidence — you are providing something these businesses cannot get anywhere else.

**How to think about pricing B2B:**
A grocery store that does $1.5M/year in revenue earns about $150,000 in gross profit (10% margin is typical for grocery). If your data helps them stock better, reduce waste, and win back 10 customers from a competitor, you could easily add $15,000–$30,000 to their profit. Charging them $299/month ($3,588/year) for that is a bargain. Never underprice this.

---

**Basic — $299/month per location**

Who it's for: Independent stores, single location, first-time B2B clients.

What they get:
- One zip code monthly report
- Trending ingredients in their neighborhood
- Peak shopping hour breakdown by day
- Their estimated market share vs. nearby stores
- Substitution search insights (what people couldn't find)
- Delivered as a clean PDF on the 1st of each month

Setup time for you: About 30 minutes to configure the Python report generator for their zip code. After that it runs automatically.

Annual contract: $2,999/year (saves them ~$589 vs. monthly). Always offer annual — guaranteed income is better than monthly churn risk.

---

**Standard — $799/month**

Who it's for: Small regional chains (3–10 stores), stores that want more depth.

What they get:
- Up to 5 zip code reports
- Cross-location comparison (which of their stores is performing better)
- Competitive set analysis (how they compare to all stores in the area)
- Monthly trend snapshot with charts (not just a PDF — a short deck)
- Email delivery + web dashboard access (read-only)
- Quarterly strategy call with you (1 hour)

Note on the quarterly call: This keeps clients engaged and feeling valued. It's 4 hours of your time per year per client — worth it to keep an $800/month contract.

---

**Premium — $1,999/month**

Who it's for: Regional chains (10–25 stores), CPG brands, serious buyers.

What they get:
- Up to 20 zip code reports
- API access — they pull data into their own systems
- Custom filter parameters (cuisine type, demographics, time ranges)
- Dedicated Slack channel with you for questions
- Bi-monthly strategy call
- Raw data export (CSV) for their internal analysts

The API access requirement means you need to build one additional endpoint in your Flask backend. This is the unlock for enterprise-scale clients.

---

**Enterprise — Custom (estimate $3,000–$8,000/month)**

Who it's for: Large grocery chains (25+ stores), national CPG brands.

Do not post this price publicly. These clients have procurement budgets and will pay more than you think. The conversation goes: "Tell me what you need, I'll tell you what it costs." This is custom scope, custom delivery, custom contract terms.

At even ONE enterprise client at $4,000/month, that's $48,000/year from a single account.

---

**Sponsored Recipes (Ad-Adjacent, Flat Fee)**

A CPG brand (say, a hot sauce company) pays to have their product featured in 4 recipes per month as the hero ingredient. It looks like content, not an ad.

Rate: $500–$2,000/month depending on your active user count.

At 500 users: $500/month is fair.
At 5,000 users: $1,500/month is fair.
At 50,000 users: $5,000+/month is fair.

This is sold directly to brands via email. No ad network needed. High margin, high quality for users (the recipes are actually good).

---

## PART 2: AD REVENUE — THE PASSIVE MONEY ENGINE

### What Ads Are Worth

Ads pay based on CPM — "Cost Per Mille" — meaning how much advertisers pay for 1,000 ad views (impressions). Food and lifestyle apps command premium CPM rates because the audience is valuable to food brands.

**Expected CPM rates for Dig In:**
- Google AdMob (automated): $8–$14 CPM
- Meta Audience Network: $10–$18 CPM
- Direct CPG brand deals (you negotiate directly): $25–$50 CPM
- Rewarded video ads (user watches to earn coins): $15–$25 CPM

For planning purposes, use **$12 CPM blended** — that's conservative and realistic.

---

### Where Ads Go in the App (Without Ruining It)

The placement of ads matters as much as the price. Bad placement kills retention. Here's exactly where ads belong in Dig In:

**✅ WHERE TO PUT ADS:**

**1. Recipe Feed — Native Cards (Best option)**
Every 5th recipe in the browse feed is a "Featured Recipe" sponsored by a CPG brand. It looks exactly like a real recipe card — same design, same format. The only difference is a tiny "Sponsored" label in the corner.
Revenue per 1,000 recipe views: ~$14–20 (higher CPM because it's native content)

**2. Map Page — Featured Store Pin**
A grocery store pays $50–150/month to have their map pin highlighted in green with a star. Users see it as a helpful discovery tool, not an intrusive ad. The store gets visibility; you get flat monthly revenue.
Revenue: $50–150/flat fee per store pin, per month

**3. Rewarded Video — "Watch for Coins" (Best UX)**
Before or after a recipe cook, show a 15-second video ad. The user earns 10 coins for watching. They WANT to watch because coins are valuable to them.
Revenue per completed view: ~$0.02–$0.04 (seems small — but 100 users watching 1 video/day = $60–120/month just from video)
User experience: Positive — they feel rewarded, not interrupted

**4. Leaderboard Page — Banner Ad (Lowest intrusion)**
A simple banner at the very bottom of the leaderboard. Users spend time on this page but aren't doing anything requiring full focus.
Revenue: ~$8–10 CPM, lowest value placement

**5. Loading Screens — Interstitial (Use sparingly)**
A full-screen ad shown while the map or recipe feed loads. Maximum once per session. Only show this to free users who have been active 5+ minutes.
Revenue: $12–18 CPM, but overuse kills retention. Cap at 2 per session maximum.

---

**❌ WHERE TO NEVER PUT ADS:**

- Inside the pixel art creator — this is the user's creative sanctuary
- During the check-in flow — breaks the reward moment
- Mid-recipe step instructions — dangerous (user is literally cooking)
- First 2 minutes of the session for new users — they haven't decided to stay yet

---

### Ad Revenue Calculator

This shows what you'll make from ads at different user counts:

**Assumptions:**
- Average free user sees 3 ad impressions per day
- 22 active days per month (not every day)
- 66 impressions per free user per month
- Blended CPM: $12

| Free Users | Monthly Impressions | Monthly Ad Revenue | Annual Ad Revenue |
|------------|--------------------|--------------------|------------------|
| 100 | 6,600 | $79 | $950 |
| 500 | 33,000 | $396 | $4,752 |
| 1,000 | 66,000 | $792 | $9,504 |
| 5,000 | 330,000 | $3,960 | $47,520 |
| 10,000 | 660,000 | $7,920 | $95,040 |
| 50,000 | 3,300,000 | $39,600 | $475,200 |

**The important insight:** Ad revenue doesn't become meaningful until you have 1,000+ free users. Before that, focus on Premium subscriptions and B2B deals. But once you hit 1,000 users, ads become a real income stream that runs completely automatically.

---

### How to Set Up Ads (Step by Step)

Setting up ads is a one-time technical task — after that it's fully passive.

**Step 1:** Create a Google AdSense account and add Dig In as a web property. Approval takes 2–7 days.

**Step 2:** Install the AdSense JavaScript snippet in your React app's `index.html`. One line of code. AdSense automatically chooses what ads to show based on your audience.

**Step 3:** For rewarded video ads, use Google AdMob for web or integrate with a network like IronSource. Set the trigger to show after a recipe view or map interaction.

**Step 4:** For direct CPG brand deals, create a simple "Advertise with Dig In" page once you have 1,000+ users. List your rate card. Brands will reach out.

**Time to set up:** About 4–6 hours of work. After that, money deposits to your bank account automatically (Google pays every month on Net-30 terms — you get paid 30 days after the month ends).

---

## PART 3: PASSIVE INCOME — WHAT RUNS WHILE YOU SLEEP

Passive income means money that comes in automatically without you doing new work every time. Here is Dig In's full passive income picture:

---

### Passive Stream 1: Monthly Subscriptions (Stripe Auto-Billing)

How it works: User enters their credit card once. Stripe automatically charges them on the same date every month. You do nothing. The money appears in your bank account 2 business days after each charge.

What you do once: Set up a Stripe subscription product at $4.99/month. Paste the Stripe checkout link into your Premium upgrade button. Done.

What happens automatically every month:
- Stripe charges every subscriber
- Supabase updates their subscription status to "active"
- The app gives them premium features
- Failed payments get automatically retried 3 times
- Cancellations are processed automatically

Your effort per month: Zero.

**Example:** 100 premium subscribers = $499/month = $5,988/year. No work required after initial setup.

---

### Passive Stream 2: Coin Pack Sales (One-Time Purchases)

How it works: User taps "Buy Coins," sees price, taps confirm. Stripe processes immediately. Coins appear in their wallet. You do nothing.

Your effort per month: Zero after setup.

**Example:** If 50 users/month buy coin packs at an average of $4.50 each = $225/month = $2,700/year. Fully automatic.

---

### Passive Stream 3: Ad Revenue (AdSense Auto-Delivery)

How it works: AdSense runs ads automatically based on who is using your app. You set it up once. Google handles everything — choosing what ad to show, tracking impressions, collecting money from advertisers, and depositing your cut.

Google's cut: 32% (you keep 68% of ad revenue).

Your effort per month: Zero. Log in once a month to see earnings report if you want.

**Example:** 2,000 free users → $1,584/month in ad revenue. Deposited automatically. You did nothing.

---

### Passive Stream 4: B2B Monthly Reports (90% Automated)

How it works: Your Python DataMonetization module generates reports automatically. You set up a cron job (scheduled task on your server) to run on the 28th of each month. It produces a PDF. You (or eventually a VA for $15) emails it to the client.

Your effort per month: 10 minutes to review and send the PDF. That's it.

**Example:** 5 grocery store clients at $299/month = $1,495/month. For 50 minutes of your time total.

When it becomes 100% passive: When you build the client-facing dashboard (a few weeks of work), clients log in and download their own report. You never touch it.

---

### Passive Stream 5: Annual Subscriptions (Pre-Paid Revenue)

When a user pays $39.99/year upfront, that $39.99 hits your account immediately — you have it now even though the service runs for 12 months. This is cash-flow positive (you get paid before delivering the service).

**Why this matters:** If you convert 50 users to annual plans in one month, that's $2,000 in your account immediately. It feels like a payday even though it's spread service.

---

### Total Passive Income Picture by Milestone

| Milestone | Monthly Passive Revenue | What's Running |
|-----------|------------------------|----------------|
| After setup (0 users) | $0 | Nothing yet |
| 100 users, 0 B2B | $128 | Subscriptions + ads |
| 500 users, 2 B2B stores | $1,450 | All streams at low volume |
| 2,000 users, 5 B2B stores | $6,800 | Strong across all streams |
| 10,000 users, 20 B2B stores | $28,000 | Significant passive income |
| 50,000 users, 50 B2B stores | $105,000+ | Real business |

---

## PART 4: BREAK-EVEN ANALYSIS

### What Does Dig In Actually Cost to Run?

Before you can make money, you need to know what it costs to operate the app each month. The good news: software infrastructure is very cheap at early scale.

**Monthly Operating Costs:**

| Expense | Free Tier | Paid (Growth) | Notes |
|---------|-----------|---------------|-------|
| Vercel (hosting) | $0 | $20/month | Free until you need team features |
| Supabase (database) | $0 | $25/month | Free up to 500MB, 50K MAU |
| Railway (Flask backend) | $0 | $7/month | Free tier → paid when usage grows |
| Domain name | $1/month | $1/month | ~$12/year |
| Stripe | 2.9% + $0.30 | 2.9% + $0.30 | Per transaction, no monthly fee |
| AdSense | $0 | $0 | No cost — they pay you |
| Claude API (AI features) | $5–15/month | $20–50/month | Based on usage |
| **Total infrastructure** | **~$6/month** | **~$103/month** | Very low overhead |

**One-time setup costs (if you hire help):**
- Stripe integration: ~4–8 hours (you or a contractor at $50–100/hr = $200–800 one-time)
- Real auth setup: ~4 hours ($200–400 one-time)
- Backend deployment: ~2 hours ($100–200 one-time)
- Privacy policy + legal (from attorney today): ~$300–500

Total to launch properly: ~$800–2,000 one-time.

---

### Break-Even: How Many Users/Clients You Need to Cover Costs

Monthly operating cost at early stage: **~$100/month** (being generous)

| What it takes to break even ($100/month): |  |
|---|---|
| Premium subscribers only | 20 subscribers at $4.55 net = $91 ✓ |
| B2B clients only | 1 Basic store at $299 ✓ |
| Ads only | 8,350 free users (takes time — not early stage) |
| Mix (realistic) | 10 premium + 5 coin packs + 1 B2B store = $150+ ✓ |

**The key insight: You break even with 20 paying users or 1 grocery store client. That is a very low bar.** Most apps need thousands of users to break even. Dig In's B2B side means you can be profitable from day one if you walk into the right grocery store.

---

### The "I'm Not Losing Money" Timeline

This is realistic — not optimistic, not pessimistic.

**Month 0 (Now):** $0 revenue. Costs: $6–20/month (just hosting). Net: -$6 to -$20/month. You're "losing" almost nothing. The app is basically free to run right now.

**Month 1–2 (Launch, 50–100 users):**
- 8 premium subscribers: $36.40/month
- 5 coin packs: $22
- 0 B2B yet
- Ads: $8 (too few users)
- Total: ~$67/month
- Costs: ~$50/month
- **Net: +$17/month → First month at break-even**

**Month 3 (200 users, 1 B2B client):**
- 20 premium: $91
- 15 coin packs: $67
- Ads (180 free users): $43
- 1 Basic B2B store: $299
- Total: ~$500/month
- Costs: ~$80/month
- **Net: ~$420/month profit**

**Month 6 (1,000 users, 5 B2B clients):**
- 120 premium: $546
- 80 coin packs avg $4.50: $360
- Ads (880 free users): $704
- B2B (3×$299 + 2×$799): $2,495
- Sponsored recipe: $500
- Total: ~$4,605/month
- Costs: ~$150/month
- **Net: ~$4,455/month → $53,460/year**

**Month 12 (5,000 users, 15 B2B clients):**
- 600 premium: $2,730
- 350 coin packs: $1,575
- Ads (4,400 free users): $3,168
- B2B (8×$299 + 5×$799 + 2×$1,999): $9,381
- Sponsored recipes: $1,500
- Total: ~$18,354/month
- Costs: ~$350/month
- **Net: ~$18,000/month → $216,000/year**

---

## PART 5: THE FULL PASSIVE INCOME STACK

Here is how every dollar Dig In makes is categorized — how active vs. how passive:

```
FULLY PASSIVE (zero ongoing work after setup):
├── Premium subscription billing .............. Stripe auto-bills
├── Annual subscription billing ............... Stripe auto-bills
├── Coin pack purchases ...................... Stripe auto-processes
├── AdSense display ads ...................... Google auto-serves
├── AdSense rewarded video ads ............... Google auto-serves
└── App Store in-app purchases (future) ...... Apple/Google auto-process

MOSTLY PASSIVE (10–30 min/month of work):
├── B2B Basic reports ($299/mo) .............. Python generates, you email PDF
├── B2B Standard reports ($799/mo) ........... Python generates, you review & send
└── Sponsored recipe scheduling .............. Brand pays upfront, you schedule post

ACTIVE INCOME (ongoing work required):
├── B2B Premium plan ($1,999/mo) ............. Requires quarterly calls + API support
├── B2B Enterprise (custom) .................. Custom relationship, ongoing support
└── New B2B client sales ..................... Walking in and pitching grocery stores
```

**The goal over 18 months:** Get to a point where the passive streams cover your living expenses, and the active B2B sales income is all upside (savings, reinvestment, hiring).

If your monthly living expenses are $4,000/month:
- You need ~880 premium subscribers (achievable at ~9,000 active users)
- OR ~14 Basic B2B clients
- OR a mix — which is the most realistic path

---

## PART 6: AD SETUP PRIORITY ORDER

Do these in order. Each one adds more passive income:

**Week 1: Google AdSense**
- Sign up at adsense.google.com
- Add your Vercel domain as a site
- Paste the auto-ads code snippet into your app's index.html
- Wait 24–72 hours for approval
- Ads start running automatically
- **Passive income from this: Starts immediately after approval**

**Week 2: Rewarded Video Ads**
- Sign up for Google AdMob (or IronSource for web)
- Add the rewarded video unit
- Wire it to the "Watch to earn 10 coins" button in the app
- **Passive income from this: Every user who watches earns you ~$0.02–$0.04**

**Month 2: Direct Brand Outreach**
- Once you have 500+ active users, email 10 CPG food brands
- Pitch: "Sponsor a recipe on Dig In — $500/month, seen by [X] food-obsessed users per month"
- This is 2–3 hours of work once per sponsorship
- **Passive income from this: $500–2,000/month per brand**

**Month 3+: Featured Store Pins**
- Once you have B2B conversations happening, pitch the map pin feature
- $50–150/month for a highlighted pin on the map
- Grocery stores love anything that drives foot traffic
- **Passive income from this: $50–150 per store, per month, no ongoing work**

---

## PART 7: WHAT TO DO FIRST (IN ORDER)

This is the exact sequence to go from $0 to money in your bank:

**Step 1 — Add Stripe (Week 1, ~4 hours)**
You cannot make money without this. Everything else depends on it. Stripe has excellent documentation and React libraries. This unlocks subscriptions and coin packs immediately.

**Step 2 — Set Up Google AdSense (Week 1, ~2 hours)**
One snippet of code. Passive forever. Do this the same week as Stripe.

**Step 3 — Fix Auth and Deploy Backend (Week 2, ~3 days)**
You need real users to make real money. Fake users generate no revenue. Real auth → real check-ins → real data → B2B value.

**Step 4 — Walk Into 3 Grocery Stores (Week 3, ~3 hours)**
You don't need an app store listing. You need a working web app on your phone and a 2-minute pitch. Find 3 independent grocery stores near you. Show them the demo. Offer 3 months free. Ask for a QR code placement. One of them will say yes. That is your first B2B revenue.

**Step 5 — Add Premium Paywall (Week 4, ~1 day)**
Now that auth is real, gate premium features behind Stripe. Anyone who had free access before keeps it (grandfather them) — new users see the free/premium choice.

**Step 6 — Set Up Automatic B2B Report Generation (Month 2)**
Configure a cron job on Railway to run the DataMonetization Python module on the 28th of each month for each B2B client. Output goes to a Google Drive folder. You review and forward. Eventually this becomes fully hands-off.

After those 6 steps, Dig In has three passive income streams running and your first B2B client. That's the foundation.

---

## SUMMARY: YOUR NUMBERS AT A GLANCE

| Time | Users | B2B Clients | Monthly Revenue | Monthly Costs | Monthly Profit |
|------|-------|-------------|----------------|---------------|----------------|
| Now | 0 | 0 | $0 | $6 | -$6 |
| Month 1 | 100 | 0 | $67 | $50 | +$17 |
| Month 3 | 200 | 1 | $500 | $80 | +$420 |
| Month 6 | 1,000 | 5 | $4,605 | $150 | +$4,455 |
| Month 12 | 5,000 | 15 | $18,354 | $350 | +$18,004 |
| Month 18 | 15,000 | 35 | $52,000+ | $800 | +$51,200+ |

**The single most important number to watch:** Monthly Recurring Revenue (MRR). This is all your subscriptions + B2B monthly fees added together. When MRR hits $4,000/month, you're building something real. When it hits $10,000/month, you have a fundable business.

---

*Financial Model · Dig In · July 2026 · Confidential*
*Note: All projections are estimates based on industry benchmarks for food/lifestyle apps.*
*Actual results depend on user acquisition, retention, and B2B sales execution.*
