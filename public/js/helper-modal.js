/**
 * Dig In — Smart Helper Modal
 * Attaches to each step card in the cooking carousel.
 * Works fully offline with a local advice database, and upgrades
 * to AI-assisted advice when the backend is reachable.
 *
 * Cooking is a science AND an art — this system explains both.
 */

/* ── Inject pixel-art styles once ───────────────────────────────── */
(function injectHelperStyles() {
  if (document.getElementById('dig-helper-styles')) return;
  const s = document.createElement('style');
  s.id = 'dig-helper-styles';
  s.textContent = `
    .dig-helper-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,.88);
      display: flex; align-items: center; justify-content: center;
      padding: 16px; animation: helperFadeIn .15s ease;
    }
    @keyframes helperFadeIn { from { opacity:0; } to { opacity:1; } }

    .dig-helper-modal {
      background: #141414;
      border: 4px solid #f4a924;
      border-radius: 12px;
      box-shadow: 6px 6px 0 #7a4a00;
      max-width: 520px; width: 100%;
      max-height: 90vh; overflow-y: auto;
      font-family: 'DotGothic16', monospace;
      color: #eee;
    }

    .dig-helper-header {
      background: #f4a924;
      padding: 14px 18px;
      display: flex; align-items: center; justify-content: space-between;
      border-radius: 8px 8px 0 0;
      gap: 10px;
    }
    .dig-helper-header h3 {
      font-family: 'Press Start 2P', monospace;
      font-size: 9px; color: #1a1a1a;
      margin: 0 0 3px; letter-spacing: .5px;
    }
    .dig-helper-subhead {
      font-family: 'Press Start 2P', monospace;
      font-size: 6px; color: #5a3a00; letter-spacing: .3px;
    }
    .dig-helper-close {
      background: #1a1a1a; color: #f4a924;
      border: 2px solid #1a1a1a; border-radius: 4px;
      font-family: 'Press Start 2P', monospace;
      font-size: 8px; padding: 4px 8px; cursor: pointer;
      flex-shrink: 0; align-self: flex-start;
    }
    .dig-helper-close:hover { background: #333; }

    /* ── Recipe flow context strip ── */
    .dig-helper-flow {
      display: grid; grid-template-columns: 1fr auto 1fr;
      gap: 4px; margin: 12px 18px 0;
      background: #1a1a1a; border: 1px solid #333;
      border-radius: 8px; padding: 10px 8px;
    }
    .dig-helper-flow-item, .dig-helper-flow-now {
      display: flex; flex-direction: column; gap: 3px;
      padding: 4px 6px;
    }
    .dig-helper-flow-now {
      border-left: 2px solid #444; border-right: 2px solid #444;
    }
    .dig-helper-flow-empty { opacity: 0; pointer-events: none; }
    .dig-helper-flow-label {
      font-family: 'Press Start 2P', monospace;
      font-size: 5px; color: #666; letter-spacing: .5px;
    }
    .dig-helper-flow-text { font-size: 10px; color: #aaa; line-height: 1.5; }

    /* ── Consequence / order-dependency warning ── */
    .dig-helper-consequence {
      margin: 12px 18px 0;
      background: #2a1a1a;
      border: 2px solid #e06060;
      border-radius: 8px; padding: 10px 12px;
    }
    .dig-helper-consequence-head {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px; color: #e06060; margin-bottom: 6px;
    }
    .dig-helper-consequence-item {
      font-size: 12px; color: #e0a0a0; line-height: 1.7;
    }

    /* ── Adapted tips (learned from usage patterns) ── */
    .dig-helper-adapted {
      margin: 12px 18px 0;
      background: #1a1800;
      border: 2px solid #c8a000;
      border-radius: 8px; padding: 10px 12px;
    }
    .dig-helper-adapted-head {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px; color: #c8a000; margin-bottom: 8px;
    }
    .dig-helper-adapted-list {
      list-style: none; padding: 0; margin: 0;
    }
    .dig-helper-adapted-list li {
      font-size: 12px; color: #d4c060; line-height: 1.7;
      padding: 3px 0; border-bottom: 1px solid #332a00;
    }
    .dig-helper-adapted-list li:last-child { border-bottom: none; }
    .dig-helper-adapted-list li::before { content: '▸ '; color: #c8a000; }

    /* ── Collapsible science overview ── */
    .dig-helper-science-art-details {
      margin: 12px 18px 0;
      background: #1a1420; border: 2px solid #c9a0f0;
      border-radius: 8px;
    }
    .dig-helper-sa-summary {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px; color: #c9a0f0;
      padding: 10px 12px; cursor: pointer; list-style: none;
    }
    .dig-helper-sa-summary::-webkit-details-marker { display: none; }
    .dig-helper-science-art-details[open] .dig-helper-sa-summary {
      border-bottom: 1px solid #5a3a80;
    }
    .dig-helper-science-art-details .dig-helper-sa-list {
      padding: 0 12px 10px; margin: 0;
    }

    .dig-helper-step-ctx {
      background: #1e1e1e;
      border-left: 4px solid #f4a924;
      margin: 16px 18px 0;
      padding: 10px 12px;
      border-radius: 0 6px 6px 0;
      font-size: 13px; line-height: 1.6; color: #ccc;
    }
    .dig-helper-step-ctx strong {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px; color: #f4a924; display: block; margin-bottom: 4px;
    }

    .dig-helper-science {
      margin: 14px 18px 0;
      background: #1a2a1a;
      border: 2px solid #7ae0b0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .dig-helper-science-head {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px; color: #7ae0b0; margin-bottom: 6px;
    }
    .dig-helper-science p { font-size: 12px; color: #aadabc; line-height: 1.7; margin: 0; }

    .dig-helper-body { padding: 16px 18px; }

    .dig-helper-label {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px; color: #888; margin-bottom: 6px; display: block;
    }

    .dig-helper-textarea {
      width: 100%; background: #222; color: #eee;
      border: 2px solid #444; border-radius: 6px;
      padding: 10px; font-family: 'DotGothic16', monospace; font-size: 13px;
      resize: vertical; min-height: 80px; box-sizing: border-box;
    }
    .dig-helper-textarea:focus { outline: none; border-color: #f4a924; }

    .dig-helper-photo-zone {
      margin-top: 14px;
      border: 2px dashed #444; border-radius: 8px;
      padding: 12px; text-align: center; cursor: pointer;
      transition: border-color .15s;
    }
    .dig-helper-photo-zone:hover { border-color: #f4a924; }
    .dig-helper-photo-zone input { display: none; }
    .dig-helper-photo-label {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px; color: #666;
    }
    .dig-helper-photo-preview {
      margin-top: 10px;
    }
    .dig-helper-photo-preview img {
      max-width: 180px; max-height: 140px;
      border: 3px solid #f4a924; border-radius: 6px;
    }

    .dig-helper-env {
      margin-top: 14px;
      background: #1a1a2a;
      border: 2px solid #60c8f4;
      border-radius: 8px; padding: 12px;
    }
    .dig-helper-env-head {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px; color: #60c8f4; margin-bottom: 10px;
    }
    .dig-helper-env-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    }
    .dig-helper-select, .dig-helper-input {
      background: #222; color: #eee;
      border: 2px solid #444; border-radius: 6px;
      padding: 7px 10px; font-family: 'DotGothic16', monospace; font-size: 12px;
      width: 100%; box-sizing: border-box;
    }
    .dig-helper-select:focus, .dig-helper-input:focus {
      outline: none; border-color: #60c8f4;
    }
    .dig-helper-env-note {
      margin-top: 8px; font-size: 11px; color: #607090; line-height: 1.6;
    }

    .dig-helper-submit {
      width: 100%; margin-top: 16px;
      background: #f4a924; color: #1a1a1a;
      font-family: 'Press Start 2P', monospace; font-size: 8px;
      border: 3px solid #1a1a1a; border-radius: 8px;
      padding: 14px; cursor: pointer;
      box-shadow: 3px 3px 0 #1a1a1a;
      transition: transform .08s, box-shadow .08s;
    }
    .dig-helper-submit:hover { transform: translate(1px,1px); box-shadow: 2px 2px 0 #1a1a1a; }
    .dig-helper-submit:disabled { background: #555; color: #888; cursor: default; box-shadow: none; transform: none; }

    .dig-helper-response {
      margin-top: 16px;
      border-top: 2px solid #333;
      padding-top: 14px;
    }
    .dig-helper-severity-high   { border-left: 4px solid #e04040; padding-left: 12px; }
    .dig-helper-severity-medium { border-left: 4px solid #f4a924; padding-left: 12px; }
    .dig-helper-severity-low    { border-left: 4px solid #7ae0b0; padding-left: 12px; }

    .dig-helper-answer-head {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px; color: #f4a924; margin: 10px 0 5px;
    }
    .dig-helper-answer-text { font-size: 13px; color: #ddd; line-height: 1.7; margin: 0; }

    .dig-helper-restart-warn {
      margin-top: 12px;
      background: #2a1a1a; border: 2px solid #e04040;
      border-radius: 6px; padding: 10px 12px;
      font-family: 'Press Start 2P', monospace; font-size: 7px; color: #e04040;
      letter-spacing: .3px; line-height: 1.8;
    }

    .dig-helper-env-advice {
      margin-top: 10px;
      background: #1a1a2a; border: 1px solid #60c8f4;
      border-radius: 6px; padding: 10px 12px;
      font-size: 12px; color: #90c0d8; line-height: 1.7;
    }

    .dig-helper-feedback { margin-top: 14px; display: flex; gap: 10px; }
    .dig-helper-fb-btn {
      font-family: 'Press Start 2P', monospace; font-size: 7px;
      border: 2px solid; border-radius: 6px;
      padding: 8px 12px; cursor: pointer;
    }
    .dig-helper-fb-yes { background: #1a2a1a; color: #7ae0b0; border-color: #7ae0b0; }
    .dig-helper-fb-no  { background: #2a1a1a; color: #e07070; border-color: #e07070; }

    .dig-helper-science-art {
      margin: 12px 18px 0;
      background: #1a1420;
      border: 2px solid #c9a0f0;
      border-radius: 8px; padding: 10px 12px;
    }
    .dig-helper-sa-head {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px; color: #c9a0f0; margin-bottom: 6px;
    }
    .dig-helper-sa-list {
      list-style: none; padding: 0; margin: 0;
    }
    .dig-helper-sa-list li {
      font-size: 11px; color: #c0a8e0; line-height: 1.7; padding: 2px 0;
    }
    .dig-helper-sa-list li::before { content: '▸ '; color: #c9a0f0; }
  `;
  document.head.appendChild(s);
})();

