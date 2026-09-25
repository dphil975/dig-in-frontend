import { useState } from 'react';
import './DiscoverPanel.css';

/* DiscoverPanel — three feature-showcase sections in Dig In's own retro
   pixel-menu style: chunky pixel borders, a cream "dialogue box" palette,
   warm accents, and a card grid that opens into a pixel detail box. */

// Exported so Home's CloserLook (an arrow-navigated single-frame take on
// this same content) can reuse the exact same authored teaser/detail copy
// instead of a second, divergent write-up of the same features.
export const SECTIONS = [
  {
    id: 'significant-others',
    eyebrow: 'WORKS WITH YOU',
    title: 'Significant Others.',
    intro: "Dig In doesn't work alone — it plays well with the rest of your routine.",
    cards: [
      {
        id: 'pantry',
        icon: 'PANTRY',
        type: 'FRESH',
        title: 'Dig In & Your Pantry',
        teaser: 'Scan it in, cook from it.',
        detail: "Scan a barcode and it joins your virtual pantry — brand, size, and the price you paid. Recipes light up the moment you actually have what they need, and swap suggestions fill in for whatever's missing.",
      },
      {
        id: 'wallet',
        icon: 'WALLET',
        type: 'SAVER',
        title: 'Dig In & Your Wallet',
        teaser: 'Prices tracked, benefits respected.',
        detail: "Buy the same item again at a higher price and Dig In flags it. SNAP and WIC filters run through the whole store map, so you only ever see places that actually take your benefits.",
      },
      {
        id: 'neighborhood',
        icon: 'HOOD',
        type: 'ROUTE',
        title: 'Dig In & Your Neighborhood',
        teaser: 'Real stores, real routes.',
        detail: 'The Food Map plots thousands of real bodegas, groceries, and corner stores near you — zoom in, tap one for hours and directions, then hand the whole trip to the Commute Planner.',
      },
    ],
  },
  {
    id: 'get-to-know',
    eyebrow: 'YOUR PROFILE',
    title: 'Get to Know Dig In.',
    intro: 'Seven habits, one app.',
    cards: [
      {
        id: 'scan',
        icon: 'PANTRY',
        type: 'CORE',
        title: 'Pantry Scanning',
        teaser: 'Your fridge, remembered.',
        detail: "Point the scanner at a barcode and it's logged — no retyping what you already own. Your virtual pantry stays current every time you shop.",
      },
      {
        id: 'price',
        icon: 'LIVE',
        type: 'HOT',
        title: 'Live Price Tracking',
        teaser: 'Catch the markup before you pay it.',
        detail: 'Every scanned item keeps its price history by store. Buy it again for more and Dig In tells you — before you\'re at the register.',
      },
      {
        id: 'map',
        icon: 'THE',
        type: 'COOL',
        title: 'The Food Map',
        teaser: 'Zoom in, see everything.',
        detail: "Every plotted store, all thirty on a page at a time — filter by borough or county, sort by closest or top-rated, and tap in for hours, directions, and check-in.",
      },
      {
        id: 'badges',
        icon: 'CHECK',
        type: 'EARN',
        title: 'Check-Ins & Badges',
        teaser: 'Level up your neighborhood.',
        detail: 'GPS-verified check-ins earn coins and badges as you explore new boroughs and cuisines — you have to actually be there for it to count.',
      },
      {
        id: 'snap',
        icon: 'SNAP',
        type: 'FRESH',
        title: 'SNAP / WIC Aware',
        teaser: 'Built in, not bolted on.',
        detail: "Store listings carry real SNAP and WIC eligibility, so filtering by benefits is a first-class option everywhere in the app — not a workaround.",
      },
      {
        id: 'recipes',
        icon: 'RECIPE',
        type: 'POWER',
        title: 'Recipe Discovery',
        teaser: 'From craving to cooked.',
        detail: 'Browse by mood with Craving Compass, swipe Recipe Reels, or remix a dish to match what\'s actually in your pantry.',
      },
    ],
  },
  {
    id: 'why-dig-in',
    eyebrow: 'WHAT YOU EARN',
    title: 'Why Dig In Is the Best Way to Eat Well.',
    intro: 'The case for making it your home base.',
    cards: [
      {
        id: 'real-data',
        icon: 'REAL',
        type: 'LOCAL',
        title: 'Real Store Data',
        teaser: 'Not a demo. Real stores.',
        detail: 'Thousands of real, plotted bodegas, groceries, and corner stores across NYC and beyond — not placeholder listings.',
      },
      {
        id: 'snap-friendly',
        icon: 'SNAP',
        type: 'FRESH',
        title: 'SNAP / WIC Friendly',
        teaser: 'Built around your benefits.',
        detail: "SNAP and WIC eligibility is a real filter on the map, not an afterthought — so finding a store that takes your benefits is the default, not the search.",
      },
      {
        id: 'deals',
        icon: 'DEAL',
        type: 'SAVER',
        title: 'Deal Tracking, Built In',
        teaser: 'Get told before you overpay.',
        detail: 'Price history rides along with every item you scan, so a quiet markup at your usual store doesn\'t slip past you.',
      },
      {
        id: 'plan-trip',
        icon: 'PLAN',
        type: 'ROUTE',
        title: 'Plan the Whole Trip',
        teaser: 'Budget in, route out.',
        detail: 'The Commute Planner turns a shopping list and a budget into an actual multi-stop route across nearby stores — transit-aware, SNAP/WIC-aware.',
      },
      {
        id: 'earn',
        icon: 'EARN',
        type: 'EARN',
        title: 'Earn As You Go',
        teaser: 'Coins and badges, for real visits.',
        detail: 'Every GPS-verified check-in pays out — coins, badges, borough-explorer streaks. Shopping smart earns something back.',
      },
      {
        id: 'one-app',
        icon: 'ONE',
        type: 'POWER',
        title: 'One App, Start to Finish',
        teaser: 'Recipe → pantry → store → checked in.',
        detail: 'Find a recipe, see what\'s missing from your pantry, route to a store that has it, and check in when you arrive — one loop, one app.',
      },
    ],
  },
];

