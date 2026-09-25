import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import { loadRecipeBooks } from '../../../../lib/recipeBooks';
import {
  OCCASIONS, buildMenu, availableThemes, COURSE_LABEL, buildPrepTimeline,
  regionIdForTheme, saveHostedTheme, loadLastHostedTheme, clearHostedTheme,
  hostingBonusRecipes, buildPracticeTimeline, loadPracticeLog, markPracticed, isPracticed,
} from '../../../../lib/occasions';
import { getUserTier, setUserTier, TIERS, TIER_NAME } from '../../../../lib/tierBudget';
import './Occasions.css';

/* Occasions — cook for a reason. Pick a moment (date night, or hosting —
   the deeper one), and we build a full menu priced for your income tier,
   next to what that night costs eaten out.

   Hosting is treated as its own skill, not just a bigger date night:
   - A real guest-count toggle, capped at 20.
   - A theme picker drawn from the app's real 8-region system, so "Arabian
     Night" (Middle East) is an actual, meaningful choice — not a keyword
     guess. That needs the full 575-recipe corpus (real country/cuisine
     tags), not just the small bundled static set, so this page loads it.
   - A real prep timeline: make-ahead vs. day-of, the core lesson every
     host eventually learns.
   - Theme MEMORY: committing to host saves the theme (lib/occasions.js's
     saveHostedTheme), which recipeRecommender.js's scoreRecipe() then reads
     to keep nudging recommendations toward that region afterward — hosting
     an Arabian Night keeps surfacing more Middle Eastern dishes elsewhere
     in the app, not just on this page. */

