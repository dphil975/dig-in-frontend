# Dig In docs

Every planning, business, legal and content doc for Dig In, sorted by what it's
for. Code documentation stays next to the code: `src/ARCHITECTURE.md` (how
`src/` is laid out), `src/prototypes/README.md`, and
`data/RECIPE_IMPORT_GUIDE.md`.

## product/: what the app is and how it works
| Doc | Date | What it covers |
|---|---|---|
| [PRD.md](product/PRD.md) | Jul 11 2026 | Product requirements. Marked confidential. |
| [DIG_IN_THESIS.md](product/DIG_IN_THESIS.md) | Jul 28 2026 | The core idea: cooking as the alternative to filling silence with a phone |
| [DIG_IN_WORLD.md](product/DIG_IN_WORLD.md) | Aug 2026 | The 2000s-internet / avatar-world pivot, staged |
| [DIG_IN_ALGORITHM.md](product/DIG_IN_ALGORITHM.md) | Jul 28 2026 | Feed ranking, tags and context. Cited throughout `src/lib`. |
| [PRODUCT_METRICS_FRAMEWORK.md](product/PRODUCT_METRICS_FRAMEWORK.md) | Jul 2026 | Every metric a PM must define, and which can't be measured yet |
| [APP_READINESS_PLAN.md](product/APP_READINESS_PLAN.md) | Jun 2026 | Audit plus prioritized next steps (earliest plan) |

## design/: UX/UI audits, redesigns and standards
| Doc | Date | What it covers |
|---|---|---|
| [REEL_STYLE_GUIDE.md](design/REEL_STYLE_GUIDE.md) | living | The 7-second reel standard. Kept current with the code. |
| [DIG_IN_WEB_TO_APP_ALIGNMENT.md](design/DIG_IN_WEB_TO_APP_ALIGNMENT.md) | Jul 28 2026 | What to redo on web so it ships as an app. Supersedes the cut list in the iOS face lift. |
| [DIG_IN_iOS_FACELIFT.md](design/DIG_IN_iOS_FACELIFT.md) | Jul 28 2026 | Whole-app mobile UX review |
| [DIG_IN_HERO_REDESIGN.md](design/DIG_IN_HERO_REDESIGN.md) | Jul 28 2026 | Home page rebuilt on Tumblr's logic |
| [DIG_IN_RECIPE_REDO.md](design/DIG_IN_RECIPE_REDO.md) | Jul 28 2026 | Recipe/cook flow rebuilt for iOS |
| [UX_METRICS_PLAN.md](design/UX_METRICS_PLAN.md) | Jun 2026 | What to change, hide and fix for first-use clarity |

The dated audits describe the code as it was on their date. File paths in them
(e.g. `pages/RecipeFull`) predate the September 2026 reorganization. For
current locations, see `src/ARCHITECTURE.md`.

## business/: money, market and fundraising
| Doc | Date | What it covers |
|---|---|---|
| [FINANCIAL_MODEL.md](business/FINANCIAL_MODEL.md) | Jul 2026 | Pricing, revenue streams, passive income |
| [MARKET_STRATEGY.md](business/MARKET_STRATEGY.md) | Jul 2026 | Customer profiles and the growth plan |
| [DIG_IN_FUNDING_PLAN.md](business/DIG_IN_FUNDING_PLAN.md) | Jun 2026 | VC fundraising strategy |
| [INVESTOR_METRICS_AND_FUNDRAISING.md](business/INVESTOR_METRICS_AND_FUNDRAISING.md) | Jul 2026 | The numbers investors ask for; NYC playbook |
| [VC_DUE_DILIGENCE_GAPS.md](business/VC_DUE_DILIGENCE_GAPS.md) | Jul 2026 | Hard diligence questions and where each stands |
| [dig-in-brand-money-playbook.md](business/dig-in-brand-money-playbook.md) | | Brands, affiliates and sponsors pre-launch |
| [the-ecosystem-and-money-plan.md](business/the-ecosystem-and-money-plan.md) | | Podcast, magazine and app, and where the money comes from |

## legal/: IP and attorney materials
| Doc | Date | What it covers |
|---|---|---|
| [PATENT_ATTORNEY_PREP.md](legal/PATENT_ATTORNEY_PREP.md) | Jun 2026 | Prep for a first IP-attorney meeting |
| [UX_UI_PATENT_REVIEW.md](legal/UX_UI_PATENT_REVIEW.md) | Jul 2026 | Screen-by-screen walkthrough; images in `legal/patent-review-screenshots/` |
| [DIG_IN_UX_IP_REVIEW.html](legal/DIG_IN_UX_IP_REVIEW.html) | | UX + IP strategy review (open in a browser) |
| [ATTORNEY_DOCS/](legal/ATTORNEY_DOCS/) | | The attorney packet: cheat sheet, technical summary, competitors, codebase summary, entity structure, creation timeline, pitch decks |

These are records, so they haven't been edited. **Out of date:** the Copycat
Lab and Copycat Drinks / Drink Scan features were removed from the app in
September 2026 (IP risk). Slide 7 of `ATTORNEY_DOCS/DIG_IN_VC_IP_PITCH.pptx`
still presents them, including "Starbucks drinks decoded". Update that slide
before the deck goes out again. The Markdown docs and the other three decks
don't mention them.

## marketing/: brand, launch and PR
| Doc | What it covers |
|---|---|
| [dig-in-brand-direction.md](marketing/dig-in-brand-direction.md) | Palette, voice and product direction |
| [dig-in-launch-content.md](marketing/dig-in-launch-content.md) | Pre-launch content pack and positioning lines |
| [dig-in-substack-and-pr.md](marketing/dig-in-substack-and-pr.md) | Substack series and PR plan |
| [REEL_FIRST_100_INCENTIVE_PLAN.md](marketing/REEL_FIRST_100_INCENTIVE_PLAN.md) | Paying the first 100 reel creators |

## media/: shows, podcast and essays
| Doc | What it covers |
|---|---|
| [how-she-does-it-show-bible.md](media/how-she-does-it-show-bible.md) | Show bible: *How She Does It* |
| [set-another-place-show-bible.md](media/set-another-place-show-bible.md) | Show bible: *Set Another Place* |
| [podcast-women-and-legacy-concept.md](media/podcast-women-and-legacy-concept.md) | Women's show concept and protection plan |
| [europe-plan.md](media/europe-plan.md) | Filming abroad without stalling the app |
| [essay-the-blow-pops-are-smaller-now.md](media/essay-the-blow-pops-are-smaller-now.md) | Essay |
| [blow-pops-notes-and-reels.md](media/blow-pops-notes-and-reels.md) | Substack notes and reels for that essay |
| [essay-kronos-ate-his-kids.md](media/essay-kronos-ate-his-kids.md) | Essay |

## personal/
| Doc | What it covers |
|---|---|
| [MERCOR_INTERVIEW_PREP.md](personal/MERCOR_INTERVIEW_PREP.md) | Interview prep (not Dig In) |

**Before this repo ever gets a remote:** `personal/`, `legal/`, `business/` and
`product/PRD.md` are private material. Keep them out of any public repo.
