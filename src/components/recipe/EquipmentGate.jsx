import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlayCircle, ArrowRight, CheckCircle, RotateCcw,
  BookOpen, ShoppingBag, Settings, Users, ChefHat, ExternalLink,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
 * EquipmentGate
 *
 * A "gear up before you cook" gate that appears BEFORE the recipe method steps.
 * Layout: a large media card on the left (the equipment item, rendered as a
 * sponsored ad link), and a right-hand column with one full-width button per
 * tool, and a single green panel holding "why this tool matters" plus a trust
 * stat + the Continue button. Below sits a grid of EXAMPLES showing how each
 * tool applies to the recipe, each with a slot for a boomerang clip.
 *
 * Props:
 *   recipe     – the active recipe (used for the heading; optional)
 *   equipment  – optional array of equipment objects; falls back to a curated
 *                default set. Shape: { id, name, description, image, adUrl,
 *                trustStat?, examples:[{ id, title, desc, boomerang?, link?:{ to, label } }] }
 *   onContinue – called when the user taps Continue to enter the recipe steps
 * ──────────────────────────────────────────────────────────────────────── */

// --- Curated default equipment (used only when no recipe-specific set is passed) ---
const DEFAULT_EQUIPMENT = [
  {
    id: 'cast_iron',
    name: 'Cast Iron Skillet',
    description:
      'The workhorse of the kitchen. Excellent heat retention and even distribution — perfect for searing proteins and finishing in the oven.',
    image: 'https://images.unsplash.com/photo-1584990347449-a0846f1a25b7?auto=format&fit=crop&q=80&w=600',
    adUrl: '#',
    trustStat: '12k+ home cooks',
    examples: [
      { id: 1, title: 'Searing Proteins', desc: "The pan's thermal mass keeps temperature steady, so you get a deep crust without steaming the meat." },
      { id: 2, title: 'Oven Finishing', desc: 'Start on the stovetop, then move the whole pan to the oven to cook through evenly.' },
      { id: 3, title: 'One-Pan Meals', desc: 'Sear, then add aromatics and simmer — every step happens in the same pan.', link: { to: '/social?tag=one-pan', label: 'See one-pan meals on the Social Feed' } },
    ],
  },
  {
    id: 'rice_cooker',
    name: 'Rice Cooker / Multi-Cooker',
    description:
      'Not just for rice. The sealed, gently pressurised environment is ideal for steaming, braising, and hands-off grains while you prep the rest of the dish.',
    image: 'https://images.unsplash.com/photo-1584264514217-7e1c2fbde9cb?auto=format&fit=crop&q=80&w=600',
    adUrl: '#',
    trustStat: '9k+ home cooks',
    examples: [
      { id: 1, title: 'Perfect Grains', desc: 'A steady 1:1 ratio and automatic shut-off mean fluffy rice without watching the pot.' },
      { id: 2, title: 'Gentle Steaming', desc: 'Rest fish or vegetables in a basket above the water to cook them through delicately.' },
      { id: 3, title: 'Set & Forget', desc: 'Start grains on a timer so they finish exactly when the rest of the recipe is ready.' },
    ],
  },
  {
    id: 'air_fryer',
    name: 'Air Fryer / Convection Oven',
    description:
      'Rapid hot-air circulation crisps food with a fraction of the oil. Great for the final crunch and for reheating without going soggy.',
    image: 'https://images.unsplash.com/photo-1585839215215-5f551e92d689?auto=format&fit=crop&q=80&w=600',
    adUrl: '#',
    trustStat: '7k+ home cooks',
    examples: [
      { id: 1, title: 'Shatter-Crisp Edges', desc: 'The fan pulls moisture off the surface, so skins and coatings turn out crackly.' },
      { id: 2, title: 'Fast Caramelisation', desc: 'Concentrated heat browns vegetables quickly while keeping the centres tender.' },
      { id: 3, title: 'No-Soak Reheats', desc: 'Bring leftovers back to crisp instead of the steamed texture of a microwave.' },
    ],
  },
];

