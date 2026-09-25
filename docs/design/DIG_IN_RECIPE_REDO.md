# Dig In — Recipe Experience, Rebuilt for iOS

**July 28, 2026** · Companion to `DIG_IN_iOS_FACELIFT.md`
**Scope:** the Cook tab — everything from finding a recipe to posting the dish.

---

## The problem, measured

`pages/RecipeFull/index.jsx` renders **22 stacked panels** in a single scroll:

> FinishedDishPixelator · IngredientsPanel · TierBudgetPanel · AllergyPanel · RecipeTransformPanel · BuildBar launcher · WellnessPanel · GutHealthPanel · FoodSafetyPanel · CopycatPanel · MissingIngredients · VeggieBoost · AdaptRecipe · SensoryCues · ChangeRecipeToggle · EquipmentGate · RecipeStepViewer · NutritionFacts · RecipeVariations · ServeWith · ExpertTips · StorageGuide · MakeAhead · RecipeFAQs

Plus a sticky action bar with two competing buttons ("I MADE THIS" and "FIND STORES").

On a 390pt phone that's roughly **fourteen screens of vertical scroll before you reach step one**. Nobody cooks from that. They screenshot the ingredients and leave.

Three specific things are backwards:

1. **`FinishedDishPixelator` sits at the top**, before you've cooked, showing a pixel version of the finished dish as a "target." The pixel art is your best reward mechanic and it's being spent before the user has done anything to earn it.
2. **`RecipeStepViewer` is a bento grid** — a desktop layout with a sidebar, an ad square, a bit-depth picker, and a boomerang prompt, all on screen at once. While someone is holding a hot pan.
3. **`isFaithful` is a self-reported checkbox** in `DishSubmissionModal`. The user picks "Followed as written" or "Made it their own." That's an honor system, which is weak social proof and — more importantly — weak as a patent claim.

---

## The concept: a recipe is a session, not a document

The recipe stops being a page you scroll and becomes **four states you move through**. One screen per state. You can't see state 3 while you're in state 1, because you don't need it yet and it's in your way.

| State | Verb | What's on screen | Exit |
|---|---|---|---|
| **1 · Look** | *Do I want this?* | Photo, name, time, cost, one sentence, three change-chips, one nutrition line | Save, or Cook this |
| **2 · Gather** | *Can I make this?* | Checkable ingredient list, missing count + price, allergy flags inline, your equipment | Shop, or Start |
| **3 · Cook** | *Make it.* | One step. Dark screen, big type, timer, sensory cue, camera | Next → done |
| **4 · Show** | *I made it.* | Your photo pixelated, session summary, verification mark | Post to the Table |

That's the whole thing. Four screens instead of twenty-two panels.

### Why this shape

State 3 is the reason. **Cooking is the only part of this app where the user has wet hands, a timer running, and something on heat.** Every design decision there should assume a glance from three feet away. Dark background (kitchens are bright, and the screen stays on), 22pt+ type, one instruction, one button, one thumb.

Every other state exists to protect state 3 from clutter.

---

## Where all 22 panels go

Nothing here gets thrown away without a reason. Most of it moves.

| Current panel | New home | Why |
|---|---|---|
| `IngredientsPanel` + `MissingIngredients` | **Gather** — merged into one checkable list | These were two components asking the same question |
| `TierBudgetPanel` | **Gather** — collapsed to one line: "2 missing · $3.10 at Aldi ▸" | The full breakdown is a tap, not a panel |
| `AllergyPanel` | **Gather** — as a red flag *on the offending row* | A warning next to the ingredient beats a warning in a box below it |
| `EquipmentGate` | **Gather** — bottom half | Same question as ingredients: do I have what I need |
| `RecipeTransformPanel` + `VeggieBoost` + `AdaptRecipe` + `ChangeRecipeToggle` | **Look** — one row of chips (Vegan · GF · Lighter · +Veg) | Four components, one job. Changes apply on tap — no separate "apply" toggle |
| `WellnessPanel` + `GutHealthPanel` + `NutritionFacts` | **Look** — one line, tap to expand | Three nutrition panels is two too many |
| `FoodSafetyPanel` | **Cook** — inline on the step where the protein is handled | "165°F" matters at minute 12, not minute 0 |
| `SensoryCues` | **Cook** — under each step | This is the best content in the whole app and it's buried in a panel. It belongs exactly where the user needs it |
| `RecipeStepViewer` | **Cook** — rebuilt full-screen, one step | Bento grid → single card |
| `FinishedDishPixelator` | **Show** — runs on *your* photo, after | Moves from spoiler to reward |
| `RecipeVariations` · `ServeWith` · `ExpertTips` | **After Show** — "Next time, try…" | Post-cook is when someone actually wants ideas |
| `StorageGuide` · `MakeAhead` | **After Show** — the leftovers moment | Tied to a real trigger instead of sitting cold in a scroll |
| `CopycatPanel` | **Cut** | Trademark exposure (see the facelift doc) |
| BuildBar launcher | **Cut from the recipe** | Different verb. Lives in Cook's Invent entry |
| `RecipeFAQs` | **Cut** | Zero recipes have hand-authored FAQ data. It renders nothing |

**22 panels → 4 screens.** Three components deleted, eleven merged, eight relocated.

---

## The Cook tab shell

The `/recipes` hub currently has three tabs: Browse, Ask AI, Invent. Cut them.

**"Ask AI" and "Invent" aren't destinations — they're what happens when search doesn't find what you want.** Replace all three with one search field at the top of Cook:

