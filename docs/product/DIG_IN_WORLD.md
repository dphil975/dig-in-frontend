# Dig In World — Stepping Into the Internet

### The 2000s-internet pivot, staged so it can actually ship · August 2026

Companion to [DIG_IN_THESIS.md](DIG_IN_THESIS.md) (what the app is about) and
[PRODUCT_METRICS_FRAMEWORK.md](PRODUCT_METRICS_FRAMEWORK.md) (how it's measured).
This doc covers the world/avatar pivot: what it actually is, what order to build
it, how to keep it safe, and what "working" means at each stage.

---

## The honest read: this is four products

What you described is not one app. It's four, plus an infrastructure layer:

| # | Product | Closest existing thing |
|---|---------|------------------------|
| 1 | **Presence** — you're at a gym, a store, a place; others can see and tap in | Zenly, Snap Map, Foursquare |
| 2 | **Embodiment** — an avatar that is recognizably *you* | Bitmoji, Club Penguin, Miis |
| 3 | **A place of your own** — a home you design and others visit | Animal Crossing, MySpace, Neocities |
| 4 | **Cooking** — the thing that already exists and works | Dig In, today |
| — | **Trust infra** — invite-only, ID/age tiering, anti-bot | Discord, early Gmail, Roblox |

Any one of these is a year of work. All four at once is how apps die before
launch. The strategic question isn't "is this good" — parts of it are genuinely
good — it's **which one is the wedge, and what do the other three wait for.**

The rest of this doc answers that.

---

## The unlock: you already built the hard half of #1

This is the most important finding in this document, and it changes the
sequencing completely.

**The presence layer is not a new product. It's a rename of what you have.**

- `src/lib/checkinVerify.js` → `verifyCheckinLocation(lat, lng)` already does
  real GPS-verified presence. Not "I claim I'm here" — actually verified.
- `PRODUCT_METRICS_FRAMEWORK.md` already names **Weekly Verified Check-ins** as
  the North Star Metric. The metric for the pivot is the metric you already have.
- ~48k real stores across 25+ region files, with real maps for NYC / Chicago /
  Texas already rendering.
- `src/lib/foodPassport.js` already stamps regions you've actually been to —
  a working "record of where you physically went."

"It pops up that you're at a gym" and "it pops up that you're at a grocery store"
are **the same feature with a different venue category.** You have the GPS
verification, the venue database pattern, the map rendering, and the metric.

> **This means the pivot does not reset your North Star to zero.** Weekly
> Verified Check-ins generalizes to **Weekly Verified Presence** — check-ins
> become one venue type among several. Every number you've tracked stays
> comparable across the pivot. That is rare and worth protecting.

What you'd be adding to #1 is not the mechanic. It's the *social* half: seeing
who else is here, and being able to tap a profile.

---

## What actually makes this different (the answer to "it's all the same")

Your complaint about the Tumblr-style timeline was correct: it isn't
differentiated. A pretty feed is a pretty feed.

But an avatar world isn't automatically differentiated either — Club Penguin
already existed, Bitmoji already exists, and a from-scratch Animal Crossing
clone competes with Nintendo. Nostalgia alone is not a moat.

**Here's the differentiator, and it comes from what you already built:**

> **The world is made of your real life. You don't buy furniture with gems —
> you earn it by cooking, going places, and feeding people.**

Nothing in your house is purchasable. Every object in it is a receipt:

- Cooked a dish from a region → that region's ingredient is on your shelf
  (`foodPassport.js` already stamps this)
- Verified check-in at a real store → that store's tote bag by your door
- Hosted people (The Table / Circles) → your table gets more chairs
- Logged a cook in the journal (`cookJournal.js` → `journalStats()`) → it hangs framed
- Kept a Recess streak (`recess.js` → `recessStreak()`) → the window light changes

Club Penguin's igloo was a fantasy. Animal Crossing's house is a fantasy. **Your
house would be a trophy case for a life you actually lived** — and no fantasy
game can copy it, because they don't have GPS-verified real-world presence and a
cook log. That's the thing that can't be cloned bar-for-bar.

It also solves the cold-start content problem: visiting someone's house *is* the
social feed. You're not scrolling their posts, you're reading their year.

And it keeps faith with the house style already set in
[project_content_strategy](../.claude/projects/-Users-olivephillips-Dig-In-backend/memory/project_content_strategy.md):
no invented numbers, no vanity metrics, nothing about bodies. The house shows
what's true.

---

## The staging plan

Four phases. Each has a **gate** — a number that must be true before the next
phase gets built. The gates exist to kill the idea cheaply if it isn't working,
which is the only honest reason to have them.

### Phase 0 — One room, invite-only (~300 people)

**Build:** The Kitchen. Not a world — one room. Everyone in a cooking app
already has a kitchen; it's the only room you can justify on day one. It fills
with real objects from your existing cook log and check-ins. Plus: invite-only
signup, age tiering, and a visitable profile.

**Explicitly NOT in Phase 0:** the map, other people's presence, avatars walking
around, custom code, any room but the kitchen.

**Gate to proceed:**
- **W4 retention ≥ 40%** of invited users still active in week 4
- **≥ 60%** of users have a kitchen with ≥ 3 earned objects
- **≥ 25%** have visited someone else's kitchen more than once
- **Zero** cross-tier contact incidents (see safety section — this is a hard gate)

If people won't come back for their own kitchen, they won't come back for a
world. Better to learn that at 300 people than at 30,000.

### Phase 1 — Presence, food-first (~3,000)

**Build:** The map, but only food venues at first — the stores you already have
data for. Generalize `verifyCheckinLocation` from `store` to `venue`. You can
see who else is at the farmers market. Tap → their kitchen.

Food-first matters: it's on-thesis, the data exists, and it makes the presence
layer feel like *your app* rather than a Snap Map clone.

**Gate to proceed:**
- **Weekly Verified Presence up ≥ 2×** per active user vs. Phase 0 baseline
- **≥ 15%** of presence events lead to a profile tap (presence is *social*, not just logging)
- Invite conversion **≥ 0.8 accepted invites per active user** (does anyone want to bring a friend?)
- Safety gates all still green

### Phase 2 — More rooms, more venues (~25,000)

**Build:** Gyms, parks, cafés as venue types. More rooms unlocked by real
activity. Avatar customization. This is where it starts to look like the thing
you described.

**Gate:** unit economics hold (see cost section) and moderation load per 1k users
is flat or falling.

### Phase 3 — Custom code

**Build:** Sandboxed custom homes. See the sandboxing section — this is the
highest-risk feature in the concept and it should be last, not first.

---

## Safety architecture

This is the part that determines whether the app exists in two years. An app
with both adults and minors and a messaging feature **is a child-safety product**,
whether or not that's how you think of it. Below is what I'd build, and where
the original concept needs correcting.

### 1. Partition, don't filter

Your instinct — "children have their own version, they remain hidden" — is
right, and I'd push it further.

**Filtering is one bug away from failure. Partitioning is architecturally safe.**

- Minor and adult accounts should live in **separate graphs**, not one graph with
  a visibility filter. An adult should not be able to *see* a minor account
  exists — not in search, not on the map, not in a "people here" list, not in a
  leaderboard, not in a mutual-friend suggestion.
- The check belongs in the **data layer** (Postgres RLS policies keyed on
  verified age tier), not in UI conditionals. You already set this precedent:
  `005_cook_sessions.sql` turned RLS on for circles specifically because
  "impersonating another member is a real harm." This is the same reasoning,
  higher stakes.
- Every cross-tier query should be structurally impossible to write, not
  merely absent from the UI.

### 2. The child tier should use menu-based chat, not free text

Club Penguin's most-copied safety feature was **Ultimate Safe Chat** — younger
users could only send phrases picked from a menu, never arbitrary text. It looks
restrictive on paper. In practice it made grooming *structurally impossible* in
that tier, because you cannot compose a novel sentence.

For the minor tier I'd use exactly this: a rich, funny, well-written phrase menu
plus reactions and emotes. It's also the most on-brand possible answer — it's
the actual 2000s-internet mechanic you're nostalgic for, and it's the strongest
protection available.

Free-text chat in the minor tier should be **friends-only, mutual-consent, and
logged** if you ever add it at all.

### 3. Minors and location — the thing I'd change most

**My strong recommendation: minors broadcast no location at all. Not "hidden
from adults" — off.**

"Hidden from adults" is safe only while the age-tier logic is bug-free forever.
A precise-location leak for a child is not a recoverable incident — not for the
child, and not for the company. The asymmetry is extreme: the feature adds
moderate fun for minors and carries catastrophic tail risk.

If you want minors to have *something*:
- **Venue category only, never coordinates** — "at a library," never a pin
- **Mutual-friends-only**, never public, never discoverable
- **No history** — presence expires in minutes and is never stored

For adults: opt-in, venue-level (not GPS-precise), ghost mode as the *default*,
and no retained location history beyond what the feature needs. "You are at
Whole Foods" is enough; storing a coordinate trail is a liability you don't need
and can't fully protect.

### 4. The invite tree is your real anti-bot system

The strongest idea in your pitch is invite-only, and I'd make it the centerpiece
rather than the ID check.

- Every account traces to an inviter, permanently.
- Bad accounts **burn their inviter's reputation.** Invite abuse costs the
  inviter their remaining invites.
- Rings get removed by subtree, not one account at a time.

This gives you accountability that scales without touching a single government
ID, and it's what actually made early Gmail and Lobsters bot-resistant. ID
verification is the backstop; **the invite tree is the mechanism.**

### 5. ID verification — what to collect, and what not to

Two corrections to the concept:

**a) Minors mostly do not have government photo ID.** Requiring ID for everyone
doesn't create a verified child tier — it either excludes most minors or pushes
them to lie about their age, which is the exact failure you're preventing.
The realistic patterns:
- **Adults:** ID document check via a vendor (Persona, Stripe Identity, Veriff)
- **Minors:** verifiable parental consent — the COPPA-standard flow — or a
  school-issued email, or a parent's card micro-charge

