# Dig In — VC Due Diligence: Every Hard Question You Haven't Answered Yet
### Written from the perspective of a Series A investor doing first-meeting diligence
### Olive Phillips | July 2026

---

> **How to use this document:** Every section is a question a VC will ask. The status tells you where you stand today. Red means you cannot raise until this is resolved. Yellow means you need a credible answer. Green means you're covered. Study every red and yellow before any investor meeting.

---

## 🔴 CRITICAL — DEAL-KILLERS IF NOT RESOLVED

These will end the conversation. No investor writes a check with these unresolved.

---

### 1. "Can I see your app working right now? Show me a real user logging in."

**The problem:** Your authentication is completely fake. `authService.js` uses a `setTimeout` that returns hardcoded data. There are no real users. There is no real session. If a VC or their technical advisor pulls up your GitHub or does a 30-minute code review — which they always do before writing a check — they will find this in under 5 minutes.

**What they'll say:** "You told me you have users. Your auth is a mock. How many of your metrics are also mock?"

**What you need:** Real auth via Supabase or Firebase, real user accounts, real sessions. This is your single most urgent technical task.

**Status: ❌ UNRESOLVED**

---

### 2. "Show me your social feed. Who are these users?"

**The problem:** Your social feed generates random fake posts. Your leaderboard is a hardcoded array called `MOCK_USERS`. These are not real people. If a VC signs up and sees a feed full of activity but discovers it's all fabricated, that is a trust-destroying moment that ends the relationship permanently.

**What they'll say:** "This looks active but when I check, none of these users exist. Is any of this traction real?"

**What you need:** Real social feed connected to real user accounts. Even 10 real users posting real check-ins is infinitely better than 1,000 fake ones.

**Status: ❌ UNRESOLVED**

---

### 3. "You're collecting behavioral location data on users. Where is your privacy policy? Your GDPR compliance? Your CCPA compliance?"

**The problem:** Dig In collects check-in locations, food preferences, grocery store visits, and anonymizes + sells that behavioral data to third parties. This is among the most regulated categories of data collection that exists. You currently have no privacy policy, no terms of service, no data processing agreement template for B2B clients, and no GDPR or CCPA compliance infrastructure.

**What they'll say:** "You're selling behavioral data without a privacy policy. That's not a product — that's a lawsuit waiting to happen. We can't touch this."

**What you need:**
- A privacy policy written by an attorney (discuss today)
- Terms of service
- A cookie consent banner
- CCPA opt-out mechanism ("Do not sell my data")
- GDPR compliance if any EU users (consent management, right to deletion)
- Data processing agreements (DPAs) ready for B2B clients to sign before they receive any data

**Status: ❌ UNRESOLVED**

---

### 4. "Where is your legal entity? How do I actually give you money?"

**The problem:** You have no LLC or C-Corp. An investor cannot legally wire money to a person — they need a legal entity with a cap table, a bank account, and governing documents (operating agreement or certificate of incorporation).

**What they'll say:** "We'd love to proceed but we can't invest in you personally. Come back when you've incorporated."

**What you need:** A Delaware C-Corp (preferred by VCs — not an LLC, not a sole proprietorship). Services like Stripe Atlas ($500), Clerky, or a startup attorney can do this in 1–2 weeks.

**Status: ❌ UNRESOLVED — raise this with your attorney TODAY**

---

### 5. "Where are your recipes from? Do you have a commercial license to use them?"

**The problem:** You have 26,000+ recipes from 70+ countries. Where did they come from? If they were scraped from websites, you may have copyright liability. If they were licensed, show the license. If they were created originally, prove it.

**What they'll say:** "If these recipes are scraped from AllRecipes or Food Network, you're building on a foundation we can't invest in. One DMCA takedown could remove your entire product."

**What you need:** A clear answer on the source and license for every recipe in the database. If scraped, you need to either replace them with licensed content (Edamam API, Spoonacular, or original content) or get legal clearance.

**Status: ❌ NEEDS IMMEDIATE ANSWER — you know this, I don't**

---

### 6. "You have no revenue and no paying customers. What proof do I have this B2B market will pay?"

**The problem:** The B2B data intelligence product is the most valuable part of Dig In and you have zero paying clients, zero LOIs (letters of intent), and zero pilots. The pricing exists on paper only.

**What they'll say:** "I love the idea but ideas don't pay. Have you walked into a single grocery store and gotten a check? An email saying 'yes we want this'? Anything?"

**What you need:** At minimum, one of these before any serious raise:
- One paying B2B client (even at $99/month to start)
- Three signed LOIs from grocery store owners stating intent to pay
- Five documented conversations where a store owner said "I would buy this"

Your NYC hostel and grassroots plan gets you in front of people who know grocery store owners. That's the path to your first LOI.

**Status: ❌ UNRESOLVED**

---

