# Dig In — The Home Page, Rebuilt on Tumblr's Logic

**July 28, 2026** · Reviewed: `src/pages/Home/index.jsx` (519 lines), `Home.css` (372 lines)

---

## Part 1 — What's wrong with the current hero

### The logo is 450 lines down

This is the strangest thing on the page and it's worth stating plainly. The order of the actual DOM:

1. Nav
2. Onboarding modal
3. Flavor quiz modal
4. Search bar
5. "What can you spend?" budget widget
6. Filters toggle
7. Filters panel
8. Related-category chips
9. The recipe grid
10. "See all recipes →"
11. SmartFinder (a *second* budget slider, with its own ZIP field)
12. **← the DIG-IN logo and tagline appear here, at line 450**
13. HeroHighlights
14. MealTimeBanner
15. CloserLook
16. Whimsy Week CTA
17. Recalibrate CTA
18. InteractiveHeroRecipe
19. TrustStats

Your brand appears in position 12 of 19, roughly eight screens down, sandwiched between a store-deal finder and a highlights reel. The comment above it says *"demoted, not deleted"* — that was a deliberate call, and it went too far. There's a difference between not having a giant marketing hero and having your name below the fold.

### Nine more specific problems

**1. The tagline is "PIXEL RECIPE GENERATOR."** That's a description of a utility. Nothing about people, community, whimsy, or being taken care of. It reads like a tool someone made in a weekend, which is the opposite of what's actually here.

**2. Money is the second question you ask.** "What can you spend?" appears before a single dish is visible. Leading with a budget constraint frames the whole app around scarcity. It's a genuinely great feature in the wrong position — it should appear once someone *wants* something, not as the price of entry.

**3. Two modals chain on first open.** `OnboardingModal` completes, then immediately triggers `FlavorQuizModal` (line 243). Two interrogations before anyone sees food. This is the exact opposite of "you are being listened to" — it's being processed.

**4. Two nearly identical CTA blocks back to back.** Both `recal-cta`, same structure, same button treatment, ~90 words each (lines 475 and 492). The second one is invisible by the time you reach it.

**5. It's a grid, not a feed.** `.reel-grid` at `minmax(380px, 1fr)`, `max-width: 1240px`. Uniform tiles at 1240px wide reads as a catalogue — a database with pictures. Nothing about it says a person made this.

**6. There are no people on the page.** No usernames, no avatars, no "who cooked this." Every recipe is anonymous inventory. For an app whose whole thesis is connecting people, the home page has zero humans on it.

**7. Filters are hidden behind a ⚙ toggle.** Discovery is collapsed by default while a budget calculator is expanded by default. That's backwards.

**8. Two budget interfaces on one page.** The `home-budget` widget and `SmartFinder` both ask "what can you spend," 200 lines apart, with different UIs.

**9. Sixteen systems, no hierarchy.** Nothing on this page is bigger, louder, or more important than anything else, so the eye has nowhere to land.

---

## Part 2 — What Tumblr actually does

Tumblr's dashboard is the right reference for you, and specifically for reasons that have nothing to do with looking retro.

**It has no hero at all.** You land directly in the feed. There's no banner, no value proposition, no "welcome to Tumblr." The content *is* the pitch. For an app whose problem is "people aimlessly scroll and feel nothing," starting with substance instead of marketing is the whole point.

**One narrow column.** Roughly 540px, single file, variable-height posts. A grid says *browse this inventory*. A column says *read this, then this, then this*. The column is why Tumblr feels like listening to people and Pinterest feels like shopping.

**Post types are different shapes.** Text, photo, quote, link, chat, audio, video — each renders as a visually distinct object in the same column. That variety is what makes an endless column readable instead of numbing. Uniform cards are what make a grid boring.

**Tags are the navigation.** Not a filter drawer — clickable tags on the bottom of every post, plus a running list of the tags you follow. You travel sideways through tags, not down through categories. This is the single most copyable thing for you.

**Reblog makes the chain visible.** You see who posted it, who added to it, what they said. Attribution is structural, not a byline.

**Left sidebar is quiet.** Small, low-contrast, gets out of the way. The feed is the product.

**Tabs above the feed, not sections down the page.** Following · For You · Your Tags. Three ways to see the same column.

---

## Part 3 — The redesign, in your pixel style

Nothing here abandons the pixel look. Chunky borders, `Press Start 2P` headers, cream and bark, the 16-shade palettes, `image-rendering: pixelated`, the flip cards — all of it stays. What changes is the *shape of the page*.

### The structure

| Zone | Width | Holds |
|---|---|---|
| Left rail | ~180px | Wordmark, location + time, the crimson post button, four nav items, the tags you follow |
| Feed column | 540px | Three tabs, then posts, then an ending |
| Right rail | ~200px | Cooking Now, trending tags, your coins/badges/dish count |

On mobile: the rails collapse, the column becomes full width, nav becomes the tab bar. Same posts, same order.

### The six post types

This is what replaces the uniform recipe grid. Each is a different shape in the same column.