**b) Do not store the ID.** Use a vendor that returns a signed attestation and
store *only*:

```
age_tier          'adult' | 'minor'        (never a birthdate)
verified_at       timestamptz
vendor_ref        text                     (their id, for dispute resolution)
```

Never the document image, never the ID number, never the DOB. Storing ID images
converts a routine breach into a catastrophic one, and biometric/ID data carries
its own regulatory weight (Illinois BIPA and similar). The vendor is insured for
holding it; you are not.

### 6. "You cannot use a VPN to get around it" — this isn't achievable

This claim needs to come out of the pitch, because it can't be supported and
it's the kind of promise that becomes a liability the first time it fails.

What you *can* truthfully build:

| Layer | What it does |
|-------|--------------|
| Device attestation | Apple App Attest / Play Integrity — proves a real device, not an emulator farm |
| Phone verification | Real number, one account per number |
| VPN/proxy detection | IPQualityScore, MaxMind — flags datacenter/proxy IPs for step-up |
| Impossible-travel | Two sessions 2,000 miles apart in 10 minutes → step-up verification |
| Invite provenance | The tree above — the strongest signal you'll have |

Together these make ban evasion **expensive and traceable**, which is the real
goal. That's a defensible claim. "Impossible" is not.

Also: **an IP address is regulated personal data** (GDPR Art. 4, CCPA/CPRA).
"Their IP is in the database" needs a retention window and a lawful basis, or
it's a liability sitting on your balance sheet rather than an asset. Store a
**hash** with a fixed retention window (e.g. 90 days), not a permanent plaintext log.

