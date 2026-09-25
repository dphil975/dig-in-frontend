# Dig In — The Feed Algorithm

**July 28, 2026** · Ranking, tags, context, and why this can't collapse into what Reddit and TikTok became.

---

## Part 1 — Why every feed feels the same now

This isn't laziness on their part. It's math, and it's worth understanding precisely, because the fix has to attack the mechanism.

**Engagement-ranked feeds converge.** A recommender learns which content holds attention, shows more of it, and the population's *revealed* preference narrows toward whatever the model over-serves. Creators watch what wins and copy it. Within about two years, a platform with infinite possible content produces roughly eight formats. This is a feedback loop with a fixed point, and the fixed point is a monoculture.

**Arousal beats satisfaction as a predictor.** Anger, shock, envy, and outrage predict watch time better than contentment does. So a system optimizing for attention will always drift toward the agitating, even if nobody involved wants that. That's the "chaos consuming bored people" you described — it's not a cultural accident, it's the objective function.

**The mid-follow dead zone is real.** You identified this correctly. If you follow ~5 accounts, the model has almost no signal and is forced to explore, so your feed is varied. If you follow 500, you're a firehose and volume sorts itself out. At 50–150 — where most people actually live — the model has just enough signal to be confident and not enough to be right. It locks onto three interests and starves everything else.

**Ads break the contract.** One in two or one in three units being a sale means the user can never relax into the feed. They're being interrupted at a rhythm they can feel.

The mechanism is: **one score, sorting everything, optimizing attention.** Every symptom follows from that.

---

## Part 2 — The signal nobody else has

Here is the thing that makes this app genuinely different, and it isn't a design choice — it's a structural advantage you have and Instagram doesn't.

**Every other platform can only measure attention, because attention is all that happens inside the app.** They rank on watch time because there is nothing else to rank on.

Dig In touches the physical world. It already records:

| Signal | Where it's recorded | What it proves |
|---|---|---|
| `markCooked` + `/api/vault/cook` | `RecipeFull:157` | Someone actually made dinner — with elapsed time and a photo |
| `finished_dish_pixelated` | Pixelator | They finished and were proud enough to render it |
| `checkin` | `behaviorTracker:52` | They physically went somewhere |
| Shopping list → store route | `findStores()` | They intended to buy the ingredients |
| Session telemetry | Gather + Cook states | Which steps they completed, what they substituted |

That's a record of **consequence**, not attention. No social platform on earth can rank on it.

### The Made-It Rate

> **MIR = (people who cooked, bought, or attended within 7 days) ÷ (people who saw it)**

This is the primary ranking signal. Views are the denominator, not the numerator.

A post with **200 views and 40 dinners** outranks a post with **10,000 views and 3**.

Notice what this kills without any moderation policy:

- **Rage bait** — nobody cooks after being angry. MIR ≈ 0.
- **Fake luxury** — you can't make a $400 restaurant plate at home, so it can't convert.
- **Aspirational unattainable content** — the thing you were describing, people posing to fund a lifestyle. It has no MIR because there's nothing to make.
- **Ads disguised as content** — nobody makes an ad.
- **Slop and volume-farming** — high output, low conversion, sinks.

You don't need a content policy to remove that stuff. The objective function removes it. That's much more defensible than a moderation team, and much cheaper.

### You already built this instinct

`services/behaviorTracker.js:107` weights restaurant check-ins **3×** over recipe views, with the comment *"Restaurant visits are the strongest signal."*

That's already the right philosophy, applied to one small feature. The proposal here is to make it the entire system.

---

## Part 3 — Slots, not scores

**The reason feeds homogenize is that one number sorts everything.** So don't use one number.

The feed is composed like a plate, not sorted like a list. Ten slots, each with its own eligibility rule. Content competes *within* a slot, never across slots. MIR ranks candidates inside each slot — it never decides which slot type wins, because slot types don't compete.

| # | Slot | Eligibility |
|---|---|---|
| 1 | Someone you follow | Accounts you chose |
| 2 | **Within 20 miles** | Geo-tagged, local. Always present |
| 3 | You can make right now | Cross-checked against pantry inventory |
| 4 | In season | Weather + calendar layer |
| 5 | An ask | An open question, answerable in ten seconds |
| 6 | **Cooking now** | Someone is mid-recipe at this moment |
| 7 | **Under 50 followers** | Reserved for small accounts |
| 8 | A tag you follow | Sideways travel |
| 9 | A chain | Someone made someone else's dish |
| 10 | **In person, near you** | An event you could physically attend |