// --- The big media card (the equipment item shown as a sponsored ad link) ---
const EquipmentAdCard = ({ tool }) => {
  return (
    <a
      href={tool.adUrl || '#'}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="relative block w-full h-full min-h-[320px] bg-[#d4e5ef] rounded-2xl overflow-hidden shadow-md border-2 border-white/50 group"
    >
      {/* Sponsored badge — makes the ad nature explicit */}
      <span className="absolute top-3 left-3 z-10 bg-[#33302A] text-[#eaff66] text-[10px] px-2 py-0.5 font-mono uppercase tracking-widest rounded">
        Sponsored
      </span>

      <img
        src={tool.image}
        alt={tool.name}
        loading="lazy"
        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
      />

      {/* Bottom gradient + CTA */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-white">
              <PlayCircle size={16} className="text-[#eaff66]" />
              <span className="text-sm font-bold tracking-wide">See it in action</span>
            </div>
            <div className="text-white/90 text-lg font-black mt-1">{tool.name}</div>
          </div>
          <span className="shrink-0 flex items-center gap-1 bg-white text-[#33302A] text-xs font-bold px-3 py-1.5 rounded-full shadow group-hover:bg-[#eaff66] transition-colors">
            Shop tool <ExternalLink size={12} />
          </span>
        </div>
      </div>
    </a>
  );
};

// --- Equipment selector buttons — one full-width button per tool, all the
// same height, instead of text-length-driven wrapped chips. ---
const EquipmentTabs = ({ equipment, activeId, onSelect }) => {
  return (
    <div className="flex flex-col gap-2">
      {equipment.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onSelect(tool.id)}
          className={`
            w-full px-4 py-3 rounded-xl border-[2px] border-[#33302A] font-bold text-xs text-left transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.2)]
            ${activeId === tool.id
              ? 'bg-[#33302A] text-white'
              : 'bg-white text-[#33302A] hover:bg-[#f4f2eb]'}
          `}
        >
          {tool.name}
        </button>
      ))}
    </div>
  );
};