### 7. User-submitted code — sandbox or don't ship it

Tumblr's custom themes were a genuine, sustained XSS and malware vector. If
users can write code that runs on your origin, you have handed them your session
cookies.

Three options, in order of safety:

1. **CSS-only, allowlisted properties.** MySpace-tier expression, zero script.
   This gets you 80% of the feel with ~0% of the risk. **Start here.**
2. **Sandboxed iframe on a separate origin** (`*.homes.diginapp.com`) with a
   strict CSP, `sandbox` attribute, no cookies, no parent access. This is how
   CodePen and JSFiddle survive. Ship in Phase 3, not before.
3. **Link out to their own site** — which is what you described, and is actually
   the *safest* option, because the browser's origin isolation does all the work.
   The tradeoff is that it leaves your app.

Never: raw user HTML/JS on your own origin.

### 8. Moderation is the business, not an afterthought

Club Penguin is the right comparison and it cuts both ways. Disney acquired it
in 2007 for **$350M upfront** (reported up to ~$700M with earnouts) — and a
large part of what they bought was the safety operation. Club Penguin ran
**human moderators at serious scale** alongside aggressive filtering.

The nostalgic feel is the product. **The moderation cost is the business model.**
Budget it as a permanent line item from Phase 0, not a Phase 3 problem.

---

## Metrics: what "working" means

### The North Star, preserved

