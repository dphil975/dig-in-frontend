import { useState } from 'react';
import { FLAVORS, seedFlavorProfile } from '../../../lib/flavorProfile';
import { REGIONS } from '../../../lib/regions';
import { resolveRestaurantHints } from '../../../lib/restaurantHints';
import { pushProfile } from '../../../lib/syncService';
import './FlavorQuizModal.css';

const FLAVOR_EXAMPLE = {
  spicy: 'chili, sriracha, gochujang', sweet: 'mango, chocolate, caramel',
  savory: 'miso, mushroom, parmesan', rich: 'butter, cream, coconut milk',
  light: 'citrus, herbs, salads',     earthy: 'lentils, root veg, truffle',
  smoky: 'barbecue, char, paprika',   tangy: 'pickles, kimchi, vinegar',
};
const REGION_EXAMPLE = {
  'east-asia': 'sushi, ramen, bibimbap', sea: 'pad thai, pho, satay',
  'south-asia': 'curry, biryani, dal',   mideast: 'hummus, kebab, falafel',
  europe: 'pasta, paella, schnitzel',    africa: 'tagine, jollof, injera',
  americas: 'tacos, burgers, empanadas', oceania: 'meat pie, poke, laksa',
};

const EATING_STYLES = ['Mostly cook at home', 'Mostly takeout / delivery', 'A mix of both'];
const BREAKFAST_TIMES = ['Early (6–8am)', 'Mid-morning (8–10am)', 'I usually skip breakfast'];
const LUNCH_TIMES = ['Midday (11am–1pm)', 'Afternoon (1–3pm)', 'I usually skip lunch'];
const DINNER_TIMES = ['Early (5–7pm)', 'Evening (7–9pm)', 'Late (9pm+)'];
const SNACK_HABITS = ['Rarely', 'Afternoon snacker', 'Late-night snacker', 'Anytime'];
const DESSERT_HABITS = ['Never', 'Sometimes', 'Every meal if I can'];
const ADVENTURE_LEVELS = ['Yes — surprise me', 'Sometimes', 'No, keep it classic'];

const TOTAL_STEPS = 10;

