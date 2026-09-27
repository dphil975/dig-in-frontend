import { useState, useEffect, lazy, Suspense } from 'react';
import NovaSprite from '../../nova/NovaSprite';
import './AskNova.css';

/* Ask Nova — the floating launcher, on every page. It is deliberately tiny: the
   conversation (Panel.jsx, with Nova's knowledge base and the recipe books) is
   loaded the first time it is opened, and stays mounted afterwards so the
   conversation survives closing the panel. Anything can open it by dispatching
   the window event `dig_in_open_nova`. */

const loadPanel = () => import('./Panel');
const Panel = lazy(loadPanel);
const prefetch = () => { loadPanel(); };   // warm the chunk when the button is approached

export default function AskNova() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [question, setQuestion] = useState('');   // typed in for you when opened from an open question

  function show(e) {
    setQuestion(typeof e?.detail?.question === 'string' ? e.detail.question : '');
    setLoaded(true);
    setOpen(true);
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('dig_in_open_nova', show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('dig_in_open_nova', show);
    };
  }, []);

  return (
    <>
      {!open && (
        <button
          className="askn-launcher"
          onClick={show}
          onPointerEnter={prefetch}
          onFocus={prefetch}
          aria-label="Ask Nova a cooking question"
        >
          <NovaSprite look="pink" h={34} title="Nova" />
          <span className="askn-launcher-label">Ask Nova</span>
        </button>
      )}
      {loaded && (
        <Suspense fallback={null}>
          <Panel open={open} onClose={() => setOpen(false)} question={question} />
        </Suspense>
      )}
    </>
  );
}
