import { useState, useEffect, useRef, useCallback } from 'react';
import NovaSprite from '../../nova/NovaSprite';
import { loadRecipeBooks } from '../../../lib/recipeBooks';
import { loadSettings, saveSettings } from '../../../lib/novaSettings';
import { toneMeta, empathyLine } from '../../../lib/novaVoice';
import { complaintLevel } from '../../../lib/complaintDetector';
import { detectShift, transitionLine } from '../../../lib/topicShift';
import { answerQuestion, voiceWrap, SUGGESTED_QUESTIONS } from '../../../lib/novaKnowledge';
import { askNovaLLM } from '../../../services/novaAI';
import { saveMemory, hasMemory } from '../../../lib/memoryVault';
import { getCookHistory, cookStreak } from '../../../services/saveService';

/* Ask Nova (panel) — the conversation UI. Loaded the first time someone opens
   Ask Nova (see ./index.jsx), so its knowledge base and the recipe books stay
   out of the first page load.

   Ask Nova — the global cooking brain. One companion, on every page.

   Deterministic-FIRST: the moment you ask, novaKnowledge answers from the books
   in Nova's current mood voice, with citations, zero network. Then, if the
   kitchen AI is switched on, the `ask` endpoint writes a richer answer grounded
   in the SAME sources and quietly swaps it in (marked ✨). Works offline; better
   online. Reads the recipe you're currently cooking (if any) for context. */

let _uid = 0;

function currentRecipe() {
  try { return JSON.parse(sessionStorage.getItem('dig_in_full_recipe') || 'null'); } catch { return null; }
}

// Short grounding snippet for a cited recipe, for the LLM context.
function snippetFor(recipe) {
  const s = (recipe?.instructions || [])[0] || (Array.isArray(recipe?.tips) ? recipe.tips[0] : '') || '';
  const text = typeof s === 'string' ? s : (s?.text || s?.instruction || '');
  return text ? String(text).slice(0, 140) : '';
}

