# Dig In — iOS Face Lift

**Audit date:** July 28, 2026
**Scope:** whole-app UX/UI review with IP counsel framing. Mobile-first (iOS).

---

## 1. What's actually in the app right now

| Measured | Count |
|---|---|
| Routes in `App.jsx` | 51 |
| Page directories | 63 |
| Shared components | 76 |
| `lib/` modules | 86 |
| Hubs with tabs | 8 (30 tabs total) |
| Always-on floating overlays | 3 |
| Systems on the Home screen alone | 16 |
| `dist/` build size | 77 MB |

Every route is statically imported into `App.jsx`. There is no code-splitting, so the entire app loads on first paint.

### The core diagnosis

You've consolidated three times already (July 24, 25, 27 — the comments in `App.jsx` document it). But each pass **nested** features instead of removing them. Every old path still resolves. So the surface area never shrank — it got hidden. Eight hubs holding thirty tabs is not fewer features than thirty pages. It's thirty features with a lid on.

That's the thing to fix. Not the colors.

---

## 2. IP counsel read

### What is actually defensible

Three things in this codebase look novel. Everything else is crowded prior art.

**1. Recipe-fidelity attestation (the flip card + check mark).**
A user posts a finished-dish photo; the card flips to the recipe used; the system marks whether the recipe was followed or altered, and surfaces that mark publicly. This is a real, claimable mechanism — provenance verification of a user-generated food image tied to a source recipe and a deviation indicator. Nobody in the recipe-app space is doing it. **This is your patent.** It's currently buried as an unbuilt idea while 62 other directories ship.

**2. Pixel dish rendering** (`FinishedDishPixelator`, `DishPixelPreview`, the pixel-ingredient system). The transformation pipeline is patentable-adjacent; the visual output is protectable as trade dress *if* it's consistent. Right now it isn't — it competes with eleven other visual systems.

**3. Craving → proximity routing** ("Find It Near Me Now"). Weaker. Heavy prior art from Yelp, Google, DoorDash. Don't build a claim here.

Everything else — pantry inventory, barcode scanning, meal planning, allergy filters, leaderboards, deals, copycat recipes, shopping lists — is commodity. It is not just undifferentiated; it is **actively diluting** the two claims that matter. A patent examiner and an investor will both ask the same question: what is the one thing this does that nothing else does? Right now the app can't answer in one sentence.

### Active risk to clear before any raise or App Store submission

| Issue | Where | Severity | Action |
|---|---|---|---|
| Pokémon Ruby/Emerald pause-menu is copied by name in the source comment | `components/VerticalNav/VerticalNav.css`, `VerticalNav/index.jsx` | **High** — literal trade dress, documented intent in a comment | Delete the component. The tab bar replaces it. |
| Named restaurant chains in user-submitted recipe schema (`restaurant_chain`, "Chick-fil-A Sauce") | `components/Nav/RecipeSubmissionForm.jsx`, `Leaderboard.jsx`, Copycat Lab | **High at scale** — nominative fair use holds until you're funded, then it invites C&Ds | Strip chain names from the schema. Rename "Copycat Lab." Use "inspired by" language, never the mark. |
| "Girl Dinner" as a feature name | `pages/GirlDinner` | Medium — contested/genericized mark | Cut the feature entirely. |
| `Press Start 2P` font | `styles/styles.css` | Clear — SIL OFL, commercial use fine | No action. |
| No LICENSE audit for `three`, `tesseract.js`, `leaflet` bundles | `package.json` | Low | One-time check before diligence. |

### The business point

You said you want to negotiate through attorneys rather than as an individual. That's correct, and it only works if there's something to negotiate over. A trademark on "Dig In" plus a filed provisional on the fidelity-attestation mechanism is what makes a brand deal defensible. Sixty-three features is not leverage — it's maintenance cost.

**Do this in order:** file a provisional on the flip-card verification mechanism → trademark the wordmark and the pixel dish mark → then cut.

