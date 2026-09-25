# Dig In — UX/UI Review for Patent Attorney
### A Screen-by-Screen Walkthrough of the App's Distinctive Interaction Design · July 2026

> ⚠️ This document is not legal advice. It is a companion to `PATENT_ATTORNEY_PREP.md` — that document explains the five *backend/business* systems (data pipeline, substitution engine, gamification, craving pipeline, data monetization); this one shows the *interface* the user actually touches, so the attorney can see how several of those systems (and a few new ones) are embodied in a specific, screenshot-able interaction rather than just described in the abstract.

Screenshots referenced below live in `patent-review-screenshots/` in this same repo, numbered to match the sections here. They were captured directly from the running app (some using synthetic/placeholder photos rather than real food photography — noted where relevant — but the mechanism shown is the real, shipped implementation, not a mockup).

---

## Why This Document Exists

A method claim is stronger when the attorney can see exactly what happens on screen, in what order, and why it's not just "a pretty UI." The six flows below were chosen because each one is a **specific, multi-step technical process that happens to be exposed through an interface** — the kind of thing that shows up in a patent claim as "a computer-implemented method comprising the steps of..." Cosmetic screens (nav bars, generic lists) are left out.

---

## Flow 1 — Photo-to-Pixel-Art Conversion Engine

**Screenshots:** `04-pixel-creator-studio.png`, `05-pixel-creator-photo.png`

**What it is:** A user uploads (or snaps) any photo of food. The app runs it through a pipeline that:
1. Downsamples the photo to a grid sized by a user-selected "console era" (8/16/32/64/128-bit — NES through a modern "HD-2D" tier), each tier mapped to a specific cell size and palette-color budget.
2. Extracts a color palette **from that specific photo** using median-cut quantization (not a fixed/generic palette) — see the "PALETTE" swatches in the screenshot, five stylistic tints (RPG Warm, Neon Arcade, Soft Pastel, Monochrome, Stardew) applied to whatever colors the photo actually contains.
3. Quantizes every cell to its nearest palette color, runs edge-detection against that **flat, un-dithered** quantization specifically (a deliberate technical choice — dithering the edge-detection pass produces false-positive "edges" at every dithering speckle, which reads as visual noise), and draws a silhouette outline.
4. Renders the result as flat, hard-edged blocks — no smoothing — at the selected resolution.

**Why it's a specific method, not just a filter:** most consumer "pixelate" tools either (a) apply a fixed, generic palette regardless of source image, or (b) do a naive per-pixel posterize with no edge/silhouette pass. This pipeline's specific combination — photo-derived palette via median-cut, selectable detail tier mapped to concrete cell-size/color-count pairs, and edge-detection performed against flat (not dithered) data specifically to avoid speckling — is a defined, repeatable process a claim could describe step by step.

**Where it's reused, not rebuilt:** the same engine (not a copy of it) powers the recipe-card dish preview (Flow 3) and the step-completion boomerang (Flow 2) — worth noting to the attorney as evidence this is a genuine reusable system, not a one-off screen.

---

## Flow 2 — Boomerang Step Capture (Camera Burst → Shared-Palette Pixelation → Client-Side GIF)