**This structurally cannot become a monoculture.** Even if one format got wildly popular, it could only ever win the slots it's eligible for. Nine-tenths of the feed is reserved for other things.

### Slot 7 solves your follower problem directly

You said: you either need to follow a lot of people or almost none. Slot 7 is a **guaranteed floor** for accounts under 50 followers. Every user, every day, sees a stranger who nobody has found yet.

Two consequences: new users are never invisible on day one, and the feed never becomes the same twelve accounts.

### Slots 6 and 10 are the in-person engine

You said the point is bringing ideas to life in person, not just community online. That's slots 6 and 10, and they're 20% of the feed by construction.

**Cooking Now** — *"3 people are on step 4 of the same soup. Join them."* This is presence, not content. It's the closest thing software can do to a kitchen with people in it, and it's the antidote to the specific loneliness you're describing.

**In person, near you** — a market, a stall, a watch party, a stoop dinner, a podcast taping. This is the slot that eventually carries your park events, your city stops, and the whole physical layer of the business. It's in the feed from day one so the muscle exists before you need it.

---

## Part 4 — Tags that are actually logical

You asked for logical tags. Tumblr's tags are pure folksonomy — expressive and useless as filters. Instagram's are spam. The fix is **two layers with different rules and different visual weight.**

### Layer 1 — Structured tags (computed, never typed)

Generated from recipe data. Guaranteed to mean exactly one thing. These are reliable filters.

| Family | Examples | Derived from |
|---|---|---|
| Cost | `#under5` `#under10` | `lib/tierBudget.js` — already built |
| Time | `#15min` `#30min` `#slow` | Recipe total time |
| Effort | `#onepan` `#nocook` `#nokitchen` | Step + equipment analysis |
| Feasibility | `#usespantry` `#nothingextra` | Pantry cross-check |
| Diet | `#vegan` `#gf` `#dairyfree` | `RecipeTransformPanel` — already built |
| Context | `#hotday` `#firstfrost` `#gameday` | Context layer |

Rendered as **bordered pixel chips**. Tapping one filters reliably, every time.

### Layer 2 — Voice tags (typed, capped at 3)

`#itriedmybest` · `#fridgeraid` · `#brokebutfancy` · `#hesaiditwasfine` · `#kitchenwasagainstme`

Rendered as **plain text**, no border. These aren't filters — they're personality, and they're where the whimsy lives. A tag can be a joke, an identity, and a search term at once. A category chip labeled "Italian" is none of those.

**The cap at 3 is the whole trick.** Unlimited tags are what destroyed tag systems everywhere else. Three forces a choice, and a chosen tag is a real signal.

Two layers, two visual weights: structure you can trust, voice you can enjoy. That's "logical" without being sterile.

---

## Part 5 — The context layer

This is what you asked for with environment, holidays, sporting events, and life events. It modulates every slot *before* ranking — it's a lens, not a slot.

### Weather and season

- Above 85°F: suppress braises, roasts, and anything over 40 minutes. Surface cold noodles, no-cook, grill.
- First frost: soup, stew, and bread surge for two weeks.
- Rain: comfort food and pantry cooking — people aren't going to the store.
- Produce calendar by region: what's actually cheap and good near you this week.

Nobody does this well, and it's a genuine reason the feed feels alive rather than canned.

### Calendar — ramps, not banners

A holiday isn't a day, it's a **six-week arc**: planning → shopping → prepping → the day → leftovers → the aftermath.

Thanksgiving, Christmas, Ramadan and Eid, Lunar New Year, Diwali, Passover, Juneteenth, Día de los Muertos, Lent, Rosh Hashanah. The user declares which ones are theirs during onboarding — you never guess someone's religion from behavior.

The leftovers-and-aftermath phase is a real gift. Every other food app abandons you on December 26th.

### Local events

Local team plays tonight → snack and dip content, plus a "watch party near you" in slot 10. Also: farmers market days, street festivals, restaurant weeks, first day of school.

### Life mode — the one that matters most

This is where "the experience of being an adult" actually gets built. The user declares a mode, or the app notices and asks gently. It reshapes the feed for weeks.