---

## 3. What breaks on iOS specifically

These aren't polish notes. They're broken.

1. **The nav requires hover.** `components/Nav/index.jsx` reveals sublinks on hover/focus. iOS has no hover. Every sublink under Explore — Community, Craving, Copycat, City Explorer, Passport, Girl Dinner, Pantry — is unreachable on a phone.
2. **No safe-area handling.** Zero `env(safe-area-inset-*)` in any stylesheet. Content will run under the notch and the home indicator. (`@capacitor-community/safe-area` is installed and unused.)
3. **It is not an iOS app yet.** No `capacitor.config.*`, no `ios/` directory. Right now it's a PWA. You need to decide: Capacitor wrap, or a real Swift shell.
4. **77 MB bundle, no lazy loading.** On cellular this doesn't open. Every one of the 51 routes is a static import.
5. **`Press Start 2P` at body size.** It's a 5×7 bitmap face. On a 390pt screen at body size it is not legible, and it reads as a novelty rather than a product.

---

## 4. The cut list

### Delete outright

- `VerticalNav` — trade dress risk, and redundant with a tab bar
- `GirlDinner` — trademark risk, thin feature
- `ChaosNight` — answers the same question as Craving
- `Deals`, `TrendingArbitrage`, `TrendingCostCard` — coupon-app energy; the exact opposite of whimsy
- `CarPlayDashboard`, `Widget`, `PixelMap`, `PixelIngredientDemo`, `RuralTrend` — dev demos sitting in the production tree
- `ChicagoStoreMap` + `TexasStoreMap` — two hardcoded cities reads as unfinished. One map, one data layer.
- `Leaderboard` as a standalone page — it's a tab of the dish feed
- `Badges` as a standalone page — it lives in You
- `Analytics`, `MarketMetrics`, `UserMetrics` — move to a separate admin build, not the app bundle

### Merge

| Merge these | Into |
|---|---|
| `BuildBar` + `ZeroProof` + `DrinkScan` + `CopycatDrinks` | one Bar section inside Cook |
| `PantryHub` + `BarcodeScanner` + `Shopping` | one Kitchen section inside Cook |
| `Explore` + `Discover` + `GlobalFood` + `CityExplorer` + `FoodPassport` | Out there |
| `Occasions` + `CheckIn` + `Circles` + `Table` | Out there |
| `MyCookbook` + `Boards` + `MealPlan` + `WhimsyWeek` + `MemoryVault` + `HealthProfile` + `Badges` | You |
| `AskNova` + `NovaNudge` + `CookReflectionPrompt` | one Nova surface, one entry point |

**Three floating overlays on a 390pt screen is three things competing with the tab bar.** Nova should be one thing that speaks when it has something to say, not three that hover.

### Result

51 routes → **~18**. 30 tabs → **12**. 8 hubs → **5 tabs**.

---

## 5. The five tabs

| Tab | Holds | The question it answers |
|---|---|---|
| **Table** | feed, community, reels, verified dishes, leaderboard | "What are people doing?" |
| **Cook** | recipes, pantry, shopping, bar, transform | "What am I making?" |
| **Dig In** (center, raised, crimson) | camera → post dish → verification flip | "I made something." |
| **Out there** | map, city, passport, occasions, circles, check-in | "Where am I going?" |
| **You** | cookbook, boards, meal plan, whimsy, memories, badges, health, settings | "What's mine?" |

The center button is the whole thesis. You said you want people to stop being passive participants — so the biggest, loudest, most reachable target on the screen is *make something and show it*, not *scroll*.

### Why 5 and not 6

Thumb reach on an iPhone 15/16 covers roughly the bottom third. Five 44pt targets fit at 390pt with breathing room. Six starts crowding, and the outer two get missed.

---

## 6. Palette, with roles