Keep the existing NSM and generalize its unit:

> **Weekly Verified Presence (WVP)** — GPS-verified presence events at real
> venues in a 7-day window. Store check-ins are one venue type; the metric is
> continuous with everything you've already measured.

The existing supporting tree still holds (acquisition × frequency × retention ×
density). Nothing you've tracked becomes incomparable.

### Add exactly two world metrics — no more

Resist a new dashboard. Two numbers tell you if the world half is real:

1. **Rooms with earned objects (REO)** — % of active users whose home has ≥3
   objects earned from real activity. *This is the "is the trophy case working"
   metric.* If it's low, the earning loop is broken and the world is decoration.
2. **Visit depth** — visits to *other people's* homes per active user per week.
   *This is the "is it social" metric.* A world nobody visits is a screensaver.

### Safety metrics are gates, not KPIs

The difference matters: a KPI is something you try to improve. **A gate is
something that stops the release.** These are gates.

| Gate | Threshold | Why |
|------|-----------|-----|
| Cross-tier contact incidents | **0**, always | Any nonzero value is a stop-ship |
| Cross-tier queries blocked at data layer | **100%** | Verified by test, not by trust |
| Time-to-action, minor-safety report | **< 2 hours** | The clock that matters most |
| Time-to-action, general report | **< 24 hours** | Table stakes |
| Age-tier misassignment rate | **< 0.1%**, audited monthly | The partition is only as good as the tiering |
| Minor accounts with any location broadcast | **0** | Per the recommendation above |

None of these are growth metrics. All of them can end the company if ignored.

### Cost model (the numbers to pressure-test)

Rough, and worth verifying against current vendor pricing before you commit:

| Item | Approx. unit cost | At 300 users | At 25,000 users |
|------|-------------------|--------------|-----------------|
| ID verification | ~$1–2 / verification (Stripe Identity lists ~$1.50) | ~$450 | ~$37,500 |
| VPN/proxy detection | fractions of a cent / check | negligible | low hundreds |
| Human moderation | the dominant cost — scales with users, not revenue | ~0 FTE | **1–3 FTE minimum** |

The moderation line is the one that decides viability, and it's the one most
pre-launch plans omit. A minor tier raises it further, because minor-safety
reports need faster SLAs and better-trained reviewers.

**The honest implication:** an invite-only alpha is cheap. A 25k-user app with a
child tier is not. Phase gates exist so you find out whether the retention
justifies that cost *before* you're paying it.

---

## Where I'd push back

Collected, so none of it is buried:

1. **"VPN-proof" is not a claim you can make.** Reframe to "expensive and
   traceable." Don't put the stronger version in a deck.
2. **Requiring ID from minors doesn't work** — most don't have one. Use
   verifiable parental consent for the minor tier.
3. **Minors should broadcast no location.** Not hidden — off. The tail risk is
   not symmetric with the upside.
4. **Don't store ID images or plaintext IPs.** Store an attestation and a hash
   with a retention window.
5. **User code comes last, sandboxed, on a separate origin** — or never, with
   CSS-only customization instead.
6. **Four products, one team.** Phase 0 is one room. If the kitchen alone can't
   hold people for four weeks, the world won't either — and that's a $0 lesson
   instead of a two-year one.
7. **Nostalgia isn't the moat.** Club Penguin and Bitmoji already existed. The
   moat is that your world is built from verified real life, which no game can
   replicate. Lead with that, not with the 2000s aesthetic.

---

## What I'd build first

If you want one concrete next step rather than a phase plan:

**The Kitchen, populated from data you already have.** No new backend, no ID
verification yet, no map. Read the existing cook log, `foodPassport.js` stamps,
and `store_checkins` — render a room where every object is something the user
actually did. Ship it to yourself and ten people.

That single screen tests the entire thesis: *is a trophy case of your real life
something you want to look at, and does anyone want to see someone else's?*

Everything else in this document is downstream of that answer.

---

## Related docs

- [DIG_IN_THESIS.md](DIG_IN_THESIS.md) — what the app is actually about
- [PRODUCT_METRICS_FRAMEWORK.md](PRODUCT_METRICS_FRAMEWORK.md) — the NSM and metric taxonomy this extends
- [MARKET_STRATEGY.md](../business/MARKET_STRATEGY.md) — positioning
- [UX_METRICS_PLAN.md](../design/UX_METRICS_PLAN.md) — instrumentation