function PanelCard({ card, onOpen }) {
  return (
    <button className="dp-card" onClick={() => onOpen(card)}>
      <div className="dp-card-head">
        <span className="dp-card-icon">{card.icon}</span>
        <span className={`dp-tag dp-tag-${card.type.toLowerCase()}`}>{card.type}</span>
      </div>
      <div className="dp-card-title">{card.title}</div>
      <div className="dp-card-teaser">{card.teaser}</div>
      <div className="dp-card-more">TAP TO READ</div>
    </button>
  );
}

function PanelModal({ card, onClose }) {
  if (!card) return null;
  return (
    <div className="dp-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dp-modal">
        <button className="dp-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="dp-modal-head">
          <span className="dp-modal-icon">{card.icon}</span>
          <span className={`dp-tag dp-tag-${card.type.toLowerCase()}`}>{card.type}</span>
        </div>
        <div className="dp-modal-title">{card.title}</div>
        <p className="dp-modal-detail"><span className="dp-cursor">▶</span> {card.detail}</p>
      </div>
    </div>
  );
}

export default function DiscoverPanel() {
  const [openCard, setOpenCard] = useState(null);

  return (
    <section className="dp-showcase">
      {SECTIONS.map(section => (
        <div className="dp-section" key={section.id}>
          <p className="dp-eyebrow">{section.eyebrow}</p>
          <h2 className="dp-title">{section.title}</h2>
          <p className="dp-intro">{section.intro}</p>
          <div className="dp-grid">
            {section.cards.map(card => (
              <PanelCard key={card.id} card={card} onOpen={setOpenCard} />
            ))}
          </div>
        </div>
      ))}
      <PanelModal card={openCard} onClose={() => setOpenCard(null)} />
    </section>
  );
}
