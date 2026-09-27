import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import NovaSprite from '../../../components/nova/NovaSprite';
import { getMemories, deleteMemory } from '../../../lib/memoryVault';
import './MemoryVault.css';

/* Memory Vault — Nova's keepsakes over time. The celebrations and love-letters
   she's saved as you cook and check in, kept as a scrapbook of the relationship.
   This is the premium hook: the longer you cook with Nova, the richer it gets. */

const KIND_META = {
  celebration: { icon: '🎉', label: 'Celebration' },
  love:        { icon: '💌', label: 'Love letter' },
  nudge:       { icon: '✨', label: 'Moment' },
  observation: { icon: '🌙', label: 'Note' },
};

function whenLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MemoryVault() {
  const navigate = useNavigate();
  const [memories, setMemories] = useState(() => getMemories());

  function remove(id) {
    deleteMemory(id);
    setMemories(getMemories());
  }

  return (
    <div>
      <Nav />
      <div className="mv-page">
        <header className="mv-header">
          <div className="mv-header-id">
            <NovaSprite look="pink" h={52} title="Nova" />
            <div>
              <h1 className="mv-title">MEMORY VAULT</h1>
              <p className="mv-sub">Nova's keepsakes · {memories.length} saved</p>
            </div>
          </div>
          <span className="mv-premium">♥ NOVA PREMIUM</span>
        </header>

        {memories.length === 0 ? (
          <div className="mv-empty">
            <div className="mv-empty-icon">💌</div>
            <h2>No memories yet</h2>
            <p>Cook a dish and Nova saves the celebration here. When she reacts on your vault or a check-in, tap ♥ to keep the moment.</p>
            <div className="mv-empty-links">
              <button className="mv-cta" onClick={() => navigate('/recipe-cards')}>Cook something</button>
              <button className="mv-cta mv-cta-outline" onClick={() => navigate('/my-cookbook')}>Open your vault</button>
            </div>
          </div>
        ) : (
          <div className="mv-list">
            {memories.map(m => {
              const meta = KIND_META[m.kind] || KIND_META.observation;
              return (
                <div className={`mv-card mv-card-${m.kind}`} key={m.id}>
                  {m.context?.image && (
                    <div className="mv-card-img"><img src={m.context.image} alt="" /></div>
                  )}
                  <div className="mv-card-body">
                    <div className="mv-card-top">
                      <span className="mv-kind">{meta.icon} {meta.label}</span>
                      <span className="mv-date">{whenLabel(m.createdAt)}</span>
                    </div>
                    <p className="mv-text">{m.text}</p>
                  </div>
                  <button className="mv-del" onClick={() => remove(m.id)} aria-label="Remove memory">✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
