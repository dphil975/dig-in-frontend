# prototypes/

Draft components that aren't wired into the app yet. Nothing imports them, so
none of them ship in the bundle.

| File | What it is |
|---|---|
| `NovaHearth.jsx` | Nova's ambient hum: Web Audio tone mapped to emotional state |
| `SacredAnchor.jsx` | Sun/moon/breath "decree" card |
| `SomaticPortal.jsx` | Shadow-profile → music + recipe suggestion card |
| `KitchenWisdom.jsx` | Static wellness-tips card |
| `HolidayFrequency.jsx` | Holiday "frequency" calculator (was `holiday_frequncy.jsx` at the repo root) |
| `StepQuestCard.jsx` | Steps-vs-calories quest card for a recipe (was in `public/`, which deployed it as a raw file) |

To ship one, move it into the right `components/` group (see
`src/ARCHITECTURE.md`) and import it from a page.