/* ── Local offline advice database ─────────────────────────────── */
const HELP_ADVICE = {
  /* ── Baking / cookies ───────────────────── */
  too_sticky: {
    keywords: ['sticky','stick','won\'t come off','hard to drop','dough sticks'],
    issue: 'Dough is too sticky to handle',
    fix: 'Chill the dough in the fridge for 20–30 minutes. Sticky dough is usually caused by warm butter or too much moisture. Do not add more flour — this will make the cookies tough.',
    severity: 'low', restart: false,
    science: 'Butter above 68°F softens the gluten network and makes dough tacky. Cold temperature firms the fat and makes dough workable again.'
  },
  spreading: {
    keywords: ['spread','flat','too flat','spreading too much','thin','melted'],
    issue: 'Cookies spreading too much',
    fix: 'Chill dough 30 min, use a cool/room-temp baking sheet, and make sure your butter was not melted. If using convection, reduce temperature by 25°F.',
    severity: 'medium', restart: false,
    science: 'Spreading is caused by: butter too warm (fat melts before structure sets), hot baking sheet (pre-heating starts spread immediately), or too little flour.'
  },
  burnt_bottom: {
    keywords: ['burnt bottom','dark bottom','black bottom','burned under','burning under'],
    issue: 'Cookies burning on the bottom',
    fix: 'Double-stack your baking sheets, move to a higher oven rack, or reduce temperature by 25°F. Dark pans absorb more heat — switch to light aluminum if possible.',
    severity: 'medium', restart: false,
    science: 'Dark baking surfaces absorb radiant heat faster, creating a temperature differential between the bottom and top of your cookie. Light, thick-gauge pans distribute heat more evenly.'
  },
  raw_middle: {
    keywords: ['raw','underbaked','raw middle','gooey center','not cooked','soft middle'],
    issue: 'Cookies raw or underbaked in the center',
    fix: 'Add 3–5 more minutes and test by touching the surface lightly. If it springs back slightly, it\'s done — cookies continue cooking on the hot pan after removal.',
    severity: 'low', restart: false,
    science: 'The "touch test": a properly baked cookie will spring back when lightly pressed. An underbaked cookie will sink and feel wet. Remember: cookies firm up as they cool.'
  },
  too_hard: {
    keywords: ['too hard','hard','crispy','dry','crunchy','not chewy'],
    issue: 'Cookies turned out too hard or crispy',
    fix: 'Overbaked or too much flour. To soften: store with a slice of bread in an airtight container overnight. For next batch: reduce bake time by 2–3 min, add 1 tbsp more brown sugar for chew.',
    severity: 'low', restart: false,
    science: 'Brown sugar is hygroscopic (absorbs moisture from air), keeping cookies soft longer. White sugar makes cookies crisper and more prone to spreading.'
  },
  /* ── Dough issues ───────────────────────── */
  dough_crumbly: {
    keywords: ['crumbles','falling apart','crumbly','won\'t hold','dry dough'],
    issue: 'Dough is crumbly and won\'t hold together',
    fix: 'Add 1–2 tsp of cold water or milk, one at a time, mixing gently between additions. Too much flour or not enough fat is usually the cause.',
    severity: 'low', restart: false,
    science: 'Gluten forms when water and flour proteins interact under pressure. Without enough moisture, there\'s insufficient gluten development to bind the dough.'
  },
  /* ── Meat / protein ─────────────────────── */
  not_browning: {
    keywords: ['not browning','not searing','steaming','won\'t brown','grey','gray'],
    issue: 'Meat is steaming instead of browning',
    fix: 'Pat meat completely dry with paper towels before adding to pan. Make sure the pan is fully preheated (a drop of water should evaporate immediately). Don\'t crowd the pan.',
    severity: 'medium', restart: false,
    science: 'The Maillard reaction (browning) requires surface temperature above 280°F. Surface moisture turns to steam and drops the pan temperature, preventing browning. This is why "pat dry" is critical.'
  },
  tough_meat: {
    keywords: ['tough','chewy meat','rubbery','hard to chew','not tender'],
    issue: 'Meat came out tough',
    fix: 'If mid-cook: lower heat immediately and add liquid to braise slowly. If already done: slice thinly against the grain, rest 5+ minutes before cutting.',
    severity: 'medium', restart: false,
    science: 'Muscle fibers toughen when cooked over 145°F too quickly. Collagen (connective tissue) requires long, low heat to convert to gelatin. Always cut against the grain to shorten the fibers.'
  },
  /* ── Eggs / custards ───────────────────── */
  scrambled_eggs: {
    keywords: ['scrambled','curdled','broken sauce','broken hollandaise','lumpy custard'],
    issue: 'Eggs curdled or sauce broke',
    fix: 'Remove from heat immediately. For scrambled eggs: add a splash of cold cream and stir vigorously. For broken sauce: whisk in ice water 1 tsp at a time off heat.',
    severity: 'high', restart: false,
    science: 'Egg proteins denature (unwind) at ~160°F and scramble above 185°F. Once scrambled, they cannot be reversed. Prevention: always use low, gentle heat for egg-based sauces.'
  },
  /* ── Pasta / rice ───────────────────────── */
  pasta_sticky: {
    keywords: ['pasta sticky','clumped','pasta clumping','noodles stick'],
    issue: 'Pasta is sticking together',
    fix: 'Toss immediately with sauce when drained. If sticking, add a ladle of pasta water to loosen — never oil before saucing, as oil coats noodles and prevents sauce from adhering.',
    severity: 'low', restart: false,
    science: 'Starch on the pasta surface is what allows sauce to cling. Adding oil before saucing coats this starch layer and creates a non-stick barrier.'
  },
  rice_mushy: {
    keywords: ['mushy rice','sticky rice','rice too soft','gummy rice'],
    issue: 'Rice came out mushy or gummy',
    fix: 'Spread rice on a baking sheet and let steam escape for 5 minutes. For next batch: rinse rice until water runs clear, reduce water by 2 tbsp, never lift lid while steaming.',
    severity: 'medium', restart: false,
    science: 'Excess starch on rice grains absorbs extra water during cooking, creating gummy texture. Rinsing removes surface starch and results in distinct, separate grains.'
  },
  /* ── Sauce / liquid ─────────────────────── */
  sauce_too_thin: {
    keywords: ['too thin','watery','won\'t thicken','soupy','runny'],
    issue: 'Sauce or mixture is too thin/watery',
    fix: 'Simmer uncovered over medium heat to reduce. Or make a cornstarch slurry: 1 tbsp cornstarch mixed with 2 tbsp cold water, stir in and simmer 2 minutes.',
    severity: 'low', restart: false,
    science: 'Reduction concentrates flavors and allows water to evaporate, thickening the sauce. Starch thickeners work through gelatinization — starch granules absorb water and swell when heated.'
  },
  sauce_too_salty: {
    keywords: ['too salty','over-salted','too much salt','way too salty'],
    issue: 'Dish is too salty',
    fix: 'Add acid (lemon juice or vinegar), a starchy element (potato, bread, rice), or dilute with unsalted stock. Do not add water — it thins without balancing.',
    severity: 'medium', restart: false,
    science: 'Acid perception competes with salt on your taste receptors, reducing the perceived saltiness. Starch molecules can bind some sodium ions, physically reducing saltiness.'
  },
};