// --- The single green panel: "why this tool?" blurb + trust stat + Continue,
// all sharing one continuous green background so it reads as one section
// instead of three stacked boxes. The description is never height-capped, so
// long copy is never clipped — the panel just grows to fit it. ---
const ToolInfoPanel = ({ tool, onContinue }) => {
  return (
    <div className="bg-[#e8f5e9] border-[3px] border-[#33302A] rounded-2xl p-4 flex flex-col flex-1">
      <div className="flex items-center gap-2 mb-3 border-b border-[#33302A]/20 pb-2">
        <BookOpen size={18} className="text-[#33302A]" />
        <h4 className="font-bold text-sm uppercase tracking-widest">Why this tool?</h4>
      </div>

      <p className="text-[#33302A]/80 text-sm leading-relaxed">
        {tool.description}
      </p>

      <div className="mt-3 flex gap-2 pt-2 border-t border-[#33302A]/20">
        <div className="bg-white border border-[#33302A] rounded-full p-1 shadow-[1px_1px_0px_rgba(0,0,0,0.2)]"><Users size={14} /></div>
        <div className="bg-white border border-[#33302A] rounded-full p-1 shadow-[1px_1px_0px_rgba(0,0,0,0.2)]"><ShoppingBag size={14} /></div>
        <div className="bg-white border border-[#33302A] rounded-full p-1 shadow-[1px_1px_0px_rgba(0,0,0,0.2)]"><Settings size={14} /></div>
      </div>

      {/* Pushed to the bottom of this same green panel — thin stat + Continue row */}
      <div className="grid grid-cols-2 gap-3 mt-auto pt-5">
        <div className="bg-white/70 border-[2px] border-[#33302A] rounded-xl flex flex-col items-center justify-center gap-0.5 py-2 px-1 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-1">
            <CheckCircle size={14} className="text-[#4c9a4c] shrink-0" />
            <span className="font-black text-sm leading-none whitespace-nowrap">{(tool.trustStat || '12k+ home cooks').split(' ')[0]}</span>
          </div>
          <span className="text-[9px] text-[#33302A]/70 leading-none whitespace-nowrap">
            {(tool.trustStat || '12k+ home cooks').split(' ').slice(1).join(' ')}
          </span>
        </div>

        <button
          onClick={onContinue}
          className="bg-[#33302A] text-white border-[2px] border-[#33302A] rounded-xl flex items-center justify-center gap-2 py-2 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:bg-[#33302A] active:translate-y-px transition-all cursor-pointer"
        >
          <span className="font-bold text-xs">Continue</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

// --- Main gate ---
export default function EquipmentGate({ recipe, equipment, onContinue }) {
  const list = (equipment && equipment.length) ? equipment : DEFAULT_EQUIPMENT;
  const [activeId, setActiveId] = useState(list[0].id);
  const activeTool = list.find((t) => t.id === activeId) || list[0];

  return (
    <div className="bg-[#F3EADA] border-[3px] border-[#33302A] rounded-2xl p-5 md:p-8 font-sans">
      <div className="w-full space-y-10">

        {/* Heading */}
        <div>
          <div className="flex items-center gap-2 text-[#33302A]/60 text-xs font-bold uppercase tracking-widest mb-1">
            <ChefHat size={16} /> Gear up before you cook
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Equipment for {recipe?.name || 'this recipe'}
          </h2>
          <p className="text-sm text-[#33302A]/70 mt-1">
            Make sure you have the right tools so the recipe goes smoothly.
          </p>
        </div>

        {/* --- HERO: big ad card on the left, control column on the right --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Large left card (the item) */}
          <div className="col-span-1 md:col-span-2">
            <EquipmentAdCard tool={activeTool} />
          </div>

          {/* Right column stack — buttons, then the single green info panel */}
          <div className="col-span-1 flex flex-col gap-3">
            <EquipmentTabs equipment={list} activeId={activeId} onSelect={setActiveId} />
            <ToolInfoPanel tool={activeTool} onContinue={onContinue} />
          </div>
        </div>

        {/* --- EXAMPLES: how this tool applies to the recipe --- */}
        <div className="space-y-6">
          <div className="border-b-2 border-[#33302A] pb-2">
            <h3 className="text-xl md:text-2xl font-black tracking-tight">
              How the {activeTool.name} works in your recipe
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTool.examples.map((example, idx) => (
              <div
                key={example.id}
                className="bg-white border-[3px] border-[#33302A] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] flex flex-col h-full group hover:shadow-[6px_6px_0px_rgba(0,0,0,0.3)] transition-all"
              >
                {/* Example label — in normal flow (not absolutely positioned),
                    so it lines up identically across every card regardless of
                    card height or viewport width. */}
                <div className="inline-flex self-start bg-[#33302A] text-white text-[10px] px-2 py-0.5 rounded mb-3">
                  EXAMPLE {idx + 1}
                </div>

                {/* Boomerang clip slot — uses an image/gif if provided, else a placeholder */}
                <div className="mb-3 bg-[#fcfaf0] border-[2px] border-[#d4cfc4] rounded-lg h-28 flex items-center justify-center overflow-hidden relative">
                  {example.boomerang ? (
                    <img src={example.boomerang} alt={example.title} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <PlayCircle size={14} /> Boomerang: {example.title}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-lg mt-1">{example.title}</h4>
                <p className="text-sm text-[#33302A]/80 flex-grow leading-relaxed">
                  {example.desc}
                </p>

                {example.link && (
                  <Link
                    to={example.link.to}
                    className="mt-4 pt-3 border-t border-[#d4cfc4] flex items-center gap-1.5 text-xs font-bold text-[#005a8d] hover:underline"
                  >
                    <RotateCcw size={14} />
                    {example.link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
