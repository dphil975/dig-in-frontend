import React, { useState } from 'react';
import { Zap, Coffee, Brain, ArrowRight, CreditCard, Box } from 'lucide-react';

export default function BoredomSubsideFeed({ userEnergy }) {
  const [activeTab, setActiveTab] = useState("girl_dinner");

  return (
    <div className="bg-[#fcf9f2] p-4 md:p-6 max-w-4xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-[#2d2d2d] pb-2 mb-4">
        <h1 className="text-2xl font-black tracking-tight text-[#2d2d2d]">Your Boredom Cure</h1>
        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
          <Zap size={14} className="text-[#ff6d8b]" /> Energy Level: {userEnergy}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => setActiveTab("girl_dinner")} className={`px-4 py-2 rounded-full border-2 font-bold text-xs transition-all flex-shrink-0 ${activeTab === "girl_dinner" ? 'bg-[#ffbc51] text-[#1a1a2e] border-[#2d2d2d]' : 'bg-white border-[#d4cfc4] text-[#2d2d2d]'}`}>
          🍽️ Girl Dinner
        </button>
        <button onClick={() => setActiveTab("new_skill")} className={`px-4 py-2 rounded-full border-2 font-bold text-xs transition-all flex-shrink-0 ${activeTab === "new_skill" ? 'bg-[#a8d672] text-[#1a1a2e] border-[#2d2d2d]' : 'bg-white border-[#d4cfc4] text-[#2d2d2d]'}`}>
          🧠 New Skill
        </button>
        <button onClick={() => setActiveTab("investment")} className={`px-4 py-2 rounded-full border-2 font-bold text-xs transition-all flex-shrink-0 ${activeTab === "investment" ? 'bg-[#005a8d] text-white border-[#2d2d2d]' : 'bg-white border-[#d4cfc4] text-[#2d2d2d]'}`}>
          💰 Smart Gear
        </button>
      </div>

      {/* Content Cards */}
      <div className="space-y-4">
        
        {/* Card 1: Girl Dinner */}
        {activeTab === "girl_dinner" && (
          <div className="bg-white border-[4px] border-[#2d2d2d] p-5 shadow-[6px_6px_0px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">The "Zero-Effort" Graze Plate</h3>
                <p className="text-sm text-gray-500 font-mono">4 ingredients. 0 cooking. Unlimited dopamine.</p>
              </div>
              <span className="text-[10px] bg-[#ffbc51] px-2 py-0.5 border border-[#2d2d2d] font-bold uppercase">Open & Eat</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#fcfaf0] border border-[#d4cfc4] p-2 text-center text-sm font-mono">🧀 Pre-sliced Cheese</div>
              <div className="bg-[#fcfaf0] border border-[#d4cfc4] p-2 text-center text-sm font-mono">🥖 Crackers</div>
              <div className="bg-[#fcfaf0] border border-[#d4cfc4] p-2 text-center text-sm font-mono">🥩 Salami / Prosciutto</div>
              <div className="bg-[#fcfaf0] border border-[#d4cfc4] p-2 text-center text-sm font-mono">🍇 Grapes</div>
            </div>
            <p className="text-[10px] text-gray-400 border-t border-[#d4cfc4] pt-2 flex items-center gap-1">
              <Coffee size={12} /> Tip: Pair with a $5 bottle of wine. You just made a restaurant charcuterie board at home.
            </p>
          </div>
        )}

        {/* Card 2: New Skill (Upgrade) */}
        {activeTab === "new_skill" && (
          <div className="bg-white border-[4px] border-[#a8d672] p-5 shadow-[6px_6px_0px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={20} className="text-[#a8d672]" />
              <h3 className="font-bold text-lg">Learn to Thicken Sauces</h3>
            </div>
            <div className="bg-[#fcfaf0] border border-[#d4cfc4] p-3 mb-3 flex flex-col gap-2 text-sm font-mono">
              <div className="flex justify-between"><span>1. Buy a $1.50 packet of unflavored gelatin</span><span className="text-[#a8d672]">✓</span></div>
              <div className="flex justify-between"><span>2. Dissolve in cold water</span><span className="text-[#a8d672]">✓</span></div>
              <div className="flex justify-between"><span>3. Whisk into your sauce</span><span className="text-[#a8d672]">✓</span></div>
            </div>
            <p className="text-[10px] text-gray-400 border-t border-[#d4cfc4] pt-2 flex items-center gap-1">
              <Zap size={12} /> This single skill turns a watery sauce into a restaurant-level glaze. You learned it for $1.50.
            </p>
          </div>
        )}

        {/* Card 3: Investment Logic (The $7 Hack) */}
        {activeTab === "investment" && (
          <div className="bg-white border-[4px] border-[#005a8d] p-5 shadow-[6px_6px_0px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">Why you shouldn't buy cheap knives</h3>
                <p className="text-sm text-gray-500 font-mono">And how to get professional quality for $15.</p>
              </div>
              <CreditCard size={20} className="text-[#005a8d]" />
            </div>
            <div className="bg-[#1a1a2e] text-white p-3 border-2 border-[#555] mb-3">
              <div className="flex justify-between items-center text-sm font-mono">
                <span>Victorinox Fibrox Chef's Knife</span>
                <span className="text-[#eaff66] font-bold">$15.00</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Used by professional culinary schools. Will last 15 years.</p>
            </div>
            <p className="text-[10px] text-gray-400 border-t border-[#d4cfc4] pt-2 flex items-center gap-1">
              <Box size={12} /> You don't need a $200 knife. You need a sharp $15 knife. This is the "Buy It For Life" hack.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}