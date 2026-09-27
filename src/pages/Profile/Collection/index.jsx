import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards, getBoardRecipes } from '../../../services/boardsService';
import { getSavedRecipes } from '../../../services/saveService';
import CookedRecipes from '../../../components/you/CookedRecipes';
import CookJournal from '../../../components/you/CookJournal';
import ProfilePane from '../ProfilePane';

/* Profile → Collection — the recipes you've kept: saved recipes and boards, what
   you've cooked, and your cook journal. */
export default function Collection() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);

  useEffect(() => {
    setBoards(getBoards());
    setSavedRecipes(getSavedRecipes());
  }, []);

  return (
    <ProfilePane>
      <section className="profile-section">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <h3 className="section-title" style={{ margin:0 }}>SAVED RECIPES &amp; BOARDS</h3>
          <button
            onClick={() => navigate('/boards')}
            style={{ fontFamily:"'Press Start 2P',monospace", fontSize:9, padding:'10px 13px', borderRadius:8,
                     border:'2px solid #33302A', background:'#6E8259', color:'#33302A', cursor:'pointer',
                     boxShadow:'2px 2px 0 rgba(0,0,0,.3)' }}
          >
            MANAGE BOARDS →
          </button>
        </div>
        <p className="profile-hint">
          {savedRecipes.length} saved recipe{savedRecipes.length !== 1 ? 's' : ''} · {boards.length} board{boards.length !== 1 ? 's' : ''} — they stay here for you.
        </p>

        {boards.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
            {boards.map(b => (
              <button key={b.id} onClick={() => navigate('/boards')}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:20,
                         background:'#2a2140', border:'1px solid #554080', color:'#ece8f7', cursor:'pointer', fontSize:13 }}>
                <span>{b.emoji}</span>
                <span>{b.title}</span>
                <span style={{ color:'#6E8259', fontSize:12 }}>{getBoardRecipes(b).length}</span>
              </button>
            ))}
          </div>
        )}

        {savedRecipes.length === 0 ? (
          <p className="profile-hint" style={{ marginTop: 8 }}>
            No saved recipes yet — tap the heart on any recipe card to start a collection.
          </p>
        ) : (
          <div style={{ display:'flex', gap:10, overflowX:'auto', marginTop:12, paddingBottom:6 }}>
            {savedRecipes.slice(0, 24).map((r, i) => (
              <button
                key={r.id || r.name || i}
                onClick={() => { try { sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(r)); sessionStorage.removeItem('dig_in_full_recipe_adapt'); } catch { /* ignore */ } navigate('/recipe'); }}
                title={r.name}
                style={{ flex:'0 0 auto', width:96, textAlign:'left', cursor:'pointer', padding:0,
                         background:'#221a33', border:'2px solid #D8CAB4', borderRadius:10, overflow:'hidden', color:'#ece8f7' }}
              >
                <div style={{ height:64, background:'#33302A', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Press Start 2P', monospace", fontSize:9, color:'#999' }}>
                  {r.image ? <img src={r.image} alt={r.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : (r.name || 'DISH').split(/\s+/)[0].toUpperCase()}
                </div>
                <div style={{ padding:'6px 8px', fontSize:11, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {(r.name || '').replace(/\s*\([^)]*\)/g, '')}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* What you've cooked — My Cookbook card style + paginated "view more" */}
      <section className="profile-section">
        <h3 className="section-title">COOKED RECIPES</h3>
        <CookedRecipes />
      </section>

      {/* Cook Journal — a private scrapbook of every "I MADE THIS"; share a
          specific dish into a real Circle on your own terms. */}
      <section className="profile-section">
        <h3 className="section-title">COOK JOURNAL</h3>
        <CookJournal />
      </section>
    </ProfilePane>
  );
}