/* ── Cooking science context by keyword ─────────────────────────── */
const STEP_SCIENCE = [
  {
    triggers: ['preheat','oven','temperature','degrees','°f','°c'],
    name: 'Oven Temperature Science',
    text: 'Most home ovens run 25–50°F off. An oven thermometer ($8–12) is one of the best investments a home cook can make. Convection ovens run 25°F hotter than conventional — always reduce temperature when using convection mode.',
  },
  {
    triggers: ['butter','cream','room temperature','softened','melted'],
    name: 'Fat Temperature Matters',
    text: 'Room temperature butter (65–68°F) traps air when beaten, creating lift. Cold butter won\'t cream; melted butter won\'t hold air. If your butter is too soft: refrigerate 10 minutes before using.',
  },
  {
    triggers: ['flour','mix','blend','overmix','stir'],
    name: 'Gluten Development',
    text: '"Do not overmix" exists for a reason: every stir after adding flour builds gluten. More gluten = tougher texture. For cookies and cakes, stop mixing the moment you see no dry flour. For bread, MORE mixing builds the structure you want.',
  },
  {
    triggers: ['egg','eggs','yolk','white'],
    name: 'Egg Proteins',
    text: 'Eggs are a binding agent, leavener, and emulsifier. Whole eggs add richness; whites add structure; yolks add richness and emulsification. Room temperature eggs blend more smoothly into batters.',
  },
  {
    triggers: ['chill','refrigerate','rest','cold','freeze'],
    name: 'Why Chilling Matters',
    text: 'Chilling dough relaxes gluten (less tough), firms fat (less spreading), and develops flavor through enzyme activity. A rested cookie dough bakes up taller and chewier than one baked immediately.',
  },
  {
    triggers: ['brown','maillard','sear','carameliz'],
    name: 'Browning Reactions',
    text: 'Two different reactions create browning: Caramelization (sugar → color) starts at 320°F; Maillard Reaction (protein + sugar → complex flavor) starts at 280°F. Both require a dry surface — moisture prevents the temperature from getting high enough.',
  },
  {
    triggers: ['salt','season','seasoning'],
    name: 'Salt as a Science Tool',
    text: 'Salt doesn\'t just add flavor — it suppresses bitterness, enhances sweetness, and draws out moisture (osmosis). In bread and dough, salt controls gluten strength. Season in layers throughout cooking rather than only at the end.',
  },
  {
    triggers: ['boil','simmer','heat','medium','low','high'],
    name: 'Heat Control',
    text: 'Simmering (185–200°F) gently cooks without turbulence. Full boil (212°F) is needed for pasta, but can overcook delicate proteins. "Medium" on every stove is different — use visual cues (bubble size, steam) rather than relying on dial numbers.',
  },
];

