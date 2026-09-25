import { useState, useEffect, useMemo } from 'react';
import Nav from '../../../components/shell/Nav';
import { getCookingStats } from '../../../services/saveService';
import { nextUpcoming, findEthnicStoresNearby } from '../../../lib/holidayCalendar';
import { formatHoursDisplay, parseOpenNow } from '../../../lib/storeHours';
import { STORE_COLORS, STORE_TYPE_LABELS } from '../../../data/storeData';
import { loadLocation } from '../../../services/geoService';
import PodcastRow from '../../../components/social/PodcastRow';
import './GlobalFood.css';

const COUNTRIES = [
  {
    id: 'italy', flag: '🇮🇹', name: 'Italy', cuisine: 'Italian Cuisine',
    dishes: ['Pasta', 'Pizza', 'Gelato'],
    details: { mustTry: 'Pasta alla carbonara, Pizza margherita', etiquette: 'No cappuccino after 11 AM', tip: "Look for 'Cucina Tipica' signs" },
    diy: { label: 'Make your own pasta sauce!', savings: 'Save $3.00', time: '10 minutes', shelf: 'Lasts 1 week' },
  },
  {
    id: 'japan', flag: '🇯🇵', name: 'Japan', cuisine: 'Japanese Cuisine',
    dishes: ['Sushi', 'Ramen', 'Tempura'],
    details: { mustTry: 'Sushi, Ramen, Tempura', etiquette: 'Slurping is acceptable', tip: "Look for 'Shokudo' for local dining" },
    diy: { label: 'Make your own soy sauce glaze!', savings: 'Save $2.50', time: '5 minutes', shelf: 'Lasts 2 weeks' },
  },
  {
    id: 'mexico', flag: '🇲🇽', name: 'Mexico', cuisine: 'Mexican Cuisine',
    dishes: ['Tacos', 'Mole', 'Tamales'],
    details: { mustTry: 'Tacos al pastor, Mole', etiquette: 'Eat tacos with your hands', tip: "Look for 'Comida Corrida' for lunch" },
    diy: { label: 'Make your own salsa!', savings: 'Save $2.00', time: '10 minutes', shelf: 'Lasts 1 week' },
  },
  {
    id: 'france', flag: '🇫🇷', name: 'France', cuisine: 'French Cuisine',
    dishes: ['Croissant', 'Coq au Vin', 'Crème Brûlée'],
    details: { mustTry: 'Coq au vin, fresh croissants', etiquette: 'Bread goes directly on the table, not a plate', tip: "Look for a 'Boulangerie' for the best bread" },
    diy: { label: 'Make your own vinaigrette!', savings: 'Save $2.00', time: '5 minutes', shelf: 'Lasts 2 weeks' },
  },
  {
    id: 'thailand', flag: '🇹🇭', name: 'Thailand', cuisine: 'Thai Cuisine',
    dishes: ['Pad Thai', 'Tom Yum', 'Mango Sticky Rice'],
    details: { mustTry: 'Pad Thai, Tom Yum soup', etiquette: 'Push food onto your spoon with a fork, not straight to your mouth', tip: "Order 'pet nit noy' (a little spicy) if you're not used to the heat" },
    diy: { label: 'Make your own Tom Yum paste!', savings: 'Save $3.50', time: '15 minutes', shelf: 'Lasts 3 weeks' },
  },
  {
    id: 'india', flag: '🇮🇳', name: 'India', cuisine: 'Indian Cuisine',
    dishes: ['Biryani', 'Butter Chicken', 'Naan'],
    details: { mustTry: 'Biryani, butter chicken with naan', etiquette: 'Eating with your right hand is traditional in many regions', tip: "Look for a 'Thali' for a full sampler plate" },
    diy: { label: 'Make your own garam masala blend!', savings: 'Save $4.00', time: '10 minutes', shelf: 'Lasts 6 months' },
  },
  {
    id: 'china', flag: '🇨🇳', name: 'China', cuisine: 'Chinese Cuisine',
    dishes: ['Dumplings', 'Fried Rice', 'Hot Pot'],
    details: { mustTry: 'Dumplings, hot pot', etiquette: "Don't stick chopsticks upright in rice — it echoes a funeral ritual", tip: 'Dim sum is best shared family-style' },
    diy: { label: 'Make your own dumpling wrappers!', savings: 'Save $3.00', time: '20 minutes', shelf: 'Lasts 3 days refrigerated' },
  },
  {
    id: 'greece', flag: '🇬🇷', name: 'Greece', cuisine: 'Greek Cuisine',
    dishes: ['Moussaka', 'Gyros', 'Baklava'],
    details: { mustTry: 'Moussaka, souvlaki', etiquette: 'Meals are meant to be long and social — no rushing', tip: "Look for a 'Taverna' for home-style cooking" },
    diy: { label: 'Make your own tzatziki!', savings: 'Save $2.50', time: '10 minutes', shelf: 'Lasts 1 week' },
  },
  {
    id: 'ethiopia', flag: '🇪🇹', name: 'Ethiopia', cuisine: 'Ethiopian Cuisine',
    dishes: ['Injera', 'Doro Wat', 'Misir Wat'],
    details: { mustTry: 'Doro wat with injera', etiquette: 'Eaten by hand, scooping stews with injera — no utensils', tip: "'Gursha' — feeding a bite to someone at the table — is a sign of friendship" },
    diy: { label: 'Make your own berbere spice blend!', savings: 'Save $5.00', time: '10 minutes', shelf: 'Lasts 6 months' },
  },
  {
    id: 'lebanon', flag: '🇱🇧', name: 'Lebanon', cuisine: 'Lebanese Cuisine',
    dishes: ['Hummus', 'Tabbouleh', 'Falafel'],
    details: { mustTry: 'Mezze spread — hummus, tabbouleh, falafel', etiquette: 'Mezze is meant for sharing across the whole table', tip: "Look for a 'Man'oushe' bakery for breakfast flatbread" },
    diy: { label: 'Make your own hummus!', savings: 'Save $2.00', time: '10 minutes', shelf: 'Lasts 1 week' },
  },
  {
    id: 'vietnam', flag: '🇻🇳', name: 'Vietnam', cuisine: 'Vietnamese Cuisine',
    dishes: ['Pho', 'Banh Mi', 'Spring Rolls'],
    details: { mustTry: 'Pho, banh mi', etiquette: "Slurping noodles is normal — it's not considered rude", tip: 'Add herbs and lime to pho yourself at the table' },
    diy: { label: 'Make your own nuoc cham dipping sauce!', savings: 'Save $1.50', time: '5 minutes', shelf: 'Lasts 2 weeks' },
  },
  {
    id: 'korea', flag: '🇰🇷', name: 'Korea', cuisine: 'Korean Cuisine',
    dishes: ['Kimchi', 'Bibimbap', 'Bulgogi'],
    details: { mustTry: 'Bibimbap, Korean BBQ', etiquette: 'Wait for the eldest at the table to start eating first', tip: 'Banchan (side dishes) are often free refills' },
    diy: { label: 'Make your own quick kimchi!', savings: 'Save $4.00', time: '30 minutes', shelf: 'Lasts 2+ weeks' },
  },
  {
    id: 'peru', flag: '🇵🇪', name: 'Peru', cuisine: 'Peruvian Cuisine',
    dishes: ['Ceviche', 'Lomo Saltado', 'Aji de Gallina'],
    details: { mustTry: 'Ceviche, lomo saltado', etiquette: 'Ceviche is traditionally a lunch dish, not dinner', tip: "Look for a 'Cevicheria' for the freshest fish" },
    diy: { label: 'Make your own aji amarillo paste!', savings: 'Save $3.00', time: '10 minutes', shelf: 'Lasts 1 month' },
  },
  {
    id: 'morocco', flag: '🇲🇦', name: 'Morocco', cuisine: 'Moroccan Cuisine',
    dishes: ['Tagine', 'Couscous', 'Mint Tea'],
    details: { mustTry: 'Lamb tagine, couscous', etiquette: 'Mint tea is poured from height as a sign of hospitality', tip: "Look for a 'Riad' restaurant for a traditional courtyard setting" },
    diy: { label: 'Make your own ras el hanout spice blend!', savings: 'Save $4.50', time: '10 minutes', shelf: 'Lasts 6 months' },
  },
  {
    id: 'israel', flag: '🇮🇱', name: 'Israel', cuisine: 'Israeli Cuisine',
    dishes: ['Shakshuka', 'Falafel', 'Sabich'],
    details: { mustTry: 'Shakshuka, falafel', etiquette: 'Hummus is often shared as a starter with warm pita', tip: "Friday markets ('shuk') are the best place to try everything at once" },
    diy: { label: 'Make your own shakshuka sauce base!', savings: 'Save $2.00', time: '15 minutes', shelf: 'Lasts 4 days refrigerated' },
  },
  {
    id: 'jamaica', flag: '🇯🇲', name: 'Jamaica', cuisine: 'Jamaican Cuisine',
    dishes: ['Jerk Chicken', 'Ackee & Saltfish', 'Rice & Peas'],
    details: { mustTry: 'Jerk chicken, rice and peas', etiquette: 'Meals are often eaten slowly, with music playing', tip: "'Rice and peas' actually means rice and kidney beans" },
    diy: { label: 'Make your own jerk marinade!', savings: 'Save $3.50', time: '10 minutes', shelf: 'Lasts 2 weeks' },
  },
];

