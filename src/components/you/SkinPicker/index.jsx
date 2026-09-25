import { useState } from 'react';
import {
  SKINS, PREF_OPTIONS, getSkinId, setSkin, getPrefs, setPref, resetDisplay,
} from '../../../lib/appSkins';
import CashStack from '../../pantry/CashStack';
import './SkinPicker.css';

/* SkinPicker — choose how the app presents itself.

   Delta's model, and the reason it works: a skin is data, so switching is
   instant, reversible, and can't break anything. Nothing here changes what a
   number means — only how it's drawn.

   TWO SECTIONS, SPLIT ON PURPOSE:
   1. Skins — a look. Optional flavor. Plain "Paper" is the default and
      always will be, because plenty of people want no game at all and the
      brief was explicit that this is for people who want it.
   2. Reading & motion — contrast, motion, text size, spacing. These are NOT
      bundled into a skin and are available inside every one. Making an
      "accessible theme" would force someone to give up the look they like in
      order to read comfortably, and would quietly mark that theme as the
      disability option. Nobody should have to pick the sad one to be able to
      use the app.

   The money toggle sits with the reading options rather than the skins,
   because it's a comprehension aid before it's an aesthetic. It ships with a
   live preview — you shouldn't have to commit to a setting to find out what
   it does. */

const PREVIEW_AMOUNT = 56.5;

export default function SkinPicker() {
  const [skinId, setSkinId] = useState(getSkinId);
  const [prefs, setPrefs] = useState(getPrefs);

  function chooseSkin(id) { setSkin(id); setSkinId(id); setPrefs(getPrefs()); }
  function choosePref(key, value) { setPrefs(setPref(key, value)); }

  return (
    <section className="skp">
      <header className="skp-head">
        <h2 className="skp-title">MAKE IT YOURS</h2>
        <p className="skp-sub">
          Change how the app looks and reads. It never changes your numbers —
          only how they're drawn. Switch as often as you like.
        </p>
      </header>

      <div className="skp-block">
        <h3 className="skp-h3">Skin</h3>
        <ul className="skp-skins">
          {SKINS.map(s => {
            const active = skinId === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={`skp-skin${active ? ' active' : ''}`}
                  aria-pressed={active}
                  onClick={() => chooseSkin(s.id)}
                  data-preview={s.id}
                >
                  <span className="skp-swatch" aria-hidden="true">
                    <span style={{ background: s.vars['--skin-accent'] }} />
                    <span style={{ background: s.vars['--skin-surface'] }} />
                    <span style={{ background: s.vars['--skin-ink'] }} />
                  </span>
                  <span className="skp-skin-body">
                    <span className="skp-skin-name">{s.name}</span>
                    <span className="skp-skin-blurb">{s.blurb}</span>
                    <span className="skp-skin-tag">{s.tagline}</span>
                  </span>
                  {active && <span className="skp-on" aria-hidden="true">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="skp-block">
        <h3 className="skp-h3">Money</h3>
        <p className="skp-note">
          Some people read <strong>$56.50</strong> and feel nothing. Bills you can count are
          harder to ignore — it's the same reason a physical wallet is easier to keep track of
          than a card.
        </p>
        <div className="skp-preview">
          <div className="skp-preview-half">
            <span className="skp-preview-label">Plain</span>
            <span className="skp-preview-num">${PREVIEW_AMOUNT.toFixed(2)}</span>
          </div>
          <div className="skp-preview-half">
            <span className="skp-preview-label">Countable</span>
            <CashStack amount={PREVIEW_AMOUNT} size="sm" />
          </div>
        </div>
        <div className="skp-opts">
          {PREF_OPTIONS.money.map(o => (
            <button
              key={String(o.id)}
              type="button"
              className={`skp-opt${prefs.money === o.id ? ' active' : ''}`}
              aria-pressed={prefs.money === o.id}
              onClick={() => choosePref('money', o.id)}
            >
              <span className="skp-opt-label">{o.label}</span>
              {o.hint && <span className="skp-opt-hint">{o.hint}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="skp-block">
        <h3 className="skp-h3">Reading &amp; motion</h3>
        <p className="skp-note">
          These work in every skin — you never have to give up a look you like to read
          comfortably.
        </p>
        {['contrast', 'textScale', 'spacing', 'motion'].map(key => (
          <div className="skp-row" key={key}>
            <div className="skp-opts">
              {PREF_OPTIONS[key].map(o => (
                <button
                  key={String(o.id)}
                  type="button"
                  className={`skp-opt${prefs[key] === o.id ? ' active' : ''}`}
                  aria-pressed={prefs[key] === o.id}
                  onClick={() => choosePref(key, o.id)}
                >
                  <span className="skp-opt-label">{o.label}</span>
                  {o.hint && <span className="skp-opt-hint">{o.hint}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="skp-reset"
        onClick={() => { resetDisplay(); setSkinId(getSkinId()); setPrefs(getPrefs()); }}
      >
        put everything back to default
      </button>
    </section>
  );
}
