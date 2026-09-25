# Dig In — Technical Summary of Core Systems
### Prepared for Patent Attorney Review · July 2026
### Inventor: Olive Phillips | daniellephllps5@gmail.com

---

## Application Overview

**Dig In** is a dual-sided food technology platform comprising:

1. A **consumer-facing mobile web application** — a gamified food discovery and cooking platform built with React (JavaScript), featuring a live map, gamification mechanics, global recipe database, and a pixel art food avatar creator.

2. A **B2B data intelligence layer** — a Python/Flask backend that passively collects anonymized, zip-code-level behavioral data from consumer interactions and packages it as market intelligence reports sold to grocery retailers and CPG (consumer packaged goods) brands.

The consumer product drives user acquisition and data generation. The data layer converts that activity into B2B revenue. These two sides compound into a data flywheel.

**Technology Stack:**
- Frontend: React 18, Vite, Leaflet.js (mapping), React Router
- Backend: Python 3 / Flask, Node.js / Express
- Data: 600+ recipes across 70+ countries, stored in structured JSON
- Deployment: Vercel (frontend), designed for cloud deployment (backend)

---

## The Five Core Systems

---

### System 1: Behavioral Data Collection & Monetization Pipeline

**What it does:**
When a consumer interacts with the application — checking into a grocery store, logging ingredients, cooking a recipe, or recording a substitution — the system captures anonymized behavioral data without storing any personally identifiable information (PII).

**Technical implementation:**
- User identifiers are SHA-256 hashed at the point of collection, producing a 16-character anonymous ID
- Each data point captures: anonymous ID, zip code, timestamp, store visited, ingredients purchased or searched, recipe cooked, substitutions made, and whether the user used a coupon or deal
- Data is aggregated into structured insights: trending ingredients by zip code, peak shopping hours by neighborhood, store market share by zip code, substitution patterns, and price sensitivity scores
- Aggregated reports are generated via the `DataMonetization` module and sold to grocery retailers and CPG brands

**The novel combination:**
The specific method of using a gamified consumer app to passively fund and generate a B2B retail intelligence product — where the same consumer interaction simultaneously produces engagement for the user and monetizable behavioral data for retail clients — represents the core inventive concept.

**Potential claim area:** Method and system for generating retail behavioral intelligence from gamified consumer food application interactions, wherein user engagement events are anonymized at collection and aggregated into zip-code-level market reports sold to retail clients.

---

### System 2: Craving-to-Ingredients-to-Store Pipeline

**What it does:**
A user describes a food craving in natural language (e.g., "something spicy and warm for dinner"). The system decodes the craving using a layered flavor and seasoning model, matches it against the recipe database, and then surfaces nearby grocery stores ranked by price competitiveness, distance, and the user's historical preference profile — all for the specific ingredients required by the matched recipe.

**Technical implementation:**
- The `SeasoningPairingEngine` and `CravingCompass` service decode natural language input into flavor layer categories (base, acid, fat, heat, umami, sweet, aromatic)
- Decoded flavor profile is matched to recipes in the database using ingredient and cuisine-type overlap scoring
- The `GroceryLocator` module (Python/Flask) finds stores within a configurable radius using geolocation
- Stores are ranked using a dynamic pricing algorithm that factors price per ingredient, distance, and historical user preference signals
- Output: a ranked list of stores with per-ingredient price breakdowns for the matched recipe

**Potential claim area:** Method for translating a natural language food craving input into a ranked list of nearby retail locations with ingredient-level pricing, using an intermediate flavor-layer decoding model.

---

### System 3: Gamification Loop Tied to Real-World Retail Behavior

**What it does:**
A coin-based reward system where users earn virtual currency through verifiable real-world actions (checking into physical grocery stores, cooking recipes, completing daily quests, maintaining streaks). Coins are spent on cosmetic unlocks for a pixel art food avatar. This creates a daily habit loop directly tied to physical grocery store visits.

