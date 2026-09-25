# Dig In: frontend

*come eat with people.*

Dig In is the hub for the part of adulthood nobody taught you: what to eat,
where to shop, how to host, and how not to get overcharged for it. This repo is
the web app (React + Vite, pixel-art UI), which also ships as an installable
PWA.

## Run it locally

Requires Node 20.6+ (tested on 22).

```bash
npm install
cp .env.example .env     # fill in what you need; see the comments inside
npm run dev              # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run dev:ai` | Local API server (`api-server.js`) with `.env` loaded, for the AI recipe helper |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `./start.sh` | Start the backends from `~/Dig In-backend` (Node :5000, Python :5001) plus the frontend |

In dev, `vite.config.js` proxies `/api/*`, `/food/*` and `/badges/*` to the
local backends, so no base-URL variables are needed. The app still runs
without them; backend-powered features just stay empty.

### Environment variables

All documented in [`.env.example`](.env.example). `VITE_*` values are compiled
into the browser bundle, so never put secrets in them.

| Variable | Used for |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Real sign-in. Without them, dev mode skips the auth gate. |
| `VITE_FLASK_BASE`, `VITE_API_BASE`, `VITE_PYTHON_BASE` | Deployed backend URLs (production only) |
| `OPENAI_API_KEY` | Server-side only: `api/recipe-ai.js` and `api-server.js` |

## Project layout

```
src/            the app; see src/ARCHITECTURE.md for the full map
  pages/        six routed realms: Home, Recess, Recipes, Explore, Community, You
  components/   eight groups: shell, nova, recipe, cook, health, pantry, social, you
  lib/          engines, storage, API clients
  data/         static content (recipes, stores, seed reels)
  prototypes/   unwired drafts (not bundled)
api/            Vercel serverless functions (recipe AI, FDA recalls)
data/           recipe and menu JSON, served at /data/ (public/data is a symlink here)
public/         static assets: store data by state, OCR models, icons
scripts/        build-recipes-full.py builds data/recipes_full.json
supabase/       database migrations
docs/           product, design, business, legal, marketing docs; see docs/README.md
_archive/       retired code and the old multi-page site; nothing here ships
```

## Deploying

Built for Vercel: `vercel.json` sends every non-asset route to `index.html`
(client-side routing) and runs `api/*.js` as serverless functions. Set the
environment variables above in the Vercel project settings.

## Content and IP

Content derived from published books, and features that reproduced named
brands' menu items, were removed in September 2026; see `src/ARCHITECTURE.md`.
Keep new data free of copyrighted book text, brand trade dress and
trademarked product names. Third-party attributions live in
`licenses/attributions.json`.

---

Private repository. `docs/` contains confidential business, legal and personal
material.
