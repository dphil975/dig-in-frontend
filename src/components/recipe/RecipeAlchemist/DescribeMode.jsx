import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alchemize, getAlchemistStats, FORMAT_LIST } from '../../../lib/recipeAlchemist';
import { saveRecipe } from '../../../services/saveService';
import { track } from '../../../lib/analytics';
import NovaSprite from '../../nova/NovaSprite';
import { recipeFlavors } from '../../../lib/flavorProfile';
import { reblogRecipeToCommunity } from '../../../lib/userPosts';
import { complaintLevel } from '../../../lib/complaintDetector';
import { empathyLine, toneMeta } from '../../../lib/novaVoice';
import { loadSettings } from '../../../lib/novaSettings';

/* Describe It — type a craving or a restaurant dish, get an invented recipe
   paired into a full meal. The original Kitchen Alchemist flow, unchanged in
   behavior — only the shell around it changed (see RecipeAlchemist.css). */

const EXAMPLES = [
  'barbacoa burrito bowl', 'apple pie cookie', 'restaurant-style alfredo',
  'griddled smash burger', 'buffalo chicken soup', 'pad thai',
];

export default function DescribeMode() {
  const navigate = useNavigate();
  const [text, setText]       = useState('');
  const [format, setFormat]   = useState(null);   // optional format override
  const [result, setResult]   = useState(null);
  const [saved, setSaved]     = useState(false);
  const [posted, setPosted]   = useState(false);   // reblogged to community
  const [stats, setStats]     = useState(() => getAlchemistStats());
  const [nova, setNova]       = useState(null);   // { line, flavors } — Nova's read on the last request
  const [tone] = useState(() => loadSettings().tone);

  useEffect(() => { setStats(getAlchemistStats()); }, []);

  function create(overrideText, overrideFormat) {
    const t = (overrideText ?? text);
    const fmt = overrideFormat ?? format;

    // Nova's read on the request itself — empathy first if it reads like a
    // complaint/rough day ("nothing sounds good," "so bored of my food"),
    // same complaint-detection + tone-voice engine Ask Nova and the Craving
    // tab already run on, not a separate one built just for this page.
    const level = complaintLevel(t);
    const novaLine = level !== 'none' ? empathyLine(tone, { intensity: level }) : null;

    const r = alchemize(t, fmt ? { format: fmt } : {});
    if (r.error) {
      setResult({ error: true });
      setNova(novaLine ? { line: novaLine, flavors: [] } : null);
      return;
    }
    setResult(r);
    setSaved(false);
    setPosted(false);
    setStats(getAlchemistStats());        // the engine just learned from this
    // Reverse-engineer the invented dish's own flavor read, same keyword
    // vocabulary flavorProfile.js already tags every real recipe with.
    setNova({ line: novaLine, flavors: recipeFlavors({ ingredients: r.ingredients, instructions: r.instructions, name: r.name }) });
    track('recipe_alchemized', { format: r.format, theme: r.theme, kind: r.kind });
  }

  function pickFormat(key) {
    const next = format === key ? null : key;
    setFormat(next);
    if (text.trim() || next) create(text, next);   // instant remix when a format is chosen
  }

  function useExample(ex) {
    setText(ex);
    setFormat(null);
    create(ex, null);
  }

  function save() {
    if (!result || result.error) return;
    saveRecipe(result);
    setSaved(true);
    track('recipe_alchemized_saved', { format: result.format, theme: result.theme });
  }

  // The safe path: publish this AI-invented recipe to the communities you
  // follow (reblog into the feed), credited to Kitchen Alchemist and tagged
  // with its own flavors — a real recipe from a real tool, not raw UGC.
  function postToCommunity() {
    if (!result || result.error || posted) return;
    const flavorTags = (nova?.flavors || recipeFlavors(result) || []).map((f) => '#' + f);
    reblogRecipeToCommunity(result, { origin: 'Kitchen Alchemist', flavorTags });
    setPosted(true);
    track('recipe_alchemized_posted', { format: result.format, theme: result.theme });
  }

  function openFull() {
    if (!result || result.error) return;
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(result));
      sessionStorage.removeItem('dig_in_full_recipe_adapt');
    } catch {}
    navigate('/recipe');
  }

  // Craving → grocery route in one tap: seed the shopping list with everything
  // the invented recipe needs and drop the cook straight into the commute planner.
  function sendToRoute() {
    if (!result || result.error) return;
    try {
      localStorage.setItem('dig_in_shopping_list', JSON.stringify(result.ingredients || []));
      localStorage.removeItem('dig_in_shopping_picked');   // fresh trip
    } catch {}
    track('recipe_alchemized_to_route', { format: result.format, theme: result.theme });
    navigate('/craving-compass');
  }

  const sweet  = stats.formatsByPopularity.filter(f => f.kind === 'sweet' || f.kind === 'both');
  const savory = stats.formatsByPopularity.filter(f => f.kind === 'savory' || f.kind === 'both');

  return (
    <div className="alch-mode">
      <div className="alch-card alch-card-head">
        <h2 className="alch-title">Make a <span>“{text.trim() || 'apple pie cookie'}”</span></h2>
        <p className="alch-sub">
          Type a <b>flavor mash-up</b> or a <b>restaurant dish</b> — we’ll invent the recipe and pair it into a full meal.
        </p>
      </div>

      <div className="alch-card">
        {/* Prompt */}
        <div className="alch-prompt">
          <input
            className="alch-input"
            placeholder="e.g. chipotle burrito bowl, apple pie cookie…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
          />
          <button className="alch-btn alch-btn-primary" onClick={() => create()}>CREATE</button>
        </div>

        {/* Example prompts + what you've made before (the engine adapts) */}
        <div className="alch-examples">
          {(stats.recent.length
            ? stats.recent.map(r => (r.theme ? `${r.theme} ${r.format}` : r.format))
            : EXAMPLES
          ).slice(0, 6).map(ex => (
            <button key={ex} className="alch-ex" onClick={() => useExample(ex)}>{ex}</button>
          ))}
        </div>
      </div>

      <div className="alch-card">
        {/* Format pickers */}
        <span className="alch-card-label">OR PICK A FORMAT</span>
        <div className="alch-formats">
          <div className="alch-fgroup">
            <span className="alch-fgroup-label">SWEET</span>
            {sweet.map(f => (
              <button key={f.key} className={`alch-fbtn${format === f.key ? ' active' : ''}`} onClick={() => pickFormat(f.key)}>
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
          <div className="alch-fgroup">
            <span className="alch-fgroup-label">SAVORY</span>
            {savory.map(f => (
              <button key={f.key} className={`alch-fbtn${format === f.key ? ' active' : ''}`} onClick={() => pickFormat(f.key)}>
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nova's read — empathy first if the request read like a complaint,
          plus a reverse-engineered flavor tag on whatever got invented */}
      {nova && (nova.line || nova.flavors?.length > 0) && (
        <div className="alch-nova">
          <NovaSprite look="pink" h={30} title="Nova" />
          <div className="alch-nova-body">
            <div className="alch-nova-head">NOVA · {toneMeta(tone)?.label?.toLowerCase() || 'listener'} voice</div>
            {nova.line && <p className="alch-nova-line">{nova.line}</p>}
            {nova.flavors?.length > 0 && (
              <p className="alch-nova-flavors">
                Reverse-engineering what I made: reads as <b>{nova.flavors.join(', ')}</b>.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {result && result.error && (
        <div className="alch-card alch-error">
          Type a <b>restaurant dish</b> or a <b>flavor mash-up</b> above (or pick a format), and I’ll invent it!
        </div>
      )}

      {result && !result.error && (
        <div className="alch-result">
          <div className="alch-rcard-head">
            <span className="alch-remoji">{result.emoji}</span>
            <div>
              <div className="alch-rname">{result.name}</div>
              <div className="alch-rtags">
                <span className="alch-rtag">{result.kind}</span>
                <span className="alch-rtag">{result.time} min</span>
                <span className="alch-rtag">serves {result.servings}</span>
              </div>
            </div>
            <span className="alch-r5">QUICK SUMMARY</span>
          </div>

          <div className="alch-rbody">
            <div className="alch-rcol">
              <div className="alch-rlabel">WHAT YOU NEED</div>
              <ul className="alch-ings">
                {result.ingredients.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            </div>
            <div className="alch-rcol">
              <div className="alch-rlabel">THE QUICK VERSION</div>
              <p className="alch-summary">{result.summary}</p>
              <div className="alch-stepcount">
                {result.instructions.length} simple steps — open the full recipe to cook along.
              </div>
            </div>
          </div>

          {result.pairings && (
            <div className="alch-pairings">
              <div className="alch-rlabel">MAKE IT A MEAL · COMPILED FOR YOU</div>
              <div className="alch-pair-row">
                <span className="alch-pair"><b>SIDE</b> {result.pairings.side}</span>
                <span className="alch-pair"><b>DRINK</b> {result.pairings.drink}</span>
                <span className="alch-pair"><b>SWEET</b> {result.pairings.dessert}</span>
              </div>
            </div>
          )}

          <div className="alch-ractions">
            <button
              className={`alch-btn ${saved ? 'alch-btn-earned' : 'alch-btn-outline-matcha'}`}
              onClick={save} disabled={saved}
            >
              {saved ? '✓ SAVED' : 'SAVE TO COOKBOOK'}
            </button>
            <button className="alch-btn alch-btn-frog" onClick={sendToRoute}>
              🛒 SEND TO GROCERY ROUTE
            </button>
            <button
              className={`alch-btn ${posted ? 'alch-btn-earned' : 'alch-btn-outline'}`}
              onClick={postToCommunity} disabled={posted}
            >
              {posted ? '✓ POSTED' : '↻ POST TO MY COMMUNITY'}
            </button>
            <button className="alch-btn alch-btn-primary" onClick={openFull}>OPEN FULL RECIPE →</button>
          </div>
        </div>
      )}

      {/* Metrics strip */}
      <div className="alch-metrics">
        <span className="alch-metric">
          <b>{stats.totalCreated}</b> recipe{stats.totalCreated !== 1 ? 's' : ''} invented
        </span>
        {stats.topFormatLabel && (
          <span className="alch-metric">your go-to: <b>{stats.topFormatLabel}</b></span>
        )}
        <span className="alch-metric alch-metric-muted">{FORMAT_LIST.length} formats · learns as you create</span>
      </div>
    </div>
  );
}