**Technical implementation:**
- Check-in service (`checkinService.js`) validates check-ins against a database of known store locations using geolocation matching
- Coins are awarded per check-in (base amount), with multipliers for streak continuity, borough exploration bonuses, and first-visit bonuses
- A streak protection mechanic allows users to preserve streaks by completing photo missions
- Daily quests reset at midnight and generate fresh retention hooks (e.g., "Visit 1 store in a new borough today")
- Coins unlock cosmetic items in the Pixel Creator (avatar outfits priced 50–300 coins)

**Potential claim area:** System for incentivizing physical retail location visits through a virtual currency reward mechanism integrated with a food discovery and recipe application, wherein earned currency is redeemable for digital avatar customization items.

---

### System 4: Ingredient Substitution Engine

**What it does:**
When a user is missing a required ingredient for a recipe, the system analyzes their available ingredients and suggests the best substitute, including specific ratios, preparation modifications, and waiting periods where applicable.

**Technical implementation:**
- `SubstitutionEngine` (Python class) maintains a structured rule base of 300+ ingredient substitution mappings organized by category (dairy, eggs, flour, sweeteners, fats, leavening agents, etc.)
- Each substitution entry contains: substitute options, ratio adjustments, preparation notes, flavor impact warnings, and use-case restrictions (e.g., "works in baked goods only")
- The engine scores substitutes based on what the user has available and returns ranked options
- Available for both manual input and integration with the pantry scanning flow

**Potential claim area:** Computerized ingredient substitution recommendation system that provides ratio-adjusted, preparation-modified alternatives based on the user's available ingredient inventory, organized by culinary use-case category.

---

### System 5: Pixel Art Food Avatar Creator with Economy Integration

**What it does:**
Users create a pixel art food character (an 8x8 sprite) using a grid-based drawing tool with multiple color palettes. The character can be dressed in cosmetic outfits (chef hat, apron, royal cape, etc.) purchased with coins earned through real-world retail check-ins. The resulting artwork can be exported and shared.

**Technical implementation:**
- Canvas-based pixel grid editor with brush, fill, and erase tools
- 7 color palettes (Classic, Vintage, Neon, Pastel, Monochrome, Retro Gaming, Cooking Mama-inspired)
- Outfit system with 8 cosmetic items priced 50–300 coins
- Coin balance is read from the gamification system (System 3) — the two systems share a state layer
- Export function generates a PNG of the created sprite
- Native share API (`navigator.share()`) enables direct sharing to social platforms

**Potential claim area (design + utility):** The specific visual aesthetic and the integration between a pixel art food avatar creator and a real-world retail check-in reward economy within a food discovery application.

---

## Prior Art Awareness

The following existing products have overlapping features (not identical):

| Competitor | Overlap | Key Difference |
|-----------|---------|----------------|
| Foursquare / Swarm | Location check-ins, gamification | No food-specific data collection, no B2B retail intelligence layer |
| Yummly | Recipe database, personalization | No check-in mechanic, no B2B data monetization, no avatar creator |
| Numerator | Retail behavioral data | Passive receipt scanning, no consumer engagement layer or gamification |
| Instacart | Grocery discovery, shopping | No gamification, no anonymized data B2B product, no pixel art |
| Whatnot | Gamified commerce | Not food-specific, no retail data product |

The specific **combination** of a gamified consumer food app that passively generates retail behavioral intelligence sold as a B2B product — with no precedent for this exact dual-sided architecture — is the primary basis for novelty claims.

---

## Questions for This Meeting

1. Which of the five systems above has the strongest basis for a utility patent claim?
2. Should we file a provisional patent application today or immediately following this meeting to lock in a priority date?
3. For systems where patent protection is weak, is trade secret protection more appropriate?
4. Does the use of AI coding tools (Claude by Anthropic) affect inventorship or copyright ownership of the codebase?
5. What IP assignment agreements do I need before bringing on co-founders or investors?
6. Is "Dig In" available as a trademark in Class 42 (software) and Class 43 (food services)?

---

*Inventor: Olive Phillips | Date of Meeting: July 2026 | Confidential — Attorney-Client Privilege*