| Mode | What the feed becomes |
|---|---|
| **I just moved** | Pantry-building from zero, cheap equipment, one-pot, local store maps, neighbors within 20 miles weighted up hard |
| **I'm broke this month** | `#under5` dominates. Deals surface. **All aspirational content suppressed** — nobody who's counting dollars should be shown a $60 roast |
| **Cooking for one now** | Portions adjusted, leftovers-forward, and Cooking Now weighted heavily — because this mode usually means a breakup or a death, and the point is that you're not alone in the kitchen |
| **Someone died** | Freezer meals, food people bring you, one-pot. **The feed slows down and gets quiet.** Fewer posts, no gamification, no streak pressure, no confetti |
| **New baby** | One-handed recipes, 15-minute cap, freezer batching, things you can eat cold |
| **Trying to be better** | Protein-forward, prep-ahead, 75 Hard-compatible, streaks turned up |

**The grief mode is the most important feature in this document.** An app that knows to get quiet is an app that's actually taking care of you. Nobody has built it. It costs almost nothing. And it is the single clearest expression of "the user is cared for, not neglected."

Modes expire and ask to be renewed. Nobody should be stuck in grief mode in the app six months later.

---

## Part 6 — Advertising that doesn't break the feed

You said people want function before they're sold something, and that a sale every two units makes an app unbearable. Here's a model that follows from the ranking signal.

**A brand cannot buy a slot. A brand can only buy eligibility.**

A sponsor enters through slot 3 or 4 as a **real recipe using their product**. Then it has to earn its Made-It Rate exactly like everything else. If people cook it, it stays. If they don't, it falls out within a day.

Rules:
- **1 in 20 maximum.** Hard cap, not a target.
- **Must be makeable.** If there's nothing to cook, it can't enter.
- **Labeled honestly** — a small pixel tag, not disguised.
- **No interstitials, ever.** Nothing between you and the next post.

Why an advertiser accepts this: you can tell them something no other platform can — *"your placement only performs if people actually make your product."* That's a stronger, more honest metric than impressions, and it's the exact pitch for the travel and credit-card partnerships you mentioned. Referral models want conversion, and conversion is what MIR measures.

---

## Part 7 — Retention without a compulsion loop

You want people trained to stay. I'd frame the goal slightly differently: **build a habit around a real reward, not a slot machine.** It's more durable, and it's the honest version.

Four mechanics:

**The feed ends.** Thirty posts. *"That's today. Come back tomorrow."* Finishing something feels good. Endless scroll never lets anyone finish, which is exactly why people feel bad and leave.

**Streaks count meals, not opens.** You keep a streak by making something, never by launching the app. This is the difference between a habit and a compulsion, and it means your headline metric is honest.

**The feed is time-aware.** Different at 7am, noon, and 6pm. It should feel like the app knows what time of day it is in your life.

**The payoff is dinner.** This is the real advantage. Every other app's reward is a hit of dopamine that evaporates. Yours is that you ate something good and a stranger told you it looked great. That loop closes in the physical world, which is why it holds.

---

## Part 8 — The metric you report

Not DAU. Not time-in-app. Not impressions.

> **Meals Made.** And below it: **in-person events attended.**

This is your investor line, and it's the whole thesis in one sentence:

*"Every platform optimizes for attention. We optimize for meals cooked — and we're the only ones who can measure it, because we're the only ones the user is standing in a kitchen with."*

That is a genuinely differentiated position, it's defensible, and it's true.

---

## Build order

1. **Log the MIR denominator.** Post impressions, so conversion is computable. Nothing works without this.
2. **Ship structured tags.** All the data already exists in `tierBudget`, `RecipeTransformPanel`, and the recipe schema.
3. **Build the slot allocator.** Ten slots, quota-enforced. Start with static rules — no ML needed for months.
4. **Weather and season.** One API, immediate payoff, makes the feed feel alive.
5. **Cooking Now.** Presence from live session state. This is the emotional core and it's mostly already-collected data.
6. **Life modes.** Start with three: *broke this month*, *just moved*, *cooking for one*.
7. **The calendar ramps.** User-declared holidays, six-week arcs.
8. **Slot 10 and in-person events.** The physical layer.
9. **MIR ranking inside slots**, once there's enough volume to be meaningful.

Steps 1–3 are the foundation. Step 5 is the one people will talk about.

---

## The short version

Every other feed asks *what will hold you here.* This one asks *what will get you into a kitchen, and who's nearby doing the same thing.*

That difference is measurable, it's structural rather than aesthetic, and it can't be copied by a platform that never leaves the phone.
