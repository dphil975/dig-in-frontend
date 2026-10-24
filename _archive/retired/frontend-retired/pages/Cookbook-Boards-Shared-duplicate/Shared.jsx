import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import { decodeSharedBoard, importSharedBoard } from '../../../services/boardsService';
import './Boards.css';

const EMOJI_MAP = {
  pasta:'PASTA', soup:'SOUP', rice:'RICE', bread:'BREAD', cake:'CAKE', salad:'SALAD',
  chicken:'CHICKEN', beef:'BEEF', fish:'FISH', curry:'CURRY', noodle:'NOODLE', taco:'TACO',
  egg:'EGG', dessert:'DESSERT', default:'DEFAULT',
};
function dishEmoji(r) {
  const t = ((r?.name || '') + ' ' + (r?.country || '')).toLowerCase();
  for (const [k, v] of Object.entries(EMOJI_MAP)) if (k !== 'default' && t.includes(k)) return v;
  return EMOJI_MAP.default;
}
const cleanTitle = (n = '') => n.replace(/\s*\([^)]*\)/g, '').trim() || n;

export default function SharedBoard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const board = useMemo(() => {
    const b = params.get('b');
    return b ? decodeSharedBoard(b) : null;
  }, [params]);

  function saveToMyBoards() {
    if (!board) return;
    importSharedBoard(board);
    setSaved(true);
  }

  if (!board) {
    return (
      <div className="boards-page">
        <Nav />
        <div className="bd-wrap">
          <div className="bd-empty" style={{ marginTop: 40 }}>
            This shared board link looks broken or expired.
            <div style={{ marginTop: 16 }}>
              <button className="bd-btn bd-btn-gold" onClick={() => navigate('/boards')}>Go to My Boards</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="boards-page">
      <Nav />
      <div className="bd-wrap">
        <p className="bd-eyebrow">SHARED BOARD</p>
        <div className="bd-head">
          <h1 className="bd-title">{board.emoji} {board.title}</h1>
          <button className="bd-btn bd-btn-gold" onClick={saveToMyBoards} disabled={saved}>
            {saved ? '✓ SAVED TO YOUR BOARDS' : '+ SAVE TO MY BOARDS'}
          </button>
        </div>
        {board.description && <p className="bd-hint">{board.description}</p>}

        <div className="bd-recipe-grid" style={{ marginTop: 18 }}>
          {board.recipes.length === 0
            ? <div className="bd-empty">This board has no recipes.</div>
            : board.recipes.map((r, i) => (
                <div className="bd-recipe" key={r.id || r.name || i}>
                  <div className="bd-recipe-img">
                    {r.image ? <img src={r.image} alt={r.name} loading="lazy" /> : <span>{dishEmoji(r)}</span>}
                  </div>
                  <div className="bd-recipe-body">
                    <div className="bd-recipe-name">{cleanTitle(r.name)}</div>
                    <div className="bd-recipe-meta">
                      {(r.country) || 'Recipe'}{r.time ? ` · ${r.time}m` : ''}
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