## 🟡 SIGNIFICANT GAPS — YOU NEED A CREDIBLE ANSWER

These won't immediately kill the deal but will stall it or reduce your valuation.

---

### 7. "This is a web app. Where is the iOS app? Where is the Android app?"

**The problem:** A consumer food app that requires daily check-ins at physical locations is fundamentally a mobile-first product. People do not pull out their laptop at a grocery store. The check-in flow, barcode scanner, and map all require a native or progressive web app on a phone.

**What they'll say:** "How do you expect someone to check in at a grocery store on a desktop browser? Your retention numbers will be terrible without a native app. Have you tested this?"

**What you need:** React Native conversion plan with timeline. Your React codebase can be ported to React Native with significant (not total) reuse. This is a 2–3 month build, not a year. Or at minimum, a PWA (Progressive Web App) that can be installed on a home screen.

**Status: 🟡 Gap — you need a plan and timeline**

---

### 8. "Why can't Yelp, Google, Instacart, or DoorDash copy this in 6 months?"

**The problem:** Every single feature in Dig In can be built by a well-funded competitor. Google Maps already has check-ins. Yelp has grocery store data. Instacart has purchase behavior data. DoorDash has delivery behavior. They all have 10–100× more users than you'll have for years.

**What they'll say:** "What's your moat? If this works, Google builds it in a sprint. Why does Dig In exist in 5 years?"

**What you need — your actual moat answers:**
- **The pixel art creator** is genuinely unique and creates emotional attachment that a feature-copy can't replicate overnight. Culture is not a feature.
- **The coin economy and community** — users who have earned 2,000 coins and have 15 pixel art items don't leave. Switching cost is real.
- **First-mover B2B relationships** — the grocery store you sign at $299/month becomes a reference client and a distribution partner (QR codes in-store). That flywheel is hard to break.
- **Data density advantage** — your data becomes more valuable as it gets denser. A competitor starting from zero can't instantly replicate 18 months of behavioral data in a given zip code.
- **Brand** — pixel food culture is yours to own if you move fast enough

Practice articulating this answer clearly. "We move fast" is not a moat. The above points are.

**Status: 🟡 Gap — you have the ingredients but need to articulate them clearly**

---

### 9. "You're a solo founder. What happens to the company if you get hit by a bus?"

**The problem:** Every VC knows that solo founder startups have a higher failure rate than co-founder teams. Not because solo founders aren't capable, but because there's no one to check their thinking, cover their workload when they're sick, or take over if something happens.

**What they'll say:** "We generally don't invest in solo founders. Who else is on this? Do you have a technical co-founder? An advisor? Anyone?"

**What you need — your options:**
1. Find a co-founder (1–2 months of relationship-building, not something to rush)
2. Build an advisory board — 3–5 experienced people who commit 2 hours/month. Even one advisor with a startup exit and grocery/food industry experience changes the optics dramatically
3. Show a hiring plan — "My first hire with funding is a senior full-stack engineer, here's why"
4. Demonstrate speed — solo founders who ship fast prove they can operate efficiently

**Status: 🟡 Gap — advisors are your fastest fix**

---

### 10. "What is your backend infrastructure? Is it deployed? Is it stable?"

**The problem:** Your Flask backend is not deployed to production. All VITE environment variables default to empty strings, meaning the frontend runs in a completely disconnected state from the backend. There is no production infrastructure.

**What they'll say:** "Your backend isn't running. How are you serving 26,000 recipes? How are you handling check-ins? What exactly is live?"

**What you need:** Deploy the Flask backend to Railway or Render (both have free tiers). Connect the frontend environment variables to point to the live backend. Have a working end-to-end demo, even in a staging environment.

**Status: 🟡 Gap — this is a few hours of work that unlocks everything else**

---

### 11. "Walk me through your data minimum. How many users per zip code before B2B data is statistically meaningful?"

**The problem:** The B2B product's value depends on having enough user behavior data in a given geography to generate real insights. One user checking in at a grocery store in a zip code tells you almost nothing. You need density.

**What they'll say:** "How many users does a zip code need before your reports are actually worth $299/month? What's your data density strategy in early markets?"

**What you need:** A defensible answer. Based on industry standards for behavioral data, you likely need 50–100 active monthly users per zip code to generate meaningful trend data. That means you need geographic clustering — all your early marketing should focus on specific zip codes, not spreading users randomly across the country.

Your NYC launch strategy is correct for this reason. Density first, breadth later.

**Status: 🟡 Gap — you need to define and state your minimum viable data threshold**

---

### 12. "Can users fake check-ins? How does your data integrity work?"

**The problem:** If a user can just tap "check in" from their couch and claim they're at a Whole Foods in Brooklyn, your B2B behavioral data is worthless. Worse — when a grocery store client figures out the data includes faked check-ins, you lose them immediately.

**What they'll say:** "If I pay you $299/month for data on who's shopping in my store, how do you know they were actually in my store?"

