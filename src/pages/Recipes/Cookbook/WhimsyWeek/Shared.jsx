import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import NovaSprite from '../../../../components/nova/NovaSprite';
import { decodeSharedWhimsy } from '../../../../lib/whimsyWeek';
import './WhimsyWeek.css';

/* The "gift kit" — a read-only, self-contained render of someone's Whimsy
   Week from a share URL (/whimsy-card?w=…). Mirrors Boards/Shared.jsx: no
   corpus load, no auth, just decode-and-display, with a soft CTA to build
   your own. This is the thing a micro-influencer receives and can post. */

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function dowLabel(iso) {
  try { return DOW[new Date(iso + 'T00:00:00').getDay()]; } catch { return ''; }
}

const KICKER = { cook: 'COOK', adventure: 'TRY', reflect: 'CHECK IN', share: 'SHARE', giftkit: 'GIFT' };

export default function WhimsyShared() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const plan = useMemo(() => {
    const w = params.get('w');
    return w ? decodeSharedWhimsy(w) : null;
  }, [params]);

  if (!plan) {
    return (
      <div className="ww-page">
        <Nav />
        <div className="ww-wrap">
          <div className="ww-hero" style={{ marginTop: 30 }}>
            <h1 className="ww-title">This gift kit link looks broken.</h1>
            <button type="button" className="ww-surprise" onClick={() => navigate('/whimsy')}>
              Build your own Whimsy Week →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ww-page">
      <Nav />
      <div className="ww-wrap">
        <div className="ww-hero">
          <NovaSprite look="pink" h={56} title="Nova" />
          <p className="ww-item-kicker" style={{ marginTop: 8 }}>A WHIMSY WEEK GIFT KIT</p>
          <h1 className="ww-title">Seven days, made with care.</h1>
          <p className="ww-sub">
            Someone built this with Nova and sent it your way — a week of things to cook,
            try, and share. Take what you like.
          </p>
        </div>

        <div className="ww-days" style={{ marginTop: 18 }}>
          {plan.days.map((day) => (
            <div className="ww-day" key={day.dayIndex}>
              <div className="ww-day-head">
                <span className="ww-day-dow">{dowLabel(day.dateISO)}</span>
                <span className="ww-day-theme">{day.theme}</span>
              </div>
              <div className="ww-items">
                {day.items.map((item, i) => (
                  <div key={i} className={`ww-item${item.type === 'adventure' ? ' ww-adventure' : ''}${item.type === 'share' || item.type === 'giftkit' ? ' ww-shareitem' : ''}`}>
                    <span className="ww-item-kicker">{KICKER[item.type] || ''}</span>
                    {item.type === 'cook'
                      ? (
                        <>
                          <span className="ww-item-title">{item.recipe?.name}</span>
                          <span className="ww-item-meta">
                            {item.recipe?.country || 'Recipe'}{item.recipe?.time ? ` · ${item.recipe.time}m` : ''}
                          </span>
                        </>
                      )
                      : <span className="ww-item-text">{item.text || item.prompt}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="ww-surprise" style={{ marginTop: 22 }} onClick={() => navigate('/whimsy')}>
          Make your own Whimsy Week →
        </button>
      </div>
    </div>
  );
}