export default function Occasions({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [occasion, setOccasion] = useState('host');
  const [headcount, setHeadcount] = useState(OCCASIONS['host'].defaultCount);
  const [tier, setTier] = useState(getUserTier);
  const [seed, setSeed] = useState(0);
  const [hostedTheme, setHostedTheme] = useState(loadLastHostedTheme);
  const [justSaved, setJustSaved] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [practice, setPractice] = useState(null);
  const [practiceLog, setPracticeLog] = useState(loadPracticeLog);
  const [expandedPractice, setExpandedPractice] = useState(null);

  useEffect(() => {
    let alive = true;
    loadRecipeBooks().then(pool => { if (alive) { setRecipes(pool); setRecipesLoading(false); } });
    return () => { alive = false; };
  }, []);

  const themes = useMemo(() => (recipes.length ? availableThemes(recipes) : []), [recipes]);
  const [theme, setTheme] = useState(null);

  // Once themes are known, default to whatever was last actually hosted —
  // the memory this whole feature is built around — else the top theme.
  useEffect(() => {
    if (!themes.length || theme) return;
    const remembered = hostedTheme?.theme;
    setTheme(themes.includes(remembered) ? remembered : themes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themes]);

  const cfg = OCCASIONS[occasion];
  const menu = useMemo(
    () => buildMenu({ recipes, occasion, headcount, theme, tier, seed }),
    [recipes, occasion, headcount, theme, tier, seed],
  );
  const timeline = useMemo(
    () => (occasion === 'host' ? buildPrepTimeline(menu, eventDate || null) : null),
    [occasion, menu, eventDate],
  );

  // Give repeated courses (two mains, on a host menu) a real "Main 1" /
  // "Main 2" label instead of two identical "Main" tags.
  const displayCourses = useMemo(() => {
    const mainTotal = menu.courses.filter(c => c.course === 'main').length;
    let mainIdx = 0;
    return menu.courses.map(c => {
      if (c.course === 'main' && mainTotal > 1) {
        mainIdx += 1;
        return { ...c, tag: `Main ${mainIdx}` };
      }
      return { ...c, tag: COURSE_LABEL[c.course] || c.course };
    });
  }, [menu]);

  // "Not just food for the party" — other recipes the same shopping list
  // already covers (extras, backups, next-day leftovers-remixed meals).
  const bonus = useMemo(
    () => (occasion === 'host' && recipes.length && menu.courses.length ? hostingBonusRecipes(menu, recipes) : null),
    [occasion, recipes, menu],
  );

  // Practice timeline is request-only (the button below), and goes stale the
  // moment the menu itself changes (remix, new theme, new guest count) — so
  // it resets rather than silently showing a practice plan for a menu that
  // isn't the one on screen anymore.
  useEffect(() => { setPractice(null); }, [menu]);
  const practicedCount = useMemo(
    () => (practice?.sessions || []).filter(s => isPracticed(s.recipe.id ?? s.recipe.name, practiceLog)).length,
    [practice, practiceLog],
  );
  const practicedPct = practice?.sessions?.length ? Math.round((practicedCount / practice.sessions.length) * 100) : 0;

  function chooseOccasion(key) {
    setOccasion(key);
    setHeadcount(OCCASIONS[key].defaultCount);
    setSeed(0);
  }

  function pickTier(t) { setTier(t); setUserTier(t); }

  function cook(recipe) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  function commitToHosting() {
    if (!theme) return;
    const regionId = regionIdForTheme(theme);
    const record = saveHostedTheme(theme, regionId);
    setHostedTheme(record);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  }

  function forgetTheme() {
    clearHostedTheme();
    setHostedTheme(null);
  }

  function buildPractice() {
    setPractice(buildPracticeTimeline(menu, eventDate || null));
  }

  function markPracticeDone(key) {
    setPracticeLog(markPracticed(key));
  }

  function cookPractice(session) {
    cook({
      ...session.recipe,
      name: `${session.recipe.name} (Practice — 1 serving)`,
      servings: 1,
      ingredients: session.scaledIngredients.map(s => s.text),
    });
  }

  return (
    <div className="occ-page">
      {!embedded && <Nav />}
      <div className="occ-wrap">
        {!embedded && <button className="occ-back" onClick={() => navigate(-1)}>← BACK</button>}

        <header className="occ-head">
          <h1 className="occ-title">COOK FOR A REASON</h1>
          <p className="occ-sub">
            A night out you make instead. Pick the occasion — we'll build the whole
            menu, priced for your budget, against what you'd pay at a restaurant.
          </p>
        </header>

        {/* Occasion picker */}
        <div className="occ-types">
          {Object.entries(OCCASIONS).map(([key, o]) => (
            <button
              key={key}
              className={`occ-type${occasion === key ? ' active' : ''}`}
              onClick={() => chooseOccasion(key)}
            >
              <span className="occ-type-emoji">{o.emoji}</span>
              <span className="occ-type-label">{o.label}</span>
              <span className="occ-type-blurb">{o.blurb}</span>
            </button>
          ))}
        </div>

        {/* "Hosting is an art form" — the education piece */}
        {occasion === 'host' && (
          <section className="occ-art">
            <div className="occ-art-title">HOSTING IS AN ART FORM</div>
            <p className="occ-art-body">
              A good host isn't the one with the fanciest dish — it's the one who isn't still cooking when
              the doorbell rings. Most people underbuild the menu (one main, no starter, no choice) and
              underbuild the timeline (everything happens the day of). Set a real event date below and the
              prep timeline turns into an actual calendar — when to shop shelf-stable, when to prep ahead,
              when to cook. The menu itself gets a starter and two mains, not just one dish, so there's
              real variety on the table.
            </p>
          </section>
        )}

        {/* Controls */}
        <div className="occ-controls">
          <div className="occ-control">
            <span className="occ-control-label">Budget</span>
            <div className="occ-tiers">
              {TIERS.map(t => (
                <button key={t} className={`occ-tier occ-tier-${t}${tier === t ? ' active' : ''}`} onClick={() => pickTier(t)}>
                  {TIER_NAME[t]}
                </button>
              ))}
            </div>
          </div>

          {!cfg.fixedCount && (
            <div className="occ-control">
              <span className="occ-control-label">Guests {cfg.maxCount ? `(up to ${cfg.maxCount})` : ''}</span>
              <div className="occ-count">
                <button onClick={() => setHeadcount(n => Math.max(1, n - 1))} aria-label="fewer">–</button>
                <span className="occ-count-num">{headcount}</span>
                <button onClick={() => setHeadcount(n => Math.min(cfg.maxCount || 40, n + 1))} aria-label="more">+</button>
              </div>
            </div>
          )}

          {occasion === 'host' && (
            <div className="occ-control">
              <span className="occ-control-label">Event date</span>
              <input
                type="date"
                className="occ-date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
          )}

          {occasion === 'host' && themes.length > 0 && (
            <div className="occ-control occ-control-theme">
              <span className="occ-control-label">Theme</span>
              <div className="occ-themes">
                {themes.map(th => (
                  <button key={th} className={`occ-theme${theme === th ? ' active' : ''}`} onClick={() => setTheme(th)}>
                    {th}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className="occ-shuffle" onClick={() => setSeed(s => s + 1)}>↻ Remix menu</button>
        </div>

        {/* Theme memory */}
        {occasion === 'host' && (
          <section className="occ-memory">
            {hostedTheme?.theme ? (
              <>
                <span className="occ-memory-text">
                  Last hosted: <strong>{hostedTheme.theme} Night</strong> — recipes from there keep getting a nudge across the app.
                </span>
                <button className="occ-memory-forget" onClick={forgetTheme}>Forget this theme</button>
              </>
            ) : (
              <span className="occ-memory-text">No theme remembered yet — commit to one below and Dig In will keep leaning into it.</span>
            )}
            <button className="occ-memory-save" onClick={commitToHosting} disabled={!theme}>
              {justSaved ? '✓ Saved' : `🎉 I'm hosting ${theme || ''} Night`}
            </button>
          </section>
        )}

        {recipesLoading ? (
          <div className="occ-loading">Loading the recipe library…</div>
        ) : (
          <>
            {/* The menu */}
            <section className="occ-menu">
              <div className="occ-menu-head">
                <span className="occ-menu-title">
                  {cfg.emoji} {cfg.label}{menu.theme ? ` · ${menu.theme}` : ''} · for {menu.headcount}
                </span>
              </div>

              {displayCourses.length === 0 ? (
                <div className="occ-empty">No dishes fit this theme yet — try another.</div>
              ) : (
                <div className="occ-courses">
                  {displayCourses.map(({ course, tag, recipe, perServing }, i) => (
                    <div className="occ-course" key={course + '-' + i + '-' + (recipe.id ?? recipe.name)}>
                      <div className="occ-course-tag">{tag}</div>
                      <div className="occ-course-main">
                        <div className="occ-course-name">{recipe.name}</div>
                        <div className="occ-course-meta">
                          {recipe.difficulty && <span>{recipe.difficulty}</span>}
                          {(recipe.prepTime || recipe.cookTime) && <span>{(recipe.prepTime || 0) + (recipe.cookTime || 0)} min</span>}
                          <span className="occ-course-price">${perServing.toFixed(2)}/person</span>
                        </div>
                      </div>
                      <button className="occ-course-cook" onClick={() => cook(recipe)}>COOK →</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* The pitch: cost vs eating out */}
            {menu.courses.length > 0 && (
              <section className="occ-pitch">
                <div className="occ-pitch-cols">
                  <div className="occ-pitch-block">
                    <div className="occ-pitch-num">${menu.groupTotal.toFixed(2)}</div>
                    <div className="occ-pitch-label">to cook it all<br />(${menu.menuPerPerson.toFixed(2)}/person)</div>
                  </div>
                  <div className="occ-pitch-vs">vs</div>
                  <div className="occ-pitch-block occ-pitch-out">
                    <div className="occ-pitch-num">${menu.dineOutGroup.toFixed(0)}</div>
                    <div className="occ-pitch-label">out for {menu.headcount}<br />(${menu.dineOutPerPerson}/person)</div>
                  </div>
                </div>
                {menu.savingsGroup > 0 && (
                  <div className="occ-pitch-save">
                    You keep <strong>${menu.savingsGroup.toFixed(2)}</strong> and still host the whole night. That's the opportunity.
                  </div>
                )}
              </section>
            )}

            {/* Practice timeline — test-run new dishes before the real thing,
                scaled to a single serving so a "trying it out" batch never
                turns into wasted party-sized leftovers */}
            {occasion === 'host' && menu.courses.length > 0 && (
              <section className="occ-practice">
                <div className="occ-practice-head">
                  <div className="occ-practice-title">TEST-RUN YOUR MENU</div>
                  {!practice && (
                    <button type="button" className="occ-practice-build" onClick={buildPractice}>
                      🧪 Build my practice timeline
                    </button>
                  )}
                </div>
                <p className="occ-practice-blurb">
                  Hosting is a bit of a lost art — the gap between a smooth night and a stressed one is
                  usually just practice. Nobody wants to cook a full batch of a recipe just to "try it," so
                  every practice run here is scaled down to a single serving — a real taste-test, not food
                  you're stuck eating for a week or throwing out.
                </p>

                {practice?.allFamiliar && (
                  <p className="occ-practice-none">You've already made every dish on this menu before — no practice runs needed.</p>
                )}

                {practice && !practice.allFamiliar && practice.sessions.length > 0 && (
                  <>
                    {practice.tight && (
                      <p className="occ-practice-tight">
                        Your event date is close — there isn't much runway. Plan to practice a couple of these back-to-back.
                      </p>
                    )}
                    <div className="occ-practice-progress">
                      <div className="occ-practice-progress-track">
                        <div className="occ-practice-progress-fill" style={{ width: `${practicedPct}%` }} />
                      </div>
                      <span className="occ-practice-progress-label">{practicedCount} of {practice.sessions.length} practiced</span>
                    </div>
                    <div className="occ-practice-list">
                      {practice.sessions.map(s => {
                        const key = s.recipe.id ?? s.recipe.name;
                        const done = isPracticed(key, practiceLog);
                        const open = expandedPractice === key;
                        return (
                          <div className={`occ-practice-card${done ? ' done' : ''}`} key={key}>
                            <div className="occ-practice-card-top">
                              <span className="occ-practice-when">{s.when}</span>
                              {done && <span className="occ-practice-done-badge">✓ PRACTICED</span>}
                            </div>
                            <div className="occ-practice-name">{s.recipe.name}</div>
                            <p className="occ-practice-reason">{s.reason}</p>
                            <div className="occ-practice-scale-note">
                              Scaled to 1 serving — normally serves {s.originalServings}
                            </div>
                            <button
                              type="button"
                              className="occ-practice-toggle"
                              onClick={() => setExpandedPractice(o => (o === key ? null : key))}
                            >{open ? 'Hide scaled ingredients' : 'See scaled ingredients'}</button>
                            {open && (
                              <ul className="occ-practice-ings">
                                {s.scaledIngredients.map((ing, j) => <li key={j}>{ing.text}</li>)}
                              </ul>
                            )}
                            <div className="occ-practice-actions">
                              <button type="button" className="occ-practice-cook" onClick={() => cookPractice(s)}>
                                Cook this practice run →
                              </button>
                              <button
                                type="button"
                                className="occ-practice-mark"
                                onClick={() => markPracticeDone(key)}
                                disabled={done}
                              >{done ? '✓ Marked practiced' : 'Mark as practiced'}</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* Prep timeline — the actual "how to plan it" education */}
            {timeline && menu.courses.length > 0 && (
              <section className="occ-timeline">
                <div className="occ-timeline-title">WHEN TO START PREPPING</div>
                {!eventDate && (
                  <p className="occ-timeline-hint">Set a date above and this turns into a real day-by-day calendar.</p>
                )}
                <div className="occ-timeline-list">
                  {timeline.map((step, i) => (
                    <div className="occ-timeline-step" key={i}>
                      <div className="occ-timeline-when">
                        {step.when}
                        {step.date && <span className="occ-timeline-date">{step.date}</span>}
                      </div>
                      <div className="occ-timeline-body">
                        <div className="occ-timeline-step-title">{step.title}</div>
                        <ul className="occ-timeline-tasks">
                          {step.tasks.map((task, j) => <li key={j}>{task}</li>)}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* One combined shopping list */}
            {menu.shopping.length > 0 && (
              <section className="occ-shop">
                <div className="occ-shop-title">ONE SHOPPING LIST · {menu.shopping.length} items</div>
                <div className="occ-shop-items">
                  {menu.shopping.map((ing, i) => <span className="occ-shop-item" key={i}>{ing}</span>)}
                </div>
                <button className="occ-shop-find" onClick={() => navigate('/')}>Find these on the store map →</button>
              </section>
            )}

            {/* "Not just food for the party" — the same haul covers more */}
            {occasion === 'host' && bonus && bonus.recipes.length > 0 && (
              <section className="occ-bonus">
                <div className="occ-bonus-title">
                  NOT JUST FOOD FOR THE PARTY — {bonus.total} MORE RECIPE{bonus.total === 1 ? '' : 'S'} FROM THIS SAME HAUL
                </div>
                <p className="occ-bonus-sub">
                  This shopping list already covers these too — backups for picky eaters, or next-day
                  leftovers remixed into something new instead of the same reheated plate.
                </p>
                <div className="occ-bonus-grid">
                  {bonus.recipes.map(r => (
                    <button className="occ-bonus-card" key={r.id ?? r.name} onClick={() => cook(r)}>
                      <div className="occ-bonus-name">{r.name}</div>
                      {r.recipe_type && <div className="occ-bonus-type">{r.recipe_type}</div>}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