**What you need:** GPS verification (the app checks that the user is within 100–200 meters of the store before allowing check-in), possibly cross-referenced with store geofences. This is a real technical requirement you need to build and explain clearly.

**Status: 🟡 Gap — location verification needs to be in your technical spec**

---

### 13. "What is your TAM? How big can this actually get?"

**The problem:** Investors don't invest in small markets. You need to be able to articulate a path to $100M+ in revenue to get a VC interested (angels and crowdfunding are different — they can invest in smaller outcomes).

**What they'll say:** "Walk me through your market size. I want to see the math."

**Your answer (build this out):**
- US grocery market: $1.1 trillion annually
- Independent and regional grocery stores: ~63,000 in the US
- If 5% become B2B clients at $500/month average: 3,150 stores × $6,000/year = **$18.9M ARR** just from B2B
- Consumer app TAM: 258M US smartphone users, 35% food-engaged = 90M potential users at $4.99/month = **$5.4B TAM**
- Ad revenue at 10M users: ~$79M/year
- Combined: **$100M+ ARR is mathematically achievable** within a reasonable expansion timeline

You need to know these numbers and say them with confidence.

**Status: 🟡 Gap — you need to memorize and practice the TAM narrative**

---

### 14. "What's your coin economy sustainability plan? What if coins inflate or deflate?"

**The problem:** The coin economy is central to Dig In's engagement model. But in-app currencies are notoriously hard to balance. If users accumulate coins faster than they can spend them (inflation), coins feel worthless and purchasing declines. If coins are too hard to earn (deflation), users feel frustrated and churn.

**What they'll say:** "Have you modeled your coin economy? What happens when a power user has 50,000 coins and there's nothing to spend them on?"

**What you need:** A coin economy model that includes:
- Average earn rate vs. spend rate per user type (casual, regular, power)
- Planned new coin sinks (seasonal items, exclusive recipes, cosmetic upgrades)
- A cap on daily coin earning to prevent runaway accumulation
- Premium item price calibration

**Status: 🟡 Gap — this needs documentation before scaling**

---

## 🟢 THINGS YOU HAVE COVERED (DON'T NEED TO FIX, JUST KNOW THE ANSWERS)

---

### ✅ Concept differentiation
The dual-sided model (consumer gamification + B2B data intelligence) is genuinely novel. No direct competitor does both. You can articulate this.

### ✅ Technical depth
77+ commits, two separate backends (Python/Flask + Node/Express), 27 frontend pages, a `DataMonetization` class with real hashing and anonymization logic. This is not a pitch deck — it's a built product.

### ✅ Financial model
Pricing tiers, break-even analysis, revenue projections, ad revenue model — all documented. You can answer "how do you make money" in detail.

### ✅ Recipe depth
26,000+ recipes across 70+ countries is a real content moat IF the licensing is clean (see Gap #5).

### ✅ Revenue model variety
Five distinct income streams reduces single-point-of-failure risk that investors worry about with consumer apps.

### ✅ Patent strategy
You're with an attorney today. IP protection on the five novel systems is in motion. That's a plus.

### ✅ Market awareness
You know your competitors (Yelp, Foursquare, Yummly, AllRecipes). You know your differentiators. You can answer "why not just use Yelp?" clearly.

---

## THE OVERALL HONEST PICTURE

Here is what a VC sees today vs. what they need to see:

| What VCs See Now | What They Need to See |
|---|---|
| A compelling idea with real technical work | ✅ Already there |
| Fake auth, fake social, fake leaderboard | ❌ Must fix before any pitch |
| No legal entity | ❌ Must form Delaware C-Corp |
| No privacy policy or data compliance | ❌ Must fix — this is legal exposure |
| No paying customers | ❌ Need 1 B2B client or 3 LOIs |
| No deployed backend | 🟡 Fix in a few hours |
| No mobile app | 🟡 Need a credible roadmap |
| Solo founder | 🟡 Get 2–3 advisors minimum |
| No entity = can't take investment | ❌ Form the company first |
| Strong financial model | ✅ Already there |
| Clear market & differentiation | ✅ Already there |
| Patent process started | ✅ Already there |

**The honest timeline to investor-ready:**
- Month 1: Form company, fix auth, deploy backend, get privacy policy
- Month 2: Real social feed, first B2B client or LOI, Product Hunt launch
- Month 3: Mobile PWA or React Native beta, 1–2 advisors onboard, 200+ real users
- Month 4: Launch Wefunder campaign, apply to YC, start angel conversations

You are closer than most founders at your stage. The fake data layer is the only thing that would cause a sharp investor to walk away immediately — fix that and everything else is a conversation worth having.

---

*VC Due Diligence Gap Analysis · Dig In · July 2026 · Confidential*
*This document was written as a simulation of investor due diligence to help identify and resolve gaps before real fundraising begins.*