/* ── Environmental adjustment database ─────────────────────────── */
const ENV_ADVICE = {
  convection: 'Convection ovens circulate hot air — reduce stated temperature by 25°F and check for doneness 5–10 minutes early. Cookies and cakes bake faster and more evenly.',
  toaster: 'Toaster ovens run hot and uneven, especially near the heating elements. Position food in the center, rotate halfway through, and check doneness 5 minutes early.',
  conventional: 'Standard conventional oven — rotate pans halfway through baking for even results, as most ovens have hot spots.',
  high_altitude: {
    '2500-5000': 'At this altitude: reduce baking powder/soda by ¼ tsp per tsp called for, add 1–2 tbsp extra flour, increase oven temp by 15–25°F.',
    '5000-7500': 'At this altitude: reduce baking powder/soda by ½ tsp per tsp, add 2–4 tbsp extra flour, increase oven temp by 25°F, add 2–4 tbsp extra liquid.',
    '7500+': 'High altitude requires significant adjustments: halve all leavening agents, add 4–6 tbsp extra flour per cup, increase liquid by ¼ cup, increase oven temp by 25°F, and reduce sugar by 1–3 tbsp.',
  },
  humid: 'High humidity means your flour has absorbed extra moisture from the air. You may need to add 1–2 extra tbsp flour for cookies and cakes. Candy and caramel work is affected most — avoid on very humid days.',
  dry: 'Very dry conditions: dough and batters can dry out faster. Cover loosely while resting. Bread doughs may need a splash more water.',
};

/* ── Phase-based knowledge — what typically goes wrong at each phase ─ */
const PHASE_PATTERNS = {
  dessert: {
    prep:   ['butter must be at room temperature (65–68°F) or dough will not cream properly',
             'measure flour by spooning into the cup, not scooping — scooping packs 20% more flour in'],
    mix:    ['stop mixing the moment no dry flour is visible — over-mixing builds gluten and makes cookies tough',
             'if dough feels too warm and sticky, refrigerate 15 min before continuing'],
    bake:   ['cookies continue cooking on the hot pan for 2–3 min after you remove them — pull them when edges are set but centers look soft',
             'if cookies are spreading flat, your butter was too warm or your baking sheet was warm',
             'dark-colored pans absorb more heat — expect 2–3 min shorter bake times'],
    rest:   ['let cookies cool on the pan 5 min before moving — they are fragile and continue setting',
             'do not stack warm cookies — steam makes them soggy on the bottom'],
    finish: ['if storing: a slice of bread in the airtight container keeps cookies soft for days'],
  },
  dinner: {
    prep:   ['bring proteins to room temperature 20–30 min before cooking for even doneness',
             'pat proteins completely dry — surface moisture causes steaming instead of searing'],
    mix:    ['salt a sauce in layers — add some early, adjust at end after reduction'],
    cook:   ['do not move protein once it hits the hot pan — it will release naturally when a crust forms',
             'crowding the pan drops temperature and causes steaming, not browning',
             'always deglaze the pan — the brown bits (fond) are concentrated flavor'],
    rest:   ['rest meat 5–10 min tented with foil before cutting — juices redistribute',
             'carryover cooking raises internal temp 5–10°F after leaving heat'],
    finish: ['add acid (lemon, vinegar) at the end to brighten the dish'],
  },
  soup: {
    prep:   ['bloom dry spices in oil for 60 seconds before adding liquid — this activates fat-soluble flavors'],
    cook:   ['simmer, do not boil — a rolling boil makes stock cloudy and proteins tough',
             'add delicate vegetables in the last 5–10 min so they stay bright and tender'],
    finish: ['balance at the end: season with salt, add acid, taste and adjust',
             'a spoonful of butter or heavy cream stirred in at the end gives silky body'],
  },
  breakfast: {
    prep:   ['eggs should be at room temperature for scrambled eggs and omelets — cold eggs seize up faster'],
    cook:   ['scrambled eggs are done when they are still slightly underset — carryover heat finishes them',
             'pancakes are ready to flip when bubbles appear across the surface and the edges look set'],
    finish: ['rest pancakes on a wire rack, not a plate — steam from a plate makes them soggy underneath'],
  },
  lunch: {
    mix:    ['dress salads immediately before serving — acid wilts greens within minutes'],
    cook:   ['always season pasta water generously — it is the only time pasta absorbs salt'],
    finish: ['add crunchy elements (croutons, seeds, nuts) last so they stay crisp'],
  },
  snack: {
    bake:   ['small baked snacks cook fast — check 3–5 min before stated time'],
    finish: ['cool completely before storing — heat trapped in a closed container creates steam and sogginess'],
  },
  general: {
    prep:   ['read the full recipe before starting — "mise en place" (everything in its place) prevents mid-step surprises'],
    cook:   ['taste as you go — you cannot fix underseasoning after the dish is on the table'],
    rest:   ['patience at this stage matters — rushing the resting step changes the final texture'],
    finish: ['adjust seasoning with a small pinch of salt AND a squeeze of acid — both together elevate the dish'],
  },
};

