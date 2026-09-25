import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import { listCircles, createCircle, joinCircle } from '../../../../lib/circlesApi';
import './Circles.css';

/* My Circles — Kitchen Table / Sisterhood Circles list/create/join UI.
   Extracted out of the old standalone Circles page (now folded into the
   "Out There" hub alongside Occasions/Check-In/The Table) so it's a real
   embeddable child like every other hub tab, instead of inline JSX in the
   hub component itself. Built on the app's REAL Supabase Auth identity (see
   syncService.js's getUserId() fix) instead of the anonymous per-device id
   every other feature uses — a circle post needs a real, non-impersonatable
   author. Only fetches when actually mounted (i.e. only when this tab is
   selected), same as every other conditionally-rendered hub tab. */
export default function MyCircles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    const list = await listCircles();
    setCircles(list);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function submitCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    try {
      await createCircle({ name, description });
      setName(''); setDescription(''); setCreating(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleJoin(id) {
    const ok = await joinCircle(id);
    if (ok) navigate(`/circles/${id}`);
  }

  return (
    <div className="circ-page">
      <div className="circ-header">
        <h1>Kitchen Table</h1>
        <p>Small circles for cooking together — signed in as {user?.email || user?.user_metadata?.username || 'you'}.</p>
        <button className="circ-btn circ-btn-primary" onClick={() => setCreating(c => !c)}>
          {creating ? 'CANCEL' : '+ START A CIRCLE'}
        </button>
      </div>

      {creating && (
        <form className="circ-create" onSubmit={submitCreate}>
          <input
            className="circ-input"
            placeholder="Circle name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <textarea
            className="circ-textarea"
            placeholder="What's this circle about?"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          {error && <div className="circ-error">{error}</div>}
          <button className="circ-btn circ-btn-primary" type="submit">CREATE</button>
        </form>
      )}

      {loading ? (
        <div className="circ-loading">Loading circles…</div>
      ) : circles.length === 0 ? (
        <div className="circ-empty">No circles yet — start the first one.</div>
      ) : (
        <div className="circ-list">
          {circles.map(c => (
            <div className="circ-card" key={c.id}>
              <div className="circ-card-name">{c.name}</div>
              {c.description && <div className="circ-card-desc">{c.description}</div>}
              <div className="circ-card-actions">
                <button className="circ-btn" onClick={() => navigate(`/circles/${c.id}`)}>VIEW</button>
                <button className="circ-btn circ-btn-primary" onClick={() => handleJoin(c.id)}>JOIN</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
