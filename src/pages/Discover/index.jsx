import { useState } from 'react';
import Safety from './Safety';
import Places from './Places';
import Categories from './Categories';
import Community from './Community';
import Flavors from './Flavors';
import './Discover.css';

/* Discover — one page for everything that isn't "what should I cook right now"
   (that's Nova). Five sections, top to bottom:

     Safety       recall watch, grow & regrow, community tips
     Places       somewhere else, your city, featured cities
     Categories   budget, quick, gluten-free, bread, hosting … and the other hubs
     Community    open questions, tag hubs, The Table
     Flavors      one recipe in 8 flavors, the flavor quiz

   It replaced the old Explore/Discover tabs and the bento; the old sub-pages
   (Craving, Kitchen Skills, Nibblers, Out There, Commute, Global Food, Deals)
   are all still here, one tap from Categories. */

const SECTIONS = [
  { id: 'safety', label: 'Safety' },
  { id: 'places', label: 'Places' },
  { id: 'categories', label: 'Categories' },
  { id: 'community', label: 'Community' },
  { id: 'flavors', label: 'Flavors' },
];

function jump(id) {
  document.getElementById(`discover-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Discover() {
  const [composing, setComposing] = useState(false);

  function startComposing() {
    setComposing(true);
    jump('community');
  }

  return (
    <div className="dsc">
      <h1 className="dsc-title">Discover</h1>
      {/* Only this slim bar sticks (title and all would take a fifth of a phone screen). */}
      <nav className="dsc-jump" aria-label="Sections">
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" className="dsc-jump-btn" onClick={() => jump(s.id)}>{s.label}</button>
        ))}
      </nav>

      <Safety onWrite={startComposing} />
      <Places />
      <Categories />
      <Community composing={composing} onCompose={() => setComposing(true)} onDoneComposing={() => setComposing(false)} />
      <Flavors />
    </div>
  );
}
