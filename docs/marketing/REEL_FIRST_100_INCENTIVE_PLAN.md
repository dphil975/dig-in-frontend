# First 100 Uploads — Incentive Plan

*Dig In · Reel Feed launch fuel. The goal is not 100 reels. The goal is a feed that
looks alive on day one, and 100 people who feel like they got in early.*

Most apps die because nobody makes anything. This plan buys the cold-start: it pays
the first 100 creators generously and loudly, so the feed is never empty and the
earliest uploaders become the loudest evangelists.

---

## The one metric

**Reels published by real users in the first 14 days.** Not signups, not views —
*published reels*. Everything below is tuned to move that number to 100, then stop.
Once the feed self-sustains (new reels arriving without us paying per upload), the
first-100 program ends and normal Nova Coin economics take over.

---

## Nova Coins — the everyday currency

Coins are the base-layer reward every upload earns, before any special first-100 bonus.
(The wallet already exists in the app — `localStorage['dig_in_nova_coins']`, shown in
the Reel Feed top bar.)

| Action                          | Coins |
|---------------------------------|-------|
| Publish a reel                  | 100   |
| Your reel gets 100 likes        | 50    |
| Your reel gets featured         | 250   |
| Someone cooks your reel (Try This → made it) | 25 |
| Daily first-reel-of-the-day     | 20    |

**Redeemable for:** premium recipe unlocks, grocery-partner discount codes, and Nova
merch. Coins are soft currency — generous to earn, never purchasable with cash (keeps
it a *creativity* reward, not a pay-to-win balance).

---

## The First-100 ladder

Every one of the first 100 people to publish a qualifying reel gets a **permanent
`Founding Creator` badge** and a **2× coin multiplier for life**. That's the anchor —
it can never be earned again after #100, which is the whole point.

On top of that, tiered rewards by upload order:

| Uploaders     | Reward on top of Founding Creator status                                  |
|---------------|---------------------------------------------------------------------------|
| **#1–#10**    | $50 grocery gift card · 1 year Premium · name on the "Day One" wall · first-run Nova merch box (tee + sticker) |
| **#11–#30**   | $25 grocery gift card · 6 months Premium · Nova sticker pack               |
| **#31–#60**   | $15 grocery gift card · 3 months Premium                                   |
| **#61–#100**  | 1 month Premium · 500 bonus Nova Coins                                     |

**Qualifying reel** = passes the [Style Guide](../design/REEL_STYLE_GUIDE.md) ship gate (real
7s arc, real dish, resolves to a real recipe). One qualifying reel per person counts
toward their tier — no farming ten throwaway reels to climb.

---

## Milestone moments (the Nova relationship)

Rewards land with a Nova line, because the *feeling* is the retention mechanic, not the
gift card. These fire regardless of first-100 status, so the loop keeps working after launch.

- **First upload:** *"You just became a Nova Creator. That's not cooking anymore — that's art. I'm so proud."* → 100 coins + Founding Creator badge (if within first 100).
- **3rd upload:** *"Three reels in. You've got a *style* now. I can tell it's yours."* → unlock a custom handle color.
- **10th upload:** *"Officially a Certified Kitchen Influencer. Here's a free month of Premium."* → 1 month Premium + Kitchen Influencer badge.
- **First feature:** *"You're on the homepage. You're literally famous now. Screenshot this."* → 250 coins + shareable "Featured" card.

---

## Launch sequence (14 days)

**Days -3 to 0 — seed the feed.**
Ship the built-in reels (the 8 in `reels.data.js`) as Nova's own "how it's done" set so
the feed is never empty. Hand-pick ~15 beta cooks (friends, food-community DMs) to have
reels ready to publish the minute uploads open. Goal: feed looks alive at minute one.

**Day 0 — open uploads.**
Announce the Founding Creator cap loudly: *"First 100 cooks get a badge that literally
cannot be earned again."* Scarcity is the engine — show a live "**37 / 100 Founding
Creator spots left**" counter in the app and on socials.

**Days 1–7 — the sprint.**
Daily Nova "reel of the day" pick (250 coins + feature). Post the day's best reel to
Dig In's own TikTok/IG with the creator's handle — free clout for them, free reach for us.
This is when most of the 100 should fill.

**Days 8–14 — close it out.**
As spots dwindle, the counter does the work. Final-spot push: *"Last 12 Founding Creator
spots. After this, it's just… a badge you'll never have."* Announce the full Day One wall
when #100 lands.

---

## Guardrails (so it isn't gamed)

- **One Founding Creator slot per verified account.** Order locked by first *qualifying*
  reel's publish timestamp — server-side, not client clock.
- **Human review before a gift-card tier pays out.** Cheap at 100 uploads; catches
  stock-footage and joke submissions.
- **Coins are non-transferable and non-purchasable.** No secondary market, no whales.
- **Gift cards are grocery-partner codes**, not cash — keeps spend on-mission and
  strengthens the retail partnerships the app already leans on.

---

## Budget (worst case, all 100 fill)

| Tier        | People | Gift cards        | Premium value*    |
|-------------|--------|-------------------|-------------------|
| #1–#10      | 10     | $500              | ~$120 (1 yr ea)   |
| #11–#30     | 20     | $500              | ~$120             |
| #31–#60     | 30     | $450              | ~$90              |
| #61–#100    | 40     | $0 (coins only)   | ~$40              |
| **Total**   | 100    | **$1,450**        | **~$370** + merch |

\* Premium value is marginal cost, not sticker price — near-zero if Premium is mostly
software. **All-in cold-start cost is on the order of $2–3k** including merch and
shipping — cheap for a launched, self-sustaining content feed and 100 evangelists.

---

## What "done" looks like

- 100 Founding Creator badges issued; the wall is public.
- The feed gets new qualifying reels **without** us paying a per-upload bounty.
- At that point: retire the first-100 program, keep the everyday Nova Coin table, and let
  the Featured Chef monthly contest (separate doc) carry it forward.