**Screenshots:** `09-boomerang-prompt.png`, `10-boomerang-result.png` (the looping result shown is Chromium's synthetic test camera pattern, used because this capture was verified in an automated headless-browser test rather than in front of a physical camera — the pipeline itself is identical either way)

**What it is:** When a user finishes a recipe step (taps "NEXT"), the app offers to capture a short "boomerang" (forward-then-reverse looping clip) of that step, entirely client-side, in this specific sequence:
1. Opens the device camera and captures a fixed burst of frames at a set interval.
2. Reorders the frames into a bounce sequence — forward through the burst, then backward through the middle frames only (skipping the first/last so the loop doesn't stutter or repeat a frame back-to-back).
3. Extracts **one shared color palette from a single reference frame** (the middle frame of the burst) and quantizes *every* frame against that one palette — a specific technical choice to prevent the animated result from flickering, since re-deriving a palette per frame (the "obvious" naive approach) causes the color mapping to shift frame to frame.
4. Encodes the pixelated, palette-locked frame sequence into a real animated GIF file, in the browser, using a Web Worker — no server round-trip.
5. Persists the result locally, keyed to that specific recipe step, and displays it in place of a static photo for that step going forward.

**Why it's a specific method:** the shared-palette-across-a-burst step (2→3 above) is the non-obvious part — it's a deliberate solution to a real artifact (flicker) that a naive frame-by-frame implementation would produce. That's exactly the kind of "why," not just "what," a method claim benefits from.

---

## Flow 3 — Recipe Card → Pixel-Art "Finished Dish" Preview

**Screenshots:** `01-recipe-card-grid.png`, `02-recipe-slip-modal.png`

**What it is:** Tapping a recipe card opens a split card: the left half is *not* a photo — it's the same photo run through Flow 1's engine automatically, with no button press, the moment the card opens. If the recipe has no photo, a clean "no photo yet" state renders instead (deliberately not a placeholder pretending to be content). The right half shows the recipe's title (a real `<h1>`, not a styled `<div>` — see the Accessibility/SEO note below), quick facts, and a computed description (Flow 6).

**Why it's relevant:** this is the same underlying engine as Flow 1, applied automatically as a *preview generation step* rather than a user-triggered export — worth attorney attention as a second, distinct application of the same claimed method (auto-generation vs. on-demand generation may be worth separate claim language).

---

## Flow 4 — Flavor-Pairing Recommendation Engine ("ALL DRINKS")

**Screenshot:** `03-all-drinks-pairing.png`

**What it is:** Every recipe has a "PAIRS WITH" drink recommendation, and an "ALL DRINKS" button opens the full, ranked catalog (previously hard-capped at a top-9 subset — now shows every matching drink, ranked). The ranking/scoring method combines several independent signals, not a single tag match:
1. Keyword overlap between the recipe's detected flavor category (spicy/sweet/savory/rich/light/earthy/smoky/tangy, computed from the recipe's own text) and each drink's own flavor tags/description.
2. Whether the drink's own data explicitly lists the recipe's cuisine as a pairing.
3. A cuisine→drink-style lookup (e.g. "this cuisine typically pairs with tea/matcha") cross-referenced against the drink's category.
4. Whether the drink is tagged as contrasting a flavor quality the recipe actually has (e.g. a drink built to "cut through richness" scores higher on a rich dish).
5. A visible, generated one-line rationale per drink ("Cuts through the rich notes in this dish," "A classic pairing with Korean meals") — the ranking isn't just silently applied, it's explained per result.

**Why it's relevant:** step 5 (surfacing *why* two items were matched, not just presenting a ranked list) is the part worth flagging to the attorney — it's a distinct output of the method, and it's the piece that turns "a recommendation algorithm" into something with a describable, user-visible artifact.

---

## Flow 5 — Per-Step Help + Ingredient Scaling

**Screenshots:** `06-finished-dish-and-ingredients.png`, `07-recipe-step-viewer.png`, `08-step-help-open.png`

**What it is:** Two related but separate mechanisms on the same page:
- **Ingredient scaling:** a 1×/2×/3× toggle recomputes every ingredient quantity live, grouped into named sub-sections (e.g. "For the Iced Variation" vs. "For the Hot Preparation") rather than one flat list — relevant because the scaling has to apply per-group correctly when a recipe has multiple prep paths.
- **Step-level help:** any step can carry an optional "why" explanation, surfaced only via an explicit "?" affordance so it doesn't clutter steps that don't need it. The explanation is written to answer *why* a step is sequenced or performed a certain way (see the toasting-cumin example in the screenshot), not to restate the instruction.

**Why it's relevant:** less a utility-patent candidate on its own, more a strong **design-patent / distinctive-visual-identity candidate** — the bento-box step layout, the flash/reveal transition between steps, and the specific two-square-plus-preview-rectangle arrangement are a distinctive enough visual treatment to ask the attorney about protecting separately from the underlying method.

---

## Flow 6 — Generated Recipe Content (Variations / Serve-With / Expert Tips)

**Screenshot:** `08-step-help-open.png` (bottom half — "WAYS TO REMIX THIS RECIPE" / "WHAT TO SERVE WITH IT" / "EXPERT TIPS")

**What it is:** Fewer than 1% of recipes in the current dataset have hand-written variation/serving/tip content. For every other recipe, the app now generates this content from the same flavor-detection signal used in Flow 4, routed through two separate template pools depending on whether the recipe is a drink/dessert or a savory dish (a drink gets "swap to oat milk"-style suggestions; a stir-fry gets "swap the protein"-style suggestions) — hand-authored content always takes priority when it exists; generation only fills the gap.

**Why it's relevant:** this is a rules-based content-generation method conditioned on a specific classification step (drink vs. savory) before selecting which suggestion pool to draw from — worth describing to the attorney as a fallback-content-generation method distinct from Flow 4's ranking method, even though both draw on the same underlying flavor-detection signal.

---

## Accessibility / SEO Notes (Minor, but Relevant to "Specific Implementation" Claims)

Two small but concrete implementation details worth mentioning if the conversation turns to copyright/specific-implementation (rather than patent) protection:
- Recipe titles are real `<h1>` elements (previously non-semantic `<div>`s) — relevant to accessibility compliance and to any claim describing a specific document structure.
- Recipe descriptions run through a length-capped, keyword-anchored generation step (target ~155 characters, always includes the dish's own name) rather than displaying raw, unbounded author text — a specific, describable text-processing method, however minor.

---

## What to Bring/Reference Alongside `PATENT_ATTORNEY_PREP.md`

1. This document plus the `patent-review-screenshots/` folder (10 images, referenced by number above).
2. A note that Flows 1–3 and 4/6 share underlying engines (`src/lib/pixelArt.js`, `src/lib/flavorPairing.js`) — useful if the attorney wants to understand claim scope (one method applied in three places vs. three separate methods).
3. If asked "is this novel over [X consumer photo filter app]" — the specific answer is the photo-derived (not fixed) palette, the flat-vs-dithered edge-detection distinction, and the shared-palette-across-a-burst technique for the boomerang flow. Those are the three most defensible "why," not just "what," details in this document.

---

*UX/UI Patent Review · Dig In · July 2026 · Not Legal Advice*