| Post type | Looks like | Why it earns a slot |
|---|---|---|
| **Dish post** | White card, avatar + username, big pixelated photo, verification mark, caption, tags | Your patent mechanism, as a social object. Tap flips to the recipe |
| **Ask post** | Solid honey block, pixel type, no image | "what do i do with half a fennel" — this is Tumblr's text post, and it's the cheapest possible way to get people talking to each other |
| **Nova pick** | White card, small thumbnail beside text | The recommendation, framed as a person picking something for you rather than an algorithm serving you |
| **Cooking-now post** | Dark bark block | "3 people are on step 4 of the same soup — join them." Live presence. This is the anti-loneliness feature and no recipe app has it |
| **Place post** | Card with a pixel map tile | A city, a store, a stall. This is how "get out of your area" enters the feed instead of hiding in a tab |
| **Chain post** | A dish post nested inside another dish post | Someone made someone else's dish. The reblog. This is your recipe-fidelity mechanism becoming a social graph |

Mixing six shapes in one column is what makes it scroll well. Six shapes of one width beats one shape in a grid.

### Tags carry the navigation

Every post ends in tags. Tags are clickable. The left rail lists the tags you follow. The right rail lists what's trending.

Your existing filter system already computes cuisines, flavors, and categories (`deriveRelatedCategories`, `FLAVORS`, `ideasYouMightLove`) — that logic doesn't change, it just gets rendered as `#onepan` at the bottom of a post instead of a chip inside a collapsed ⚙ panel.

**Tags are also where the whimsy lives.** `#brokebutfancy`, `#itriedmybest`, `#fridgeraid`, `#girldinner` — a tag is a joke, an identity, and a filter at the same time. A category chip labeled "Italian" is none of those.

### The feed ends

`that's today. come back tomorrow ✦`

Twenty to thirty posts, then a real bottom. This is the direct answer to the aimless-scrolling problem you described. Tumblr doesn't do this — it's the one place you should break from the reference, and it's a differentiator you can say out loud in a pitch.

---

## Part 4 — What to do with the sixteen displaced systems

Nothing is deleted.

| Currently on Home | Goes to |
|---|---|
| Search bar | Top of the feed column, one line, always visible |
| Budget widget | Becomes a **tag**: `#under5`. Also lives at the top of Cook, where money is the actual question |
| `SmartFinder` | Merges with the budget widget. One "what can you spend" interface, not two |
| Filters panel + chips | Dissolved into tags on posts + the tag rails |
| `.reel-grid` | Becomes the Cook tab's browse view, where a grid is correct |
| **DIG-IN title screen** | **Top of the left rail, at 100% opacity, above the fold** |
| Coins + badges | Right rail, bottom |
| `HeroHighlights` | Becomes a post type — an editorial card in the feed |
| `MealTimeBanner` | The first post of the column at meal times. Contextual, not a banner |
| `CloserLook` | A post type |
| Whimsy Week CTA | A post, once a week, on Sunday |
| Recalibrate CTA | Moves into Settings, where preferences belong |
| `InteractiveHeroRecipe` | A post type — the interactive one |
| `TrustStats` | Marketing page, not the logged-in feed. Nobody needs a trust badge after they've signed up |
| `OnboardingModal` | One question inline at the top of the first feed: "where are you cooking tonight?" |
| `FlavorQuizModal` | Delete the modal. Infer taste from what gets liked over two weeks — the recalibration engine already exists |

### The new tagline

Drop "PIXEL RECIPE GENERATOR." It describes the machinery.

Candidates that describe the feeling instead:

- **"come eat with people."**
- **"nobody cooks alone."**
- **"today's table."**

Lowercase, in `Press Start 2P`, under the wordmark in the left rail.

---

## Part 5 — Why this fixes the actual business problem

You said the goal is to stop people from scrolling aimlessly and get them connected — and eventually out of their neighborhoods.

A grid of anonymous recipes can't do that, because there's no one on the other side of it. The Tumblr column can, because every post has a name attached, a tag you can follow sideways, and a chain showing who made it after whom.

Three things this structure gets you that the current page can't:

1. **Usernames on the home screen.** Right now the app's front door has no people on it. One change puts a person on every single post.
2. **Cooking Now.** "3 people are on step 4 of the same soup" is a real reason to open the app at 7pm, and it's the closest thing to a cookout that software can do.
3. **A bottom.** The feed ends. That's the thing you can point at when someone asks how this is different from every other app farming attention.

---

## Build order

1. Move the DIG-IN wordmark to the top of the left rail. Ten minutes, and it fixes the most visible problem.
2. Replace the tagline.
3. Delete `FlavorQuizModal` from the chain; reduce onboarding to one inline question.
4. Build the post-type system — `DishPost`, `AskPost`, `NovaPick`, `CookingNow`, `PlacePost`, `ChainPost`. Reuse `DishFlipCard` for the first one; it's already built.
5. Convert the column: 540px, single file, variable height.
6. Render categories as tags on posts; build the two tag rails.
7. Merge the two budget interfaces; move the result into Cook.
8. Demote the remaining ten systems into post types.
9. End the feed.

Steps 1–3 take an afternoon and fix the worst of it. Step 4 is the real build.