// Mirrors saveService.js's logCookedRecipe() unlock thresholds exactly, so
// the lock state shown here is the real gamification state, not a stub.
const UNLOCK_THRESHOLDS = [
  ['france', 3], ['china', 6], ['india', 9], ['thailand', 12], ['greece', 15],
];

const CRAVING_SUGGESTIONS = {
  stressed: 'Try deep breathing before eating. Your body might need calm, not food.',
  bored: 'Drink water first. Sometimes we eat out of boredom, not hunger.',
  happy: 'Enjoy the moment! Share your food with someone.',
  sad: 'Nourish yourself. Comfort food is okay in moderation.',
  tired: 'Your body needs rest. A small snack with protein can help.',
};

export default function GlobalFood({ embedded = false } = {}) {
  const [openCountry, setOpenCountry] = useState(null);
  const [cravingType, setCravingType] = useState('savory');
  const [cravingEmotion, setCravingEmotion] = useState('neutral');
  const [cravingFood, setCravingFood] = useState('');
  const [cravingResult, setCravingResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [holiday, setHoliday] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);

  const notifSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState(notifSupported ? Notification.permission : 'unsupported');

  useEffect(() => {
    setStats(getCookingStats());
    setHoliday(nextUpcoming());
  }, []);

  useEffect(() => {
    if (!holiday?.ethnicStoreTypes?.length) { setNearbyStores([]); return; }
    let alive = true;
    setStoresLoading(true);
    findEthnicStoresNearby(holiday.ethnicStoreTypes).then(list => {
      if (alive) { setNearbyStores(list); setStoresLoading(false); }
    });
    return () => { alive = false; };
  }, [holiday]);

  // Schedule the "3 days before" reminder if permission is already granted
  // and it falls within a window the tab could plausibly still be open for.
  // Same honest caveat as Nudges: this needs the tab open, there's no
  // background push backend behind it.
  useEffect(() => {
    if (permission !== 'granted' || !holiday?.dateISO) return;
    const target = new Date(holiday.dateISO + 'T09:00:00');
    target.setDate(target.getDate() - 3);
    const ms = target.getTime() - Date.now();
    if (ms <= 0 || ms > 1000 * 60 * 60 * 24 * 21) return;
    const t = setTimeout(() => {
      try { new Notification(`${holiday.label} in 3 days`, { body: holiday.blurb }); } catch { /* ignore */ }
    }, ms);
    return () => clearTimeout(t);
  }, [permission, holiday]);

  const unlockedIds = useMemo(() => {
    const cooked = stats?.totalCooked || 0;
    return new Set(UNLOCK_THRESHOLDS.filter(([, n]) => cooked >= n).map(([id]) => id));
  }, [stats]);

  function gateFor(countryId) {
    return UNLOCK_THRESHOLDS.find(([id]) => id === countryId)?.[1] || null;
  }
  function isLocked(countryId) {
    const gate = gateFor(countryId);
    return gate != null && !unlockedIds.has(countryId);
  }

  function toggleCountry(id) {
    if (isLocked(id)) return;
    setOpenCountry(prev => (prev === id ? null : id));
  }

  function openCountryById(id) {
    setOpenCountry(id);
    document.getElementById(`country-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function trackCraving() {
    const food = cravingFood || 'something delicious';
    const suggestion = CRAVING_SUGGESTIONS[cravingEmotion] || "Be mindful of why you're eating.";
    setCravingResult({ type: cravingType, emotion: cravingEmotion, food, suggestion });
  }

  async function enableHolidayReminders() {
    if (!notifSupported) return;
    const res = await Notification.requestPermission();
    setPermission(res);
    if (res === 'granted') {
      try { new Notification('Holiday reminders are on', { body: "I'll ping you a few days before the next one — keep this tab open." }); } catch { /* ignore */ }
    }
  }

  const cookedCount = stats?.totalCooked || 0;

  return (
    <div className="global-page">
      {!embedded && <Nav />}

      <div className="global-container">
        <div className="global-header">
          <h1>Global Food Explorer</h1>
          <p>Discover food cultures, learn to cook local dishes, and shop smarter</p>
        </div>

        {/* Upcoming holiday banner */}
        {holiday && (
          <section className="global-holiday">
            <div className="global-holiday-head">
              <span className="global-holiday-badge">
                {holiday.daysAway === 0 ? 'TODAY' : `IN ${holiday.daysAway} DAY${holiday.daysAway === 1 ? '' : 'S'}`}
              </span>
              <span className="global-holiday-title">{holiday.label}</span>
            </div>
            <p className="global-holiday-blurb">{holiday.blurb}</p>
            {holiday.dateCaveat && <p className="global-holiday-caveat">{holiday.dateCaveat}</p>}

            {holiday.countryIds.length > 0 && (
              <div className="global-holiday-links">
                {holiday.countryIds.map(cid => {
                  const c = COUNTRIES.find(x => x.id === cid);
                  return c ? (
                    <button key={cid} className="global-holiday-link" onClick={() => openCountryById(cid)}>
                      {c.flag} Explore {c.name}
                    </button>
                  ) : null;
                })}
              </div>
            )}

            {holiday.ethnicStoreTypes.length > 0 && (
              <div className="global-holiday-stores">
                <div className="global-holiday-stores-title">Stores near you for {holiday.label}</div>
                {storesLoading ? (
                  <p className="global-hint">Finding nearby stores…</p>
                ) : nearbyStores.length ? (
                  <div className="global-store-list">
                    {nearbyStores.map(s => {
                      const open = s.hours ? parseOpenNow(s.hours) : null;
                      return (
                        <div key={s.id} className="global-store-row">
                          <span className="global-store-dot" style={{ background: STORE_COLORS[s.type] }} />
                          <span className="global-store-name">{s.name}</span>
                          <span className="global-store-type">{STORE_TYPE_LABELS[s.type]}</span>
                          {open != null && (
                            <span className={`global-store-hours${open ? ' open' : ''}`}>
                              {open ? 'Open now' : formatHoursDisplay(s.hours)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="global-hint">
                    {loadLocation() ? 'No matching stores found nearby yet.' : 'Set your location on the Food Map to see nearby stores here.'}
                  </p>
                )}
              </div>
            )}

            {notifSupported && permission !== 'granted' && (
              <button className="global-holiday-notify" onClick={enableHolidayReminders}>
                🔔 Remind me 3 days before the next holiday
              </button>
            )}
          </section>
        )}

        {/* Country Grid */}
        <div className="country-grid">
          {COUNTRIES.map(country => {
            const locked = isLocked(country.id);
            const gate = gateFor(country.id);
            return (
              <div
                key={country.id}
                id={`country-${country.id}`}
                className={`country-card${locked ? ' locked' : ''}`}
                onClick={() => toggleCountry(country.id)}
              >
                <span className="country-flag">{locked ? '🔒' : country.flag}</span>
                <div className="country-name">{country.name}</div>
                <div className="country-cuisine">{country.cuisine}</div>

                {locked ? (
                  <div className="country-lock-hint">
                    Cook {gate} recipes to unlock ({cookedCount}/{gate})
                  </div>
                ) : (
                  <>
                    <div className="country-dishes">
                      {country.dishes.map(dish => (
                        <span key={dish} className="dish-tag">{dish}</span>
                      ))}
                    </div>
                    <div className={`country-details ${openCountry === country.id ? 'open' : ''}`}>
                      <ul>
                        <li><strong>Must try:</strong> {country.details.mustTry}</li>
                        <li><strong>Etiquette:</strong> {country.details.etiquette}</li>
                        <li><strong>Tip:</strong> {country.details.tip}</li>
                      </ul>
                      <div className="diy-condiment">
                        <strong>{country.diy.label}</strong><br />
                        <span className="savings">{country.diy.savings}</span> • {country.diy.time} • {country.diy.shelf}
                      </div>
                      {openCountry === country.id && <PodcastRow tags={[country.id]} />}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Craving Tracker */}
        <div className="craving-tracker">
          <h3>What are you craving?</h3>
          <div className="craving-input">
            <select value={cravingType} onChange={e => setCravingType(e.target.value)}>
              <option value="savory">Savory</option>
              <option value="sweet">Sweet</option>
              <option value="salty">Salty</option>
              <option value="spicy">Spicy</option>
            </select>
            <select value={cravingEmotion} onChange={e => setCravingEmotion(e.target.value)}>
              <option value="neutral">Neutral</option>
              <option value="happy">Happy</option>
              <option value="stressed">Stressed</option>
              <option value="bored">Bored</option>
              <option value="tired">Tired</option>
            </select>
            <input
              type="text"
              placeholder="What are you craving?"
              value={cravingFood}
              onChange={e => setCravingFood(e.target.value)}
            />
            <button onClick={trackCraving}>Track Craving</button>
          </div>
          {cravingResult && (
            <div className="craving-pattern">
              <p><strong>Your Craving Pattern:</strong></p>
              <div>
                <p>You're craving <strong>{cravingResult.type}</strong> and feeling <strong>{cravingResult.emotion}</strong>.</p>
                <p>{cravingResult.suggestion}</p>
              </div>
            </div>
          )}
        </div>

        {/* Cooking progress — real data from saveService.js, not a hardcoded bar */}
        <div className="craving-tracker" style={{ marginTop: '16px' }}>
          <h3>Your Cooking Progress</h3>
          <div className="skill-progress">
            <p>{cookedCount} recipe{cookedCount !== 1 ? 's' : ''} cooked · {unlockedIds.size}/5 bonus countries unlocked</p>
            <div className="skill-bar">
              <div className="fill" style={{ width: `${Math.min(100, (cookedCount / 15) * 100)}%` }}></div>
            </div>
            <p className="global-hint">
              {cookedCount >= 15 ? 'Every bonus country is unlocked!' : `${15 - cookedCount} more cooked recipe${15 - cookedCount !== 1 ? 's' : ''} unlocks every country here.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
