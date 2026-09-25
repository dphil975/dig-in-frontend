# The 7-Second Reel — Style Guide

*Dig In · Reel Feed creative bible. One dish, seven seconds, the whole journey.*

This is the standard every reel is measured against — whether it's AI-edited from a
user upload later, or the JS-driven stage reel that ships in `/reels` today. If a reel
breaks a rule here, it doesn't go in the feed.

---

## 1. The One Law

**7.0 seconds. Hard cap. No exceptions.**

Not 8. Not "7-ish." The constraint *is* the product. A 7-second loop hits a near-100%
completion rate, which is the single thing the TikTok / Reels / Shorts algorithm rewards
hardest. We are not fighting the algorithm — we are handing it exactly what it wants.

Every reel shows the **entire product life** of the dish: raw ingredients → finished
plate, in one unbroken arc. The viewer's brain gets a complete narrative in one breath.
That completion bias is the addiction.

---

## 2. The Five-Stage Arc

Every reel is built from the same five beats. The timings are fixed so the whole feed
feels like one continuous format, not a pile of random clips. (These are the exact
fractions the shipped reel uses — see `src/data/reels.data.js → STAGES`.)

| # | Stage         | Window      | On screen                          | Audio cue                     |
|---|---------------|-------------|------------------------------------|-------------------------------|
| 0 | INGREDIENTS   | 0.0 – 1.2s  | Raw components, laid out, colorful | Crunch of a pepper / knife tap|
| 1 | PREP          | 1.2 – 3.0s  | Chop · mix · season                | Sizzle as it hits the pan     |
| 2 | SIZZLE        | 3.0 – 5.0s  | The cook — bubbling, browning      | Simmer / *"almost there…"*    |
| 3 | PLATE         | 5.0 – 6.0s  | Final assembly, the garnish        | Satisfying thud of the plate  |
| 4 | BOOM          | 6.0 – 7.0s  | Steam rising, fork going in        | Nova: *"Boom."* / *"You did that."* |

**Rules of the arc**
- **One transition per stage boundary, max.** Five cuts total. Anything more reads as busy.
- The **middle stage (SIZZLE) is the longest** — it's the money shot. Don't rush it.
- The arc must **loop seamlessly** — the last frame should invite the first. Design for the
  repeat view, because you'll get it.
- Never skip a stage. A reel with no raw-ingredients open loses the "I could make that" hook.

---

## 3. Color

The reel canvas is **tinted per dish** by its dominant flavor, sitting on a near-black
base so the food owns all the brightness. Two custom props drive it: `--tint` (the hero
hue) and `--tint-2` (its deep shadow), fed into a radial gradient.

| Flavor  | `--tint`  | `--tint-2` | Feel                     |
|---------|-----------|------------|--------------------------|
| Spicy   | `#c8452c` | `#3d1109`  | Heat, char, adrenaline   |
| Smoky   | `#a8611e` | `#31210c`  | Low-and-slow, depth      |
| Savory  | `#9c6b2f` | `#2e1e0d`  | Umami, comfort           |
| Rich    | `#8b5e3c` | `#3a2618`  | Butter, cream, indulgence|
| Tangy   | `#c9532b` | `#3a150a`  | Bright, acidic snap      |
| Light   | `#3f8f6a` | `#123125`  | Fresh, green, clean      |

**Non-negotiables**
- Base surface is `#0d0a12` (near-black). The food is the only light source.
- Brand accents stay constant across every reel: **purple** `#7c5daf` for actions (Try This),
  **gold** `#d4a574` for Nova + coins. These never get tinted — they're how you know it's Dig In.
- The saturation *ramps* through the arc: dull-ish at INGREDIENTS (`saturate .8`), peaking at
  SIZZLE and BOOM (`saturate 1.4+`). The dish visibly "comes alive" as it cooks.

---

## 4. Motion

- **Ken-Burns, not chaos.** Each stage nudges scale a few percent (`scale(1.04–1.06)` at the
  cook/boom peaks). Subtle push-in, never a jump-cut zoom.
- **A single top-down shimmer** sweeps the canvas once per 7s loop — the "steam / heat" light.
- **Stage word pops** in with a 0.5s ease (`translateY + scale`), then holds. One motion, then still.
- **Respect `prefers-reduced-motion`** — kill the shimmer, the live dot, and the pop. The reel
  still reads perfectly as five held frames.

---

## 5. Typography & Overlay

- **Stage word:** 900 weight, `clamp(38px, 12vw, 64px)`, dead center. It's the beat marker.
- **House voice is uppercase word-tokens, not emoji** (`RICH`, `SIZZLE`, `20 MIN`) — matches the
  rest of the app; emoji are off-brand here.
- **Left overlay** (bottom-anchored, over a bottom-up black gradient): handle → dish title →
  Nova caption → meta chips → hashtags → **Try This**. Reading order top to bottom.
- **Right rail:** Heart (with live like count) · +10 coins · Share. Thumb-reachable, always in
  the same spot so muscle memory forms.
- Keep the right ~66px clear of the overlay so the rail never collides with the caption.

---

## 6. Audio

Optional, but when present it's one of exactly three things:
1. **A satisfying diegetic sound** — crunch, sizzle, or simmer, matched to the stage.
2. **A Nova micro-quip** — 7 words or fewer, landing on the BOOM beat (see the Nova Quip Library).
3. **Silence** — a clean loop with no audio still works. Never license a random pop song.

Nova's voice always lands in the final second, never earlier. She's the payoff, not the narrator.

---

## 7. The Nova Payoff

The last beat (6→7s) flashes a **Nova quip** — her reacting to *your* cooking, not describing it.
*"Boom. You just out-cooked the restaurant."* · *"I saw that dip. Olympic-level."* Users re-watch
specifically to catch what she says. That's the dopamine hook that makes the loop a loop.

The quip card uses gold `NOVA` eyebrow + white line, centered, blurred-dark backing so it reads
over any tint. It fades in for ~0.9s then out, timed to the loop — never sticky.

---

## 8. The Checklist (ship gate)

A reel ships only if **all** of these are true:

- [ ] Runtime is exactly 7.0s and loops seamlessly.
- [ ] All five stages present, in order, one transition each.
- [ ] Canvas tinted to the dish's dominant flavor; base stays near-black.
- [ ] Brand purple (actions) and gold (Nova/coins) present and un-tinted.
- [ ] Overlay reading order intact; right rail unobstructed.
- [ ] Audio is crunch/sizzle/simmer, a ≤7-word Nova quip, or clean silence — nothing else.
- [ ] Nova quip lands in the final second only.
- [ ] Works with `prefers-reduced-motion` on.
- [ ] "Try This" resolves to a real recipe.

---

*Implementation reference: `src/components/social/Reel/` — `index.jsx` (the player: clock + overlay),
`ReelFeed.css` (all the visual rules above); `src/data/reels.data.js` (the arc + content);
`src/pages/Community/ReelFeed/` (the Reels tab that hosts it). Change the guide and the code
together.*