export default function FlavorQuizModal({ onComplete, onSkip }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    eatingStyle: null, breakfastTime: null, lunchTime: null, dinnerTime: null,
    snackHabit: null, dessertHabit: null, regions: [], flavors: [],
    restaurants: '', adventure: null,
  });

  function set(field, value) { setAnswers(a => ({ ...a, [field]: value })); }
  function toggleIn(field, value) {
    setAnswers(a => ({
      ...a,
      [field]: a[field].includes(value) ? a[field].filter(v => v !== value) : [...a[field], value],
    }));
  }

  function finish() {
    const restaurantList = answers.restaurants.split(',').map(s => s.trim()).filter(Boolean);
    const hints = resolveRestaurantHints(restaurantList);
    const allFlavors = [...new Set([...answers.flavors, ...hints.flavors])];

    seedFlavorProfile(allFlavors);

    try {
      localStorage.setItem('dig_in_meal_times', JSON.stringify({
        breakfast: answers.breakfastTime, lunch: answers.lunchTime, dinner: answers.dinnerTime,
        snack: answers.snackHabit, dessert: answers.dessertHabit,
      }));
      localStorage.setItem('dig_in_style_prefs', JSON.stringify({
        adventure: answers.adventure, styles: [...hints.styles],
      }));
      localStorage.setItem('dig_in_fave_restaurants', JSON.stringify(restaurantList));
      localStorage.setItem('dig_in_flavor_quiz_done', 'true');
    } catch {}

    pushProfile({ flavor_quiz: { ...answers, restaurants: restaurantList } });
    onComplete();
  }

  function skip() {
    try { localStorage.setItem('dig_in_flavor_quiz_done', 'true'); } catch {}
    onSkip();
  }

  const canNext = {
    1: !!answers.eatingStyle, 2: !!answers.breakfastTime, 3: !!answers.lunchTime,
    4: !!answers.dinnerTime, 5: !!answers.snackHabit, 6: !!answers.dessertHabit,
    7: answers.regions.length > 0, 8: answers.flavors.length > 0,
    9: true, 10: !!answers.adventure,
  }[step];

  return (
    <div className="fq-overlay">
      <div className="fq-card">
        <div className="fq-top">
          <span className="fq-step-count">QUESTION {step} / {TOTAL_STEPS}</span>
          <button className="fq-skip" onClick={skip}>Skip for now →</button>
        </div>
        <div className="fq-progress"><div className="fq-progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} /></div>

        {step === 1 && (
          <FqScreen title="How do you usually eat?">
            {EATING_STYLES.map(o => (
              <FqOption key={o} label={o} active={answers.eatingStyle === o} onClick={() => set('eatingStyle', o)} />
            ))}
          </FqScreen>
        )}
        {step === 2 && (
          <FqScreen title="What time do you usually eat breakfast?">
            {BREAKFAST_TIMES.map(o => (
              <FqOption key={o} label={o} active={answers.breakfastTime === o} onClick={() => set('breakfastTime', o)} />
            ))}
          </FqScreen>
        )}
        {step === 3 && (
          <FqScreen title="What time do you usually eat lunch?">
            {LUNCH_TIMES.map(o => (
              <FqOption key={o} label={o} active={answers.lunchTime === o} onClick={() => set('lunchTime', o)} />
            ))}
          </FqScreen>
        )}
        {step === 4 && (
          <FqScreen title="What time do you usually eat dinner?">
            {DINNER_TIMES.map(o => (
              <FqOption key={o} label={o} active={answers.dinnerTime === o} onClick={() => set('dinnerTime', o)} />
            ))}
          </FqScreen>
        )}
        {step === 5 && (
          <FqScreen title="Do you snack between meals?">
            {SNACK_HABITS.map(o => (
              <FqOption key={o} label={o} active={answers.snackHabit === o} onClick={() => set('snackHabit', o)} />
            ))}
          </FqScreen>
        )}
        {step === 6 && (
          <FqScreen title="How often do you have dessert?">
            {DESSERT_HABITS.map(o => (
              <FqOption key={o} label={o} active={answers.dessertHabit === o} onClick={() => set('dessertHabit', o)} />
            ))}
          </FqScreen>
        )}
        {step === 7 && (
          <FqScreen title="Which regions' food do you eat most?" hint="Pick as many as you like.">
            <div className="fq-grid">
              {REGIONS.map(r => (
                <FqOption
                  key={r.id}
                  label={r.label} sublabel={REGION_EXAMPLE[r.id]}
                  active={answers.regions.includes(r.id)}
                  onClick={() => toggleIn('regions', r.id)}
                />
              ))}
            </div>
          </FqScreen>
        )}
        {step === 8 && (
          <FqScreen title="Which flavors do you gravitate toward?" hint="Pick as many as you like.">
            <div className="fq-grid">
              {FLAVORS.map(f => (
                <FqOption
                  key={f}
                  label={f.toUpperCase()} sublabel={FLAVOR_EXAMPLE[f]}
                  active={answers.flavors.includes(f)}
                  onClick={() => toggleIn('flavors', f)}
                />
              ))}
            </div>
          </FqScreen>
        )}
        {step === 9 && (
          <FqScreen title="Any restaurants you eat at a lot?" hint="e.g. Nobu, Joe's Pizza — comma-separated. We'll match dishes to your usual order.">
            <input
              className="fq-text-input"
              type="text"
              placeholder="Nobu, Momofuku, ..."
              value={answers.restaurants}
              onChange={e => set('restaurants', e.target.value)}
            />
          </FqScreen>
        )}
        {step === 10 && (
          <FqScreen title="Would you try a fusion or deconstructed spin on your favorites?">
            {ADVENTURE_LEVELS.map(o => (
              <FqOption key={o} label={o} active={answers.adventure === o} onClick={() => set('adventure', o)} />
            ))}
          </FqScreen>
        )}

        <div className="fq-nav-row">
          <button className="fq-btn-back" disabled={step === 1} onClick={() => setStep(s => s - 1)}>← Back</button>
          {step < TOTAL_STEPS ? (
            <button className="fq-btn" disabled={!canNext} onClick={() => setStep(s => s + 1)}>Next →</button>
          ) : (
            <button className="fq-btn fq-btn-finish" disabled={!canNext} onClick={finish}>Find My Flavor</button>
          )}
        </div>
      </div>
    </div>
  );
}

function FqScreen({ title, hint, children }) {
  return (
    <div className="fq-screen">
      <h2 className="fq-title">{title}</h2>
      {hint && <p className="fq-hint">{hint}</p>}
      <div className="fq-options">{children}</div>
    </div>
  );
}

function FqOption({ label, sublabel, active, onClick }) {
  return (
    <button className={`fq-option${active ? ' active' : ''}`} onClick={onClick}>
      <span className="fq-option-text">
        <span className="fq-option-label">{label}</span>
        {sublabel && <span className="fq-option-sublabel">{sublabel}</span>}
      </span>
    </button>
  );
}