/* ── Main class ──────────────────────────────────────────────────── */
class SmartHelper {
  /**
   * @param {string}   recipeName   - recipe name
   * @param {number}   stepNumber   - 1-based step number shown to user
   * @param {string}   stepText     - full text of this step
   * @param {string}   recipeType   - e.g. 'dessert', 'dinner', 'soup'
   * @param {string[]} allSteps     - full ordered steps array (optional but enables order-aware advice)
   * @param {number}   stepIndex    - 0-based index of current step in allSteps (optional)
   */
  constructor(recipeName, stepNumber, stepText, recipeType, allSteps, stepIndex) {
    this.recipeName  = recipeName  || 'Recipe';
    this.stepNumber  = stepNumber  || 1;
    this.stepText    = stepText    || '';
    this.recipeType  = recipeType  || 'general';
    this.allSteps    = Array.isArray(allSteps) ? allSteps : [];
    this.stepIndex   = typeof stepIndex === 'number' ? stepIndex : (stepNumber - 1);
    this.phase       = this._detectPhase();
    this.apiBase     = 'http://localhost:5000';
    this._overlay    = null;

    // Record that help was requested for this phase + recipe type
    this._recordHelpRequest();
  }

  /* ── Detect cooking phase from step text + position ──────────── */
  _detectPhase() {
    const t = this.stepText.toLowerCase();
    const total = this.allSteps.length || 1;
    const pos   = this.stepIndex / Math.max(total - 1, 1);
    if (/preheat|measure|gather|chop|dice|mince|prepare|grease|line/.test(t)) return 'prep';
    if (/mix|blend|combine|stir|fold|whisk|beat|cream|sift/.test(t))          return 'mix';
    if (/bake|roast|broil/.test(t))                                             return 'bake';
    if (/simmer|boil|fry|sauté|saute|cook|heat|grill|sear/.test(t))           return 'cook';
    if (/cool|rest|chill|refrigerate|let stand/.test(t))                        return 'rest';
    if (/serve|plate|garnish|top with|drizzle/.test(t))                         return 'finish';
    // position-based fallback
    if (pos < 0.25) return 'prep';
    if (pos > 0.85) return 'finish';
    return 'cook';
  }

  /* ── Record help request pattern in localStorage ──────────────── */
  _recordHelpRequest() {
    try {
      const key      = 'dig_step_patterns';
      const patterns = JSON.parse(localStorage.getItem(key) || '{}');
      const type     = this.recipeType || 'general';
      // Increment counters for: type+phase, phase alone, step position bucket
      const bucket   = this.allSteps.length
        ? Math.floor((this.stepIndex / this.allSteps.length) * 3) // 0=early,1=mid,2=late
        : 1;
      [`${type}_${this.phase}`, `any_${this.phase}`, `${type}_pos${bucket}`].forEach(k => {
        patterns[k] = (patterns[k] || 0) + 1;
      });
      localStorage.setItem(key, JSON.stringify(patterns));
    } catch (_) {}
  }

  /* ── Get adapted tips based on learned patterns ──────────────── */
  _getAdaptedTips() {
    const type  = this.recipeType || 'general';
    const phase = this.phase;

    // Merge type-specific + general phase knowledge
    const base = [
      ...(PHASE_PATTERNS[type]?.[phase]      || []),
      ...(PHASE_PATTERNS['general']?.[phase] || []),
    ].filter(Boolean);

    // Check what phases this user has needed help with most
    try {
      const patterns  = JSON.parse(localStorage.getItem('dig_step_patterns') || '{}');
      const typePhase = patterns[`${type}_${phase}`] || 0;
      const anyPhase  = patterns[`any_${phase}`]     || 0;
      // If we've seen 3+ help requests for this exact phase, surface a "frequent issue" callout
      if (typePhase >= 3 || anyPhase >= 5) {
        base.unshift(`⚡ Heads up: this ${phase.toUpperCase()} phase step is where things often go wrong in ${type} recipes. Read carefully before proceeding.`);
      }
    } catch (_) {}

    return base.slice(0, 4); // max 4 adapted tips
  }

  /* ── Consequence analysis: what downstream steps depend on this ── */
  _getConsequences() {
    if (!this.allSteps.length) return [];
    const results = [];
    const thisText = this.stepText.toLowerCase();

    // Ingredients / preparations that carry forward
    const carries = [];
    if (/cream butter|creamed butter/.test(thisText)) carries.push('the airy fat structure');
    if (/fold|folding/.test(thisText))               carries.push('the volume and air');
    if (/rest|chill|proof/.test(thisText))            carries.push('the texture and structure');
    if (/temper|tempering/.test(thisText))            carries.push('the smooth chocolate coating');
    if (/caramel/.test(thisText))                     carries.push('the caramel base');
    if (/emulsify|emulsion/.test(thisText))           carries.push('the sauce consistency');

    carries.forEach(c => {
      // Find next step that references something built here
      for (let j = this.stepIndex + 1; j < Math.min(this.stepIndex + 4, this.allSteps.length); j++) {
        results.push(`Step ${j + 1} depends on ${c} being correct at this stage.`);
        break;
      }
    });

    return results.slice(0, 2);
  }