- Type "chicken" → recipes appear.
- Type "chicken, rice, half an onion" → the field recognizes it as a list and offers *"Make something from these →"* (that's Invent).
- Type something with no matches → *"Nothing yet. Want me to build one? →"* (that's Ask AI).

Same three capabilities, zero tabs, and the AI shows up as a helpful response rather than a room you have to know to walk into. This is the "being listened to" feeling in one component.

Below the search field, Cook holds four rows: **Recipes · Pantry · Shopping · Bar.** Not tabs — sections you scroll past.

---

## The verification mechanism (this is the patent)

Right now `isFaithful` is a checkbox. Replace it with something the app already knows.

By the time someone reaches state 4, the session has recorded:

- which ingredients they checked off in **Gather**, and which they skipped
- which change-chips they tapped in **Look** (vegan, GF, substitutions)
- how many steps they completed in **Cook**, and how long each took vs. the estimate
- whether they photographed steps along the way

That's a real cooking record. Derive the verification mark from it:

| Mark | Condition | Shown as |
|---|---|---|
| **Faithful** — honey check | All steps completed, no substitutions, no skipped ingredients | Honey circle + check |
| **Adapted** — matcha mark | Completed, but with declared swaps (the chips they tapped) | Matcha circle, swaps listed on the flip side |
| **Remix** — crimson mark | Skipped steps or undeclared ingredient changes | Crimson circle, "made it their own" |

The user still writes their remix note — that's the human part. But the *mark* comes from the session, not from a claim.

**Why this matters three ways:**

- **Product:** the leaderboard becomes trustworthy. Someone who cooks it exactly right outranks someone who says they did.
- **IP:** "deriving a fidelity attestation for a user-submitted dish image from recorded cooking-session telemetry, and displaying that attestation on a flip-card bound to the source recipe" is a specific, novel, claimable mechanism. A self-reported checkbox is not.
- **Investor:** it's one sentence, and no recipe app has it.

`DishFlipCard` already exists and already renders the front/back flip and the faithful badge. The work here is changing where `isFaithful` comes from — not building a new component.

---

## Visual and interaction rules for these screens

**Type**
`Press Start 2P` for the section labels only — "WHAT YOU NEED", "STEP 3 / 7", "YOU MADE IT". Recipe steps are 22pt humanist sans at 1.5 line height. Ingredient rows are 17pt. Never a pixel font on anything you have to read while holding a knife.

**Color, by state**

| State | Background | Accent | Why |
|---|---|---|---|
| Look | Cream | Honey for price | Browsing should feel warm and light |
| Gather | Cream | Honey checks, crimson allergy flags | Checking things off should feel earned |
| Cook | **Bark (dark)** | Honey timer + Next | The one dark screen. It reads across a kitchen and doesn't blind you at 9pm |
| Show | Cream | Crimson post button | The single loudest moment in the app |

Crimson appears exactly twice in this whole flow: the allergy flag and the post button. That's the discipline that keeps it meaning something.

**Touch**
- Every target ≥ 44pt. The Next button in Cook is 56pt and spans the width.
- Swipe left/right moves between steps. The button is for people who'd rather tap.
- **Screen stays awake in state 3.** Non-negotiable. Nothing kills a cooking app faster than a screen that sleeps mid-step.
- Haptic tap on each checkbox in Gather, and a heavier one on step completion. This is the 2002 tactility you're after — a thing that responds physically when you touch it.

**Motion**
- State transitions push horizontally, like turning a page. Not fades.
- The Cook step advance is a card slide, ~200ms.
- The pixelation in state 4 animates — the photo resolves into pixels over about a second. That's the payoff moment and it should be watchable.

---

## Empty and edge states

These are where "cared for, not neglected" actually gets built.

| Situation | Current | Should be |
|---|---|---|
| No recipe selected | "No recipe selected. ← BACK TO RECIPES" | "Nothing picked yet. Here's what's quick tonight →" with three cards |
| Missing ingredients | A list of what you don't have | "You've got most of it. Skip the miso — soy sauce and a little honey gets close." |
| Search finds nothing | Empty grid | "Nothing yet. Want me to build one from what you've got?" |
| User abandons mid-cook | Nothing | Next open: "You were three steps into the miso noodles. Pick it back up?" |
| No photo at the end | Blocks submission | "No photo, no problem — logged it anyway. You can add one later." |

That last one matters. `RecipeFull` currently prompts for a photo before logging the cook. Never let a missing photo stand between someone and credit for having cooked.

---

## Build order

1. **Split `RecipeFull` into four routed states.** This is the big one. The panels already exist as components — this is re-parenting them, not rewriting them.
2. **Rebuild `RecipeStepViewer` full-screen.** Kill the bento grid, the ad square, and the bit-depth picker. Add wake-lock and swipe.
3. **Move `FinishedDishPixelator` to state 4** and point it at the user's photo.
4. **Derive `isFaithful` from session telemetry.** Add a session recorder in Gather + Cook; feed it to `DishSubmissionModal`.
5. **Collapse the three Recipes tabs into one search field** with the two fallbacks.
6. **Delete** `CopycatPanel`, `RecipeFAQs`, the BuildBar launcher, and the `ChangeRecipeToggle`.

Steps 1 and 2 are most of the value. Step 4 is most of the defensibility.

---

## One note

The content in this app is genuinely good — `SensoryCues` telling someone the butter will foam and then quiet down is better writing than anything in the top ten recipe apps. The problem was never the material. It was that all of it was on screen at the same time, so none of it could land.

Four screens gives every one of those panels a moment where it's the only thing being said.
