# Dig In — What to Redo on the Web So It Ships as an App

**July 28, 2026** · Supersedes the cut-list framing in `DIG_IN_iOS_FACELIFT.md`
**Premise:** every feature stays. The pixel style stays. One codebase ships web, iOS, and Android.

---

## Correcting my earlier advice

I told you to cut 45 routes. You pushed back, and you're right — I was solving for an App Store reviewer's attention span instead of for what you're actually building. A recipe app with 60 features that all work is a moat. A recipe app with 6 is a weekend project someone clones.

The real problem was never *how many* features. It's that they're all fighting for the same screen at the same time, and that the web code can't physically run as an app in its current shape.

**Nothing below deletes a feature.** Everything below is about making the web codebase portable.

---

## 1. The pixel style is your best asset, and it's currently wearing five other companies' clothes

This is the most important finding in the audit, and it's the opposite of "make it basic." It's about making the pixel system *ownable*.

Right now the pixel identity is assembled from named commercial games — and the source code says so out loud:

| Where | What the code says | Owner |
|---|---|---|
| `styles/pixel-ingredient-system.css:2` | `Pixel Ingredient System — "Cooking Mama" Theme` | Office Create / Taito |
| `styles/catalog.css:3` | `theme: Cooking Mama (DS) + Nintendogs (GBA)` | Office Create, Nintendo |
| `styles/styles.css:2996` | `Tab centre (Cooking Mama menu style)` | Office Create |
| `components/DiscoverGBA/DiscoverGBA.css` | `Pokémon Ruby (GBA) themed`, `classic Pokémon type colors` | Nintendo |
| `components/VerticalNav/` | `Pokémon Ruby / Emerald pause-menu styled` | Nintendo |
| `lib/pixelArt.js:59` | palette `stardew` — **the default on your pixelator** | ConcernedApe |
| `lib/pixelArt.js` | `Real LEGO® brick colors — the actual named hues from the brick catalog` | LEGO A/S |

The LEGO one is the sharpest. That comment documents deliberate copying of a specific trade dress, with the ® symbol, in a file you'd hand to a diligence team. LEGO enforces harder than almost anyone.

And `stardew` being the **default `paletteMode`** matters most of all: your patent mechanism — the pixelated finished-dish photo — currently outputs images in a palette named after someone else's game. The thing you'd file on is branded as a derivative.

### What to do (this makes the style stronger, not weaker)

Keep every visual technique. Chunky borders, `image-rendering: pixelated`, 16-shade palettes, the studded-cell renderer, the gingham backgrounds, the flip cards, the bit-depth picker. **Not one pixel of the look has to change.**

What changes is whose name is on it:

| Rename | To | Notes |
|---|---|---|
| `stardew` | `harvest` | Same 16 hexes. Make it the default. It's warm gold/green — already closer to your palette than to anything else |
| `lego` | `blocks` | Keep the studded renderer. Shift 3–4 hexes off the exact catalog values and delete the comment |
| `Cooking Mama` theme headers | `Dig In Kitchen Mode` | Comment change + file rename |
| `Nintendogs (GBA)` | delete the line | It's a comment describing catalog.css |
| `DiscoverGBA` | `DiscoverBento` (already exists) | Or rename to `DiscoverPanel` and drop the type-color pills |
| `VerticalNav` Pokémon menu | keep the cursor, drop the comment + the exact border treatment | The ► cursor is a genre convention. The Ruby border palette isn't |

That's about two hours of find-and-replace, and it converts a liability into a trademarkable visual identity. **After this you can file on the pixel dish mark.** Right now you can't.

---

## 2. One pixel system, not two

You have two complete, competing pixel design systems shipping:

| System | Lines | Palette | Actually used by |
|---|---|---|---|
| Dig In (`styles.css`) | 4,541 | Cream, bark, matcha, honey, crimson | Everything |
| Cooking Mama (`pixel-ingredient-system.css`) | 1,002 | `--cm-pink`, `--cm-blue`, `--cm-yellow`, gingham | **1 file** (`pages/Community`) |

The second one is 1,000 lines of hot pink and sky blue that no longer matches your brand and that exactly one component references. It's also where the trademark naming is worst.

**868 distinct hex colors ship in this app.** That's the number that makes it feel scattered rather than designed — not the feature count.

Port the handful of `cm-` classes Community uses into the main system with your palette, then delete the file. You lose no feature and no visual technique; you lose a second color scheme fighting the first.

---

## 3. What structurally blocks the web code from running as an app

This is the actual work. Measured on the current codebase:

| Blocker | Count | Why it breaks on a phone | Fix |
|---|---|---|---|
| `:hover` rules | 407 | iOS has no hover. Nav sublinks, card reveals, and dropdowns are unreachable | Pair every `:hover` with `:active`. Convert the nav dropdowns to tap-to-open sheets |
| Fixed widths over 400px | 178 | Horizontal scroll on a 390pt screen | `min(Npx, 100%)` or `clamp()` |
| CSS files with no media query | 53 of 106 | Half the app has no mobile layout at all | Mobile-first rewrite of those 53 |
| Multi-column grids (`1fr 320px`, `220px 1fr`) | ~30 of 153 | Sidebars collapse into unreadable slivers | Stack under 768px |
| No `env(safe-area-inset-*)` anywhere | 0 uses | Content runs under the notch and home indicator | Add to shell padding. `@capacitor-community/safe-area` is already installed and unused |
| No `capacitor.config.*`, no `ios/` | — | It's a PWA, not an app | Capacitor init — this is the smallest task on the list |
| 51 static route imports in `App.jsx` | 51 | Entire 77 MB app loads on first paint | `React.lazy()` per route |
| `three.js` bundled globally | used by 2 files | ~600 KB for the voxel creator alone | Dynamic import inside `PixelCreator` |
| `tesseract.js` bundled globally | used by 2 files | Multi-MB WASM for receipt OCR | Dynamic import inside `Pantry` |
| `RecipeStepViewer` bento grid | 1 file | Sidebar + ad square + bit picker on screen while cooking | Responsive: bento on desktop, single card on mobile |

**None of these remove a feature.** Lazy-loading three.js means the voxel creator still works — it just doesn't tax the 95% of sessions that never open it.

---

## 4. The shell: same features, two frames

This is how the web and the app align without either becoming the other.

**One route table. Two shells, chosen by viewport.**

| | Web (≥1024px) | Mobile (<768px) |
|---|---|---|
| Primary nav | Left sidebar, all 5 sections expanded, sub-items visible | Bottom tab bar, 5 tabs |
| Secondary nav | Sub-items always visible in the sidebar | Tap a tab → its sections stack on the screen |
| Center action | "Dig In" button at the top of the sidebar | Raised crimson camera button in the tab bar |
| Recipe page | Panels in a 2-column layout, all visible | Panels stack; the cook step goes full-screen |
| Density | Show more at once — you have the room | One thing at a time — you don't |

The five containers are **Table · Cook · Out There · You**, plus the Dig In action. Every one of your 51 routes lives inside one of them. Nothing is unrouted, nothing is deleted — the sidebar on desktop can show all of them at once, because a 1440px screen can hold them.

The thing that changes on mobile isn't the feature count. It's how many are *visible simultaneously*.

That's the whole alignment principle: **same app, same features, different density budget.**

---

## 5. What genuinely should still change on the web (not cuts — fixes)

| Issue | Where | Fix |
|---|---|---|
| Nav sublinks require hover | `components/Nav/index.jsx` | Tap-to-open. Broken on every touch device, including touchscreen laptops |
| `FinishedDishPixelator` runs before you cook | `pages/RecipeFull:214` | Move to after "I MADE THIS" and run it on the user's photo. Same component, better moment — and it's the reward the pixel style deserves |
| `isFaithful` is a self-reported checkbox | `components/DishSubmissionModal:42` | Derive from session data (skipped ingredients, applied transforms, completed steps). This is the patent |
| Two competing action buttons | `pages/RecipeFull:302` | "I MADE THIS" and "FIND STORES" have equal weight. Find Stores is a before-action, I Made This is an after-action. Split by state |
| Two hardcoded city maps | `Chicago/`, `Regions/Texas` | One map component, city as data. Two cities reads as unfinished; a data-driven map reads as national |
| `restaurant_chain` field, named chains | `Nav/RecipeSubmissionForm.jsx`, `Leaderboard.jsx` | Keep copycat recipes. Drop the mark from the schema — "inspired by," user-typed, not a structured brand field |
| 22 panels visible at once on `RecipeFull` | `pages/RecipeFull` | Keep all 22. Collapse 14 of them to headers you tap open. Desktop can default several to open; mobile defaults them closed |

That last row is the compromise that answers your objection directly. **Progressive disclosure, not deletion.** Every panel stays in the DOM and stays reachable. The user just isn't handed all 22 simultaneously.

---

## 6. Order of work

1. **Rename the borrowed palettes and strip the game names.** Two hours. Unblocks trademark filing on the pixel mark.
2. **Merge `pixel-ingredient-system.css` into the main system and delete it.** One competing palette gone, one feature lost: zero.
3. **Capacitor init + safe areas.** Half a day. You have an app after this.
4. **Lazy-load routes, three.js, and tesseract.** The 77 MB problem. Every feature survives.
5. **`:hover` → `:hover, :active` across 407 rules; nav dropdowns to tap.** Mostly mechanical.
6. **Mobile-first pass on the 53 CSS files with no media query.** The long one. Do it in tab order: Cook first, then Table, then Out There, then You.
7. **Responsive shell** — sidebar over 1024, tab bar under 768.
8. **`RecipeStepViewer` responsive**, and `RecipeFull`'s 14 collapsible panels.
9. **Session-derived `isFaithful`.**

Items 1–4 are about a week and get you a real app with every feature intact. 5–7 are the actual redesign.

---

## The short version

You don't have a too-many-features problem. You have three portability problems and one ownership problem:

- **868 colors and two design systems** — consolidate to one, keep every technique
- **407 hover rules and 53 unresponsive stylesheets** — mobile-first pass
- **77 MB in one bundle** — lazy-load, delete nothing
- **A pixel identity named after five other companies' games** — rename it and it becomes yours

Fix those four and the same code runs on the web, in the App Store, and on Play — with all 60-odd features, in your pixel style, and with a visual identity you can actually put a trademark on.
