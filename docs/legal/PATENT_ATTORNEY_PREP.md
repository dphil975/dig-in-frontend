# Dig In — Patent Attorney Preparation Guide
### What to Ask, How to Explain It, and the Claude Question · June 2026

> ⚠️ This document is not legal advice. It is preparation material to help you have a productive first conversation with a licensed IP attorney.

---

## First: Understand the Four Types of IP Protection

Before your attorney meeting, know that there are four different tools — and you likely need all four for Dig In:

| Protection | What It Covers | Cost | Time |
|-----------|---------------|------|------|
| **Patent** | A specific method, process, or system that is novel and non-obvious | $5,000–$15,000+ | 2–3 years for full grant |
| **Copyright** | Your specific code, UI design, written content — automatic at creation | $65 filing fee | Instant (automatic) |
| **Trade Secret** | Confidential processes/data you never publicly disclose | $0 (just keep it secret) | Indefinite while kept secret |
| **Trademark** | The "Dig In" brand name, logo, visual identity | $250–$350/class | 8–12 months |

You don't need to choose one. Smart founders use all four in layers.

---

## How to Explain Dig In to a Patent Attorney

Patent attorneys need to understand the *invention*, not the product. Explain it this way:

---

### The Elevator Explanation (Say This First)

"Dig In is a dual-sided food technology platform. On the consumer side, it's a gamified food discovery app — users find grocery stores on a map, check in to earn coins, get personalized recipe suggestions, and create pixel art food avatars. On the business side, we passively collect anonymized, zip-code-level cooking and shopping behavior from those consumer interactions and package it into market intelligence reports sold to grocery retailers and CPG brands. The consumer layer funds the data collection. The data collection funds the B2B business. It's a flywheel."

---

### The Technical Explanation (Say This Second)

Walk through the five systems that make Dig In work:

**System 1: The Behavioral Data Collection Pipeline**
"When a user checks in to a grocery store, the app records their anonymous ID (hashed), zip code, store type, timestamp, and what ingredients they said they bought or planned to buy. Over time, this builds a dataset of: what ingredients are trending in which neighborhoods, what peak shopping hours look like by zip code, which stores are gaining or losing market share, and how price-sensitive shoppers are by area. We then sell custom reports built from this aggregated data to grocery stores and CPG brands."

**System 2: The Substitution Engine**
"When a user is missing an ingredient for a recipe, the app's substitution engine analyzes what they have available and suggests the best substitute with specific ratios and cooking modifications. This is rule-based logic with over 300 ingredient substitution mappings."

**System 3: The Gamification + Check-in Loop**
"Users earn coins for checking into stores, maintaining daily streaks, cooking recipes, and completing quests. Coins can be spent on cosmetic items for their pixel art food avatar. This creates a daily habit loop tied directly to real-world grocery store visits — which is what generates the behavioral data."

**System 4: The Craving-to-Ingredients Pipeline**
"Users describe a food craving in natural language. The system decodes the craving using a flavor/seasoning layer model, matches it to recipes in the database, then surfaces nearby grocery stores with pricing data for the required ingredients — ranked by price, distance, and historical user preference."

**System 5: Anonymized Data Monetization**
"All user data is hashed at collection. No personally identifiable information is stored. We sell aggregated insights — not individual data — to retail clients. Reports include: trending ingredients by zip, substitution patterns (which products users can't find and replace), peak shopping windows, and competitive store market share by neighborhood."

---

## Questions to Ask Your Patent Attorney

### About Patentability of Dig In's Core Systems

1. **"Is the dual-sided behavioral data flywheel — consumer app that passively funds a B2B data collection business — novel enough to patent as a method or system?"**
   The combination of gamified consumer behavior + passive anonymized data collection + B2B retail intelligence may be unique enough as a combined method. Ask specifically about **utility patents** covering the method, not just the software.

2. **"Is the 'check-in to grocery store → anonymized behavioral data → retail market intelligence' pipeline patentable as a method?"**
   Prior art exists for loyalty apps (Foursquare) and retail analytics (Numerator, Yotpo), but the specific combination — gamified consumer check-in → anonymized zip-level grocery behavior → sold as custom store reports — may be novel in its specific form.