You have 11 off-palette colors currently shipping in `styles.css` (`--dig-pink`, `--dig-pink-light`, `--dig-red`, `--dig-yellow`, `--dig-brown`, plus five workflow colors: `#FF9800`, `#9C27B0`, `#F44336`, `#00BCD4`, `#96B36B`). Delete all of them.

| Color | Hex | Its **only** job |
|---|---|---|
| Cream | `#F3EADA` | The only background. Never white. |
| Bark | `#33302A` | All text, all borders. |
| Matcha | `#6E8259` | Structure — tab bar, headers, dividers. |
| Honey | `#E0A32E` | Earned things — verification checks, saves, coins, badges. Never a background. |
| Crimson | `#C8001E` | Two uses only: the Dig In button, and the "altered" verification mark. |
| Pride of Barbados | texture | Section breaks and empty states at 8–12% opacity. Not wallpaper. |

Crimson is loud *because* it's rare. The moment it appears in three places it stops meaning anything. Same logic for honey — it should feel like a small reward, which requires that most of the screen isn't wearing it.

### Type

- `Press Start 2P` — **wordmark, section headers, and numbers only.** Never body text.
- Body — a warm humanist sans at 17pt/1.5. Something with round bowls. This is the "you are being listened to" register.
- One display serif, optional, for the essay/Substack surfaces.

---

## 7. What "2002" actually means here

This matters because I think the current build is chasing the wrong decade.

The Home screen currently runs 16 systems at once — search, filters, a spend slider, category chips, a grid, an ideas card, alchemist cards, coins, badges, hero highlights, a meal banner, closer look, trust stats, a slip card, an onboarding modal, and a flavor quiz modal. That density is **2012 web**, not 2002 desktop.

2002 felt like:

- **One thing at a time.** A window. You opened it, did the thing, closed it.
- **Space.** Empty pixels were not treated as failure.
- **Tactility.** Chunky borders, a click sound, a cursor that visibly moved, a button that visibly depressed. You keep the chunky borders — add the sound and the depress.
- **No infinite scroll.** Things ended. A page had a bottom. That's the antidote to the aimless scrolling you're trying to solve — build a feed with an end.
- **Being asked, then remembered.** Not an onboarding modal *and* a flavor quiz modal. One question on open, remembered forever.

**Concrete change:** replace the onboarding modal + flavor quiz with a single line at the top of Table — "What are you in the mood for tonight?" — with two or three tappable answers. It's warmer, it's one screen, and it's the "someone is listening" feeling you described. The quiz data you're collecting can be inferred from what they tap over two weeks. You don't need to interrogate them on day one.

**Give the feed an end.** Twenty to thirty cards, then a genuine bottom: "That's today. Come back tomorrow." This is a differentiator, not a limitation — it's the single most concrete way to make the app feel like it respects the user rather than farming them. It also makes the daily-active-user metric honest, which matters in a raise.

---

## 8. Build order

1. **Legal** — file the provisional on fidelity attestation. Delete `VerticalNav`. Strip chain names from the recipe schema.
2. **Structure** — five tabs. Execute the cut list. 51 routes → 18.
3. **iOS** — Capacitor config, safe-area insets, lazy-load routes, kill the hover nav.
4. **Palette + type** — 11 colors out, 5 in. `Press Start 2P` off body copy.
5. **Ship the flip card.** It's the patent, it's the leaderboard, it's the reason to open the app, and it isn't built yet.
6. **End the feed.**

---

## One more thing

You wrote that you keep adding ideas and need to bridge them instead. That's correct, and this codebase is evidence of it — 63 page directories built in about eight weeks is a serious amount of work. The problem isn't that you can't build. It's that nothing has been allowed to die, and features that don't die can't be defended, can't be explained to an investor in a sentence, and can't be shipped to an App Store reviewer without them asking what the app is for.

Cutting 45 routes isn't losing work. It's the first thing that makes the remaining six defensible.