  /* ── Find relevant science for this step ──────────────────────── */
  _detectScience() {
    const text = this.stepText.toLowerCase();
    return STEP_SCIENCE.find(sc => sc.triggers.some(t => text.includes(t))) || null;
  }

  /* ── Local pattern matching ──────────────────────────────────── */
  _localAdvice(description) {
    const d = (description || '').toLowerCase();
    for (const key of Object.keys(HELP_ADVICE)) {
      const entry = HELP_ADVICE[key];
      if (entry.keywords.some(kw => d.includes(kw))) return entry;
    }
    return null;
  }

  /* ── Build and show the modal ────────────────────────────────── */
  showHelpModal() {
    const science      = this._detectScience();
    const adaptedTips  = this._getAdaptedTips();
    const consequences = this._getConsequences();
    const total        = this.allSteps.length;

    const stepPreview  = this.stepText.length > 160
      ? this.stepText.substring(0, 160) + '…'
      : this.stepText;

    // Prev / next step context for the modal (full truncated text)
    const prevStep = this.stepIndex > 0
      ? this.allSteps[this.stepIndex - 1] : null;
    const nextStep = this.stepIndex < this.allSteps.length - 1
      ? this.allSteps[this.stepIndex + 1] : null;

    const phaseLabel = this.phase.charAt(0).toUpperCase() + this.phase.slice(1);

    const overlay = document.createElement('div');
    overlay.className = 'dig-helper-overlay';
    overlay.innerHTML = `
      <div class="dig-helper-modal" role="dialog" aria-modal="true">

        <!-- Header -->
        <div class="dig-helper-header">
          <div>
            <h3>🆘 STEP ${this.stepNumber} HELP</h3>
            <div class="dig-helper-subhead">${this.recipeName.toUpperCase()}${total ? ` · ${this.stepNumber}/${total}` : ''} · ${phaseLabel.toUpperCase()} PHASE</div>
          </div>
          <button class="dig-helper-close" aria-label="close">✕</button>
        </div>

        <!-- Recipe flow context strip -->
        ${(prevStep || nextStep) ? `
        <div class="dig-helper-flow">
          <div class="dig-helper-flow-item ${!prevStep ? 'dig-helper-flow-empty' : ''}">
            ${prevStep ? `<span class="dig-helper-flow-label">← PREV</span><span class="dig-helper-flow-text">${prevStep.length > 70 ? prevStep.slice(0, 70) + '…' : prevStep}</span>` : ''}
          </div>
          <div class="dig-helper-flow-now">
            <span class="dig-helper-flow-label">NOW</span>
            <span class="dig-helper-flow-text" style="color:#f4a924;">${stepPreview.length > 70 ? stepPreview.slice(0,70)+'…' : stepPreview}</span>
          </div>
          <div class="dig-helper-flow-item ${!nextStep ? 'dig-helper-flow-empty' : ''}">
            ${nextStep ? `<span class="dig-helper-flow-label">NEXT →</span><span class="dig-helper-flow-text">${nextStep.length > 70 ? nextStep.slice(0, 70) + '…' : nextStep}</span>` : ''}
          </div>
        </div>` : ''}

        <!-- Step text (full) -->
        <div class="dig-helper-step-ctx">
          <strong>STEP ${this.stepNumber}${total ? ` OF ${total}` : ''} · ${phaseLabel.toUpperCase()} PHASE</strong>
          ${stepPreview}
        </div>

        <!-- Consequence warning (order-dependency) -->
        ${consequences.length ? `
        <div class="dig-helper-consequence">
          <div class="dig-helper-consequence-head">🔗 ORDER MATTERS — DOWNSTREAM IMPACT</div>
          ${consequences.map(c => `<div class="dig-helper-consequence-item">▸ ${c}</div>`).join('')}
        </div>` : ''}

        <!-- Adapted tips from learned patterns -->
        ${adaptedTips.length ? `
        <div class="dig-helper-adapted">
          <div class="dig-helper-adapted-head">📚 WHAT WE'VE LEARNED ABOUT THIS PHASE</div>
          <ul class="dig-helper-adapted-list">
            ${adaptedTips.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>` : ''}

        <!-- Step science -->
        ${science ? `
        <div class="dig-helper-science">
          <div class="dig-helper-science-head">⚗️ SCIENCE: ${science.name.toUpperCase()}</div>
          <p>${science.text}</p>
        </div>` : ''}

        <!-- Why cooking is science panel (collapsed by default) -->
        <details class="dig-helper-science-art-details">
          <summary class="dig-helper-sa-summary">🔬 WHY THINGS GO WRONG IN COOKING (science overview)</summary>
          <ul class="dig-helper-sa-list" style="margin-top:8px;">
            <li>Your oven temperature may differ from the dial by up to 50°F</li>
            <li>Elevation changes boiling point and leavening behavior</li>
            <li>Humidity affects how flour absorbs moisture</li>
            <li>The ORDER of steps changes the chemistry of the dish</li>
            <li>Ingredient temperature (cold butter vs. room temp) changes texture</li>
            <li>Cooking is science — small changes compound into big results</li>
          </ul>
        </details>

        <!-- Body -->
        <div class="dig-helper-body">
          <label class="dig-helper-label">DESCRIBE WHAT WENT WRONG</label>
          <textarea class="dig-helper-textarea" id="dh-problem"
            placeholder="e.g. My cookies spread too flat, the sauce looks curdled, the dough is too sticky to roll..."></textarea>

          <!-- Photo upload -->
          <div class="dig-helper-photo-zone" id="dh-photo-zone" title="Tap to add photo">
            <input type="file" id="dh-photo" accept="image/*" capture="environment">
            <div class="dig-helper-photo-label">📷 ADD PHOTO (optional — helps give better advice)</div>
            <div class="dig-helper-photo-preview" id="dh-photo-preview"></div>
          </div>

          <!-- Environmental factors -->
          <div class="dig-helper-env">
            <div class="dig-helper-env-head">🌡️ YOUR ENVIRONMENT</div>
            <div class="dig-helper-env-grid">
              <div>
                <label class="dig-helper-label">OVEN TYPE</label>
                <select class="dig-helper-select" id="dh-oven">
                  <option value="conventional">Conventional</option>
                  <option value="convection">Convection / Fan</option>
                  <option value="toaster">Toaster Oven</option>
                  <option value="gas">Gas Oven</option>
                  <option value="microwave">Microwave Only</option>
                </select>
              </div>
              <div>
                <label class="dig-helper-label">ALTITUDE (feet)</label>
                <input class="dig-helper-input" type="number" id="dh-alt" placeholder="0 = sea level" min="0" max="15000">
              </div>
              <div>
                <label class="dig-helper-label">HUMIDITY</label>
                <select class="dig-helper-select" id="dh-humidity">
                  <option value="normal">Normal</option>
                  <option value="humid">Humid / Rainy</option>
                  <option value="dry">Dry / Arid</option>
                </select>
              </div>
              <div>
                <label class="dig-helper-label">EXPERIENCE</label>
                <select class="dig-helper-select" id="dh-experience">
                  <option value="beginner">Beginner</option>
                  <option value="home_cook">Home Cook</option>
                  <option value="experienced">Experienced</option>
                </select>
              </div>
            </div>
            <p class="dig-helper-env-note">NYC is near sea level but can be very humid in summer. These factors affect timing and texture.</p>
          </div>

          <button class="dig-helper-submit" id="dh-submit">▶ GET HELP</button>
          <div id="dh-response" class="dig-helper-response" style="display:none;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this._overlay = overlay;

    /* Close handlers */
    overlay.querySelector('.dig-helper-close').addEventListener('click', () => this._close());
    overlay.addEventListener('click', e => { if (e.target === overlay) this._close(); });

    /* Photo preview */
    const photoZone = overlay.querySelector('#dh-photo-zone');
    const photoInput = overlay.querySelector('#dh-photo');
    photoZone.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        overlay.querySelector('#dh-photo-preview').innerHTML =
          `<img src="${ev.target.result}" alt="dish photo">`;
      };
      reader.readAsDataURL(file);
    });

    /* Submit */
    overlay.querySelector('#dh-submit').addEventListener('click', () => this._submit(overlay));
  }

  /* ── Submit and get advice ───────────────────────────────────── */
  async _submit(overlay) {
    const btn = overlay.querySelector('#dh-submit');
    const description = overlay.querySelector('#dh-problem').value.trim();
    const ovenType    = overlay.querySelector('#dh-oven').value;
    const altitude    = parseInt(overlay.querySelector('#dh-alt').value) || 0;
    const humidity    = overlay.querySelector('#dh-humidity').value;
    const experience  = overlay.querySelector('#dh-experience').value;
    const photoFile   = overlay.querySelector('#dh-photo').files[0];

    btn.disabled = true;
    btn.textContent = '⏳ ANALYZING…';

    let photoBase64 = null;
    if (photoFile) {
      photoBase64 = await this._fileToBase64(photoFile);
    }

    /* Try backend, fall back to local */
    let advice = null;
    try {
      const res = await Promise.race([
        fetch(`${this.apiBase}/api/helper/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipe_name:      this.recipeName,
            recipe_type:      this.recipeType,
            step_number:      this.stepNumber,
            step_text:        this.stepText,
            step_index:       this.stepIndex,
            total_steps:      this.allSteps.length,
            phase:            this.phase,
            prev_step:        this.allSteps[this.stepIndex - 1] || null,
            next_step:        this.allSteps[this.stepIndex + 1] || null,
            user_description: description,
            user_photo:       photoBase64,
            environmental_data: { oven_type: ovenType, altitude, humidity, experience },
          }),
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
      ]);
      if (res.ok) advice = await res.json();
    } catch (_) { /* offline — use local advice */ }

    if (!advice) {
      advice = this._buildLocalAdvice(description, ovenType, altitude, humidity);
    }

    btn.disabled = false;
    btn.textContent = '▶ GET HELP AGAIN';
    this._renderResponse(overlay, advice, ovenType, altitude, humidity);

    /* Store interaction for training regardless of online/offline */
    this._storeTrainingData({ description, ovenType, altitude, humidity, photoBase64, advice });
  }

  /* ── Build local advice object ───────────────────────────────── */
  _buildLocalAdvice(description, ovenType, altitude, humidity) {
    const match = this._localAdvice(description);
    const envNotes = this._buildEnvNotes(ovenType, altitude, humidity);

    return {
      interaction_id: `local_${Date.now()}`,
      problem_analysis: {
        identified_issues: match ? [match.issue] : ['No specific pattern matched — providing general guidance'],
        severity: match ? match.severity : 'low',
      },
      suggested_solution: match
        ? match.fix
        : 'Double-check your oven temperature with a thermometer, ensure ingredients were at the right temperature when combined, and make sure you followed each step in order. Cooking chemistry is precise — a small deviation early can compound later.',
      science_context: match ? match.science : null,
      environmental_notes: envNotes,
      should_restart: match ? match.restart : false,
      source: 'local',
    };
  }

  /* ── Build environmental advice array ───────────────────────── */
  _buildEnvNotes(ovenType, altitude, humidity) {
    const notes = [];
    if (ovenType !== 'conventional') notes.push(ENV_ADVICE[ovenType] || '');
    if (altitude >= 2500 && altitude < 5000)  notes.push(ENV_ADVICE.high_altitude['2500-5000']);
    else if (altitude >= 5000 && altitude < 7500) notes.push(ENV_ADVICE.high_altitude['5000-7500']);
    else if (altitude >= 7500)                     notes.push(ENV_ADVICE.high_altitude['7500+']);
    if (humidity === 'humid') notes.push(ENV_ADVICE.humid);
    if (humidity === 'dry')   notes.push(ENV_ADVICE.dry);
    return notes.filter(Boolean);
  }

  /* ── Render advice in the modal ─────────────────────────────── */
  _renderResponse(overlay, advice, ovenType, altitude, humidity) {
    const div          = overlay.querySelector('#dh-response');
    const sev          = advice.problem_analysis?.severity || 'low';
    const sevClass     = `dig-helper-severity-${sev}`;
    const consequences = this._getConsequences();
    const adaptedTips  = this._getAdaptedTips();

    // Determine which adapted tips are relevant to this specific problem
    // (de-duplicate with what's already shown in the modal header)
    const problemText   = (advice.problem_analysis?.identified_issues?.join(' ') || '').toLowerCase();
    const freshTips     = adaptedTips.filter(t => {
      // Surface tips that specifically relate to the identified problem
      const tipLower = t.toLowerCase();
      if (problemText.includes('spread') && tipLower.includes('spread')) return true;
      if (problemText.includes('burn')   && tipLower.includes('pan'))     return true;
      if (problemText.includes('raw')    && tipLower.includes('pull'))    return true;
      if (problemText.includes('tough')  && tipLower.includes('mix'))     return true;
      return false;
    });

    // Figure out what steps come after this one that the user should watch
    const watchSteps = consequences.length ? consequences : (
      this.allSteps.length > this.stepIndex + 1
        ? [`Step ${this.stepIndex + 2} is coming up — resolve this before moving on.`]
        : []
    );

    div.innerHTML = `
      <div class="${sevClass}">
        <div class="dig-helper-answer-head">📋 WHAT WE FOUND</div>
        <p class="dig-helper-answer-text">${advice.problem_analysis?.identified_issues?.join(', ') || 'Analyzing…'}</p>

        <div class="dig-helper-answer-head">💡 HOW TO FIX IT</div>
        <p class="dig-helper-answer-text">${advice.suggested_solution}</p>

        ${advice.science_context ? `
          <div class="dig-helper-answer-head">⚗️ THE SCIENCE</div>
          <p class="dig-helper-answer-text">${advice.science_context}</p>
        ` : ''}

        ${advice.environmental_notes?.length ? `
          <div class="dig-helper-answer-head">🌡️ YOUR ENVIRONMENT IS A FACTOR</div>
          <div class="dig-helper-env-advice">
            ${advice.environmental_notes.map(n => `<div style="margin-bottom:6px;">▸ ${n}</div>`).join('')}
          </div>
        ` : ''}

        ${freshTips.length ? `
          <div class="dig-helper-answer-head">📚 ADAPTED FOR THIS RECIPE TYPE</div>
          <div class="dig-helper-env-advice" style="border-color:#c8a000;background:#1a1800;">
            ${freshTips.map(t => `<div style="color:#d4c060;margin-bottom:5px;">▸ ${t}</div>`).join('')}
          </div>
        ` : ''}

        ${watchSteps.length && !advice.should_restart ? `
          <div class="dig-helper-answer-head">👁 WATCH IN UPCOMING STEPS</div>
          <div class="dig-helper-env-advice" style="border-color:#e06060;background:#2a1a1a;">
            ${watchSteps.map(w => `<div style="color:#e0a0a0;margin-bottom:4px;">▸ ${w}</div>`).join('')}
          </div>
        ` : ''}

        ${advice.should_restart ? `
          <div class="dig-helper-restart-warn">
            ⚠ CONSIDER RESTARTING — the issue identified is fundamental and cannot be fixed mid-recipe. Every good cook has restarted — what matters is understanding exactly why so it does not happen again.
          </div>
        ` : ''}

        <div class="dig-helper-feedback">
          <button class="dig-helper-fb-btn dig-helper-fb-yes" id="dh-yes">✓ HELPED</button>
          <button class="dig-helper-fb-btn dig-helper-fb-no"  id="dh-no">✕ NEED MORE</button>
        </div>
      </div>
    `;

    div.style.display = 'block';

    div.querySelector('#dh-yes').addEventListener('click', () => {
      this._sendFeedback(advice, true);
      // Mark this phase as "resolved" so next time we know it was a real problem here
      this._markPhaseResolved(true);
      div.querySelector('.dig-helper-feedback').innerHTML =
        '<p style="font-size:12px;color:#7ae0b0;">✓ Glad it helped! Your feedback trains the system.</p>';
    });
    div.querySelector('#dh-no').addEventListener('click', () => {
      this._sendFeedback(advice, false);
      this._markPhaseResolved(false);
      div.querySelector('.dig-helper-feedback').innerHTML =
        '<p style="font-size:12px;color:#f4a924;">Got it — try being more specific about what you see, smell, or feel. Each detail helps the system learn.</p>';
    });

    div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ── Mark resolution outcome for learning ──────────────────────── */
  _markPhaseResolved(wasResolved) {
    try {
      const key      = 'dig_step_patterns';
      const patterns = JSON.parse(localStorage.getItem(key) || '{}');
      const rKey     = `${this.recipeType || 'general'}_${this.phase}_resolved`;
      const fKey     = `${this.recipeType || 'general'}_${this.phase}_unresolved`;
      if (wasResolved) patterns[rKey] = (patterns[rKey] || 0) + 1;
      else             patterns[fKey] = (patterns[fKey] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(patterns));
    } catch (_) {}
  }

  /* ── Store interaction for model training ────────────────────── */
  _storeTrainingData(data) {
    try {
      const key = 'dig_help_training';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({
        ts: Date.now(),
        recipe: this.recipeName,
        step: this.stepNumber,
        step_text: this.stepText,
        ...data,
        photo: data.photoBase64 ? '[base64_image]' : null,
      });
      // Keep last 200 interactions
      if (existing.length > 200) existing.splice(0, existing.length - 200);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (_) {}

    /* Fire-and-forget to backend */
    try {
      fetch(`${this.apiBase}/api/helper/training-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe: this.recipeName,
          step: this.stepNumber,
          description: data.description,
          photo: data.photoBase64,
          env: { oven: data.ovenType, altitude: data.altitude, humidity: data.humidity },
        }),
      }).catch(() => {});
    } catch (_) {}
  }

  /* ── Feedback ────────────────────────────────────────────────── */
  async _sendFeedback(advice, wasHelpful) {
    try {
      await fetch(`${this.apiBase}/api/helper/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interaction_id: advice.interaction_id, was_helpful: wasHelpful }),
      });
    } catch (_) {}
  }

  /* ── Utilities ───────────────────────────────────────────────── */
  _close() { this._overlay?.remove(); this._overlay = null; }

  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
}

/* Export for use in recipe.html and anywhere else */
if (typeof module !== 'undefined') module.exports = SmartHelper;