3. **"Is the Craving-to-Ingredients-to-Store pipeline patentable?"**
   The flow: natural language craving → flavor/seasoning decoding → recipe match → nearby store ranking by price and distance is a specific process. Ask if this constitutes a patentable method.

4. **"Should I file a provisional patent application right now to lock in a priority date, even before the full patent is ready?"**
   A provisional application costs ~$320 (micro-entity rate) and gives you 12 months of "patent pending" status at the priority date. If someone else files a similar patent in the next 12 months, your priority date wins. This is the most time-sensitive question.

5. **"What does 'prior art' look like for each of these systems, and which have the best chance of surviving a novelty challenge?"**
   Your attorney will do a prior art search. Foursquare (check-ins), Yummly (recipe matching), Numerator (retail data) are the closest competitors. The specific combination and the anonymized zip-code behavioral layer may still be novel.

6. **"Is the pixel art + food avatar + coin economy system worth patenting separately, or does that fall under 'game mechanics' which are notoriously hard to patent?"**
   Game mechanics have weak patent protection in the US. The attorney will likely steer you away from patenting the gamification layer alone — but it may be worth including as part of the broader system patent.

### About Trade Secrets (Ask These Too)

7. **"For systems where patent protection is weak or expensive, should I instead protect them as trade secrets — particularly the data monetization algorithm and the substitution engine?"**
   Trade secrets are free, last indefinitely, and don't require disclosure. The downside: if someone independently develops the same thing, you have no protection. For the behavioral data pipeline and substitution logic, trade secret may be more practical than a patent.

8. **"What do I need to do right now to establish that these systems are trade secrets?"**
   Trade secret protection requires you to actively treat it as secret: NDAs with employees/contractors, limited internal access, documented security measures. Your attorney will give you a checklist.

### About Copyright

9. **"Is my codebase automatically protected by copyright, and do I need to register it to enforce it?"**
   Yes — code is copyrightable the moment it's written. Registration ($65) is optional but gives you the ability to sue for statutory damages (up to $150,000 per infringement) vs. only actual damages if unregistered. Ask whether it's worth registering the core proprietary modules (the data monetization pipeline, substitution engine, behavioral tracker).

10. **"Since I used AI (Claude) to assist with some of the code — does that affect my copyright ownership?"**
    See the full answer below. Short version: you own it. But your attorney should confirm this given how fast this legal area is evolving.

### About Trademark

11. **"Is 'Dig In' available to trademark as a food/tech brand, and should I file a use-based or intent-to-use application?"**
    Run a TESS search (USPTO trademark database) before the meeting. "Dig In" is a common phrase — there may be conflicts. Your attorney will advise on filing in Class 42 (software) and potentially Class 43 (food services).

12. **"Should I trademark the pixel art logo and visual identity separately from the name?"**
    If your pixel art style becomes a brand signature, it's separately trademarkable as a design mark. This protects the visual aesthetic — which is your most distinctive brand element.

### About Timing and Strategy

13. **"Given that I'm preparing to raise funding, what's the minimum IP I should have in place before approaching investors — and in what order?"**
    Investors want to see that you own your IP clean. The attorney will likely say: (1) provisional patent now, (2) trademark filing, (3) ensure all code is assigned to your C-Corp entity.

14. **"If I bring on a co-founder or contractors, what agreements do I need to ensure I own all of the IP they contribute?"**
    You need an IP Assignment Agreement and potentially a Proprietary Information and Inventions Agreement (PIIA). These are standard — your attorney will have templates.

---

## The Claude Question: Do You Own This?

This is the question everyone building with AI tools needs answered. Here is the current legal state of things — and why you're almost certainly fine.

### Copyright Law and AI-Assisted Work

The US Copyright Office has ruled that **purely AI-generated content cannot be copyrighted** — because copyright requires human authorship. However, **when a human uses AI as a tool to create something**, the human remains the author. This is the same as using Photoshop, a compiler, or any other software tool.

The key legal question is: **Who made the creative decisions?**

In your case:
- You conceived the idea for Dig In — what it does, who it's for, what problems it solves
- You decided on the dual B2B/B2C structure
- You designed the features (check-ins, coins, pixel art, data monetization)
- You directed the architecture (Flask backend, React frontend, 7 modules)
- You made decisions about what to build, what to keep, what to change
- Claude generated code based on your specific direction — it was executing your creative vision