export default function AskNovaPanel({ open, onClose, question = '' }) {
  const [input, setInput]     = useState('');
  const [entries, setEntries] = useState([]);   // chronological, oldest first — a real conversation thread
  const [recipes, setRecipes] = useState([]);
  const [tone, setTone]       = useState(() => loadSettings().tone);
  const [plainLanguage, setPlainLanguage] = useState(() => loadSettings().plainLanguage);
  const bodyRef = useRef(null);
  // ask() is a useCallback memoized on [recipes], which only changes once
  // (the books load) — reading `entries` directly inside it would capture a
  // stale, permanently-empty closure after that point (the "first message"
  // bonding note would then fire on every message, and a topic shift would
  // never be seen against the real previous turn). A ref sidesteps that
  // without forcing ask() to be recreated on every turn.
  const entriesRef = useRef([]);
  useEffect(() => { entriesRef.current = entries; }, [entries]);

  // Opened from an open question: put it in the box, ready to send.
  useEffect(() => { if (open && question) setInput(question); }, [open, question]);

  // Load the books once the panel is first opened.
  useEffect(() => {
    if (!open) return;
    setTone(loadSettings().tone);   // reflect current mood each open
    setPlainLanguage(loadSettings().plainLanguage);
    if (recipes.length) return;
    let alive = true;
    loadRecipeBooks().then(list => { if (alive) setRecipes(list); });
    return () => { alive = false; };
  }, [open, recipes.length]);

  // Keep the newest turn in view — a real conversation flows down, newest at
  // the bottom, not a reversed FAQ list you scroll up to read.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [entries]);

  const ask = useCallback(async (raw) => {
    const q = String(raw ?? '').trim();
    if (!q) return;
    setInput('');

    const settings = loadSettings();
    const t = settings.tone;
    setTone(t);
    setPlainLanguage(settings.plainLanguage);

    // Fold in the recipe you're cooking right now so answers can reference it.
    const cur = currentRecipe();
    const pool = cur ? [cur, ...recipes] : recipes;

    const det = answerQuestion(q, pool);

    // Notice a subject change (different category or different cited dish
    // than the last turn) and say so before answering, instead of just
    // silently pivoting — she was always re-answering fresh underneath, this
    // just makes the conversation read like she's actually following along.
    const prevEntry = entriesRef.current[entriesRef.current.length - 1];
    const shifted = detectShift(prevEntry, det);

    // If this reads like venting/a complaint (not just a plain question),
    // lead with an empathy line before the real technical fix — logic AND
    // emotion in one reply, instead of jumping straight to the fix.
    const level = complaintLevel(q);
    let answerText = level === 'none'
      ? det.text
      : `${empathyLine(t, { intensity: level })} ${det.text}`;
    if (shifted) answerText = `${transitionLine(t)}${answerText}`;

    // Bonding: the first message of a session gets a real continuity note —
    // she remembers you, not a stranger every time — from actual cook
    // history, not a fabricated relationship.
    if (entriesRef.current.length === 0) {
      const streak = cookStreak(getCookHistory());
      if (streak >= 2) answerText = `${streak}-day cooking streak — nice. ${answerText}`;
    }

    const id = ++_uid;
    const entry = {
      id, q,
      answer: voiceWrap(answerText, t, { plainLanguage: settings.plainLanguage }),
      citations: det.citations,
      category: det.category,
      isComplaint: level !== 'none',
      isShift: shifted,
      enhanced: false,
      loading: true,
      saved: false,
    };
    setEntries(prev => [...prev, entry]);

    // Build grounded context (name + source + snippet) for the LLM.
    const byId = new Map(pool.map(r => [r.id, r]));
    const context = det.citations.map(c => ({ name: c.name, source: c.source, snippet: snippetFor(byId.get(c.id)) }));

    const llm = await askNovaLLM({ question: q, context, tone: t });
    setEntries(prev => prev.map(e => e.id !== id ? e : (
      llm
        ? { ...e, answer: llm.answer, citations: llm.citations?.length ? llm.citations : e.citations, enhanced: true, loading: false }
        : { ...e, loading: false }
    )));
  }, [recipes]);

  const toneLabel = toneMeta(tone)?.label || 'Nova';

  function togglePlainLanguage() {
    const next = !plainLanguage;
    setPlainLanguage(next);
    saveSettings({ ...loadSettings(), plainLanguage: next });
  }

  // Bonding: a meaningful exchange becomes a keepsake in the same Memory
  // Vault the Vault/check-in/pantry reactions already write to — one save
  // mechanic, not a parallel one.
  function saveTurn(entry) {
    if (entry.saved) return;
    const dedupeKey = `askn:${entry.id}`;
    if (hasMemory(dedupeKey)) { setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, saved: true } : e)); return; }
    saveMemory({
      kind: entry.isComplaint ? 'love' : 'observation',
      text: `You asked: "${entry.q}" — ${entry.answer}`,
      context: { surface: 'ask-nova' },
      dedupeKey,
    });
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, saved: true } : e));
  }

  if (!open) return null;

  return (
    <>
        <div className="askn-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <div className="askn-panel" role="dialog" aria-label="Ask Nova">
            <header className="askn-head">
              <div className="askn-head-id">
                <NovaSprite look="pink" h={30} title="Nova" />
                <div>
                  <div className="askn-head-title">ASK NOVA</div>
                  <div className="askn-head-sub">cooking brain · {toneLabel.toLowerCase()} voice</div>
                </div>
              </div>
              <button
                type="button"
                className={`askn-plain${plainLanguage ? ' active' : ''}`}
                onClick={togglePlainLanguage}
                title="Simpler sentences, plain words"
                aria-pressed={plainLanguage}
              >
                {plainLanguage ? '✓ Simple' : 'Simple'}
              </button>
              <button className="askn-close" onClick={onClose} aria-label="Close">✕</button>
            </header>

            <div className="askn-body" ref={bodyRef}>
              {entries.length === 0 && (
                <div className="askn-intro">
                  <p>Ask me anything about what you're cooking — substitutes, technique, why something went wrong, food safety. I answer from your books.</p>
                  <div className="askn-suggested">
                    {SUGGESTED_QUESTIONS.map(s => (
                      <button key={s} className="askn-chip" onClick={() => ask(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {entries.map(e => (
                <div className="askn-turn" key={e.id}>
                  <div className="askn-q">{e.q}</div>
                  <div className="askn-a">
                    <div className="askn-a-sprite"><NovaSprite look="pink" h={26} title="Nova" /></div>
                    <div className="askn-a-body">
                      <p className="askn-a-text">{e.answer}</p>
                      {e.citations?.length > 0 && (
                        <div className="askn-cites">
                          {e.citations.map((c, i) => (
                            <span key={i} className="askn-cite" title={c.source}>📖 {c.name}</span>
                          ))}
                        </div>
                      )}
                      <div className="askn-a-meta">
                        {e.isShift && <span className="askn-badge askn-badge-shift" title="I noticed the subject changed">↩ new topic</span>}
                        {e.loading ? <span className="askn-thinking">Nova's checking the books…</span>
                          : e.enhanced ? <span className="askn-badge askn-badge-ai">✨ Nova AI</span>
                          : <span className="askn-badge">⚡ instant · from your books</span>}
                        {!e.loading && (
                          <button
                            type="button"
                            className={`askn-save${e.saved ? ' is-saved' : ''}`}
                            onClick={() => saveTurn(e)}
                            disabled={e.saved}
                          >
                            {e.saved ? '♥ Saved' : '♡ Save this'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form className="askn-input-row" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
              <input
                className="askn-input"
                placeholder="Ask Nova a cooking question…"
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
              />
              <button className="askn-send" type="submit" aria-label="Send">→</button>
            </form>
          </div>
        </div>
    </>
  );
}