This is the same as hiring a programmer. If you hire a developer and tell them exactly what to build, you (or your company) own the resulting work — they don't. Claude is even cleaner than that: Anthropic's Terms of Service explicitly state that outputs from Claude belong to the user, not to Anthropic.

**Bottom line on copyright: You own the code.**

### Patent Law and AI Inventorship

Patent law is stricter. It requires that inventors are humans. An AI cannot be a named inventor (this was litigated in the DABUS cases in the US, UK, and Australia — all courts rejected AI inventorship).

However, the **inventive concept** in a patent must come from a human. The question is: who came up with the idea?

For Dig In, the inventive concepts are things like:
- "A system that gamifies grocery store check-ins to passively collect anonymized behavioral data that is then sold as market intelligence to retailers"
- "A method for translating a natural language food craving into ingredient-level price comparisons at nearby stores"

These are **your ideas**. You conceived them. Claude helped you implement them in code, but the inventive concept originated with you. That makes you the inventor.

**Bottom line on patents: You are the inventor. Claude is the tool.**

### Can Someone Take Your Idea?

This is important to understand clearly:

**Ideas themselves are NOT legally protectable.** This is true regardless of AI involvement. If you told 100 people your app idea at a coffee shop tomorrow, none of them could be sued for building a similar app. Ideas are free.

What IS protectable is:
- The **specific implementation** (your code — protected by copyright)
- The **specific method or system** (patentable if novel and non-obvious)
- The **brand** (trademarkable)
- The **trade secret** (protectable while kept confidential)

So: someone can build an app that does similar things to Dig In. They cannot copy your specific code, use your brand name, or use your patented methods (once granted).

### Can Claude "Leak" Your App to Someone Else?

No. Claude does not retain memory between conversations. When your session ends, Claude has no record of what you built. Someone else asking Claude to "build a food app with data monetization" would get a completely different result based on their own specific inputs — they would not get your code, your architecture, or your data.

The concern that "Claude could give my idea to someone else" is understandable but unfounded. Claude generates responses based on the input in front of it. There is no shared repository of user ideas.

### The One Real Risk: Public Disclosure

The actual IP risk with AI-assisted development is **public disclosure**. If you post your code publicly on GitHub, publish detailed technical descriptions without a provisional patent filed, or pitch your exact technical implementation publicly — you start a 1-year clock (in the US) before you lose the right to patent it. 

**Action items before you talk publicly about the technical implementation:**
1. File a provisional patent application (starts the clock in your favor)
2. Keep your codebase private (don't open-source it)
3. Use NDAs when discussing technical details with potential investors/partners

---

## What to Bring to the Attorney Meeting

Bring these documents:

1. **A one-page technical summary** of the five core systems (copy/adapt the "Technical Explanation" section above)
2. **A list of the closest competitors** you're aware of (Yummly, Foursquare, Numerator, Whatnot, Instacart)
3. **Your GitHub repository URL** (private) so they understand the technical scope
4. **Your entity structure** (or lack thereof) — if you don't have a C-Corp yet, tell them; they'll advise on IP assignment
5. **Timeline of creation** — when did you start building, what's been built when. This establishes your priority

---

## What to Do Before the Meeting (This Week)

1. **Search the USPTO trademark database** at tess2.uspto.gov — search "Dig In" in Class 42 (computer software) and Class 43 (food services)
2. **Search Google Patents** for "food app check-in behavioral data" and "gamified grocery retail analytics" — get familiar with what's already filed
3. **Write down the date you started building** and any screenshots, commits, or records that document the timeline of invention
4. **Do not post detailed technical descriptions publicly** until after you've met with the attorney

---

## Estimated Costs

| Action | Estimated Cost |
|--------|---------------|
| 1-hour attorney consultation | $300–$600 |
| Provisional patent application (attorney-assisted) | $1,500–$3,000 |
| Utility patent (full) | $8,000–$15,000 |
| Copyright registration (core code modules) | $65–$200 |
| Trademark filing (name, 1 class) | $250–$350 + attorney fees |
| NDA templates and IP assignment agreements | $500–$1,500 |

If budget is tight, the highest-value first step is the **provisional patent** — it's cheap, it locks in your priority date, and gives you 12 months to decide whether to pursue the full patent.

---

*Patent Attorney Prep Guide · Dig In · June 2026 · Not Legal Advice*
