import React, { useState } from 'react';
import { FlaskConical, TrendingUp, ArrowRight, Beaker, ShoppingBag } from 'lucide-react';

export default function FlavorReverseEngineer() {
  const [searchDrink, setSearchDrink] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCrackRecipe = async () => {
    setLoading(true);
    // Simulate backend API call to the FlavorEngine
    setTimeout(() => {
      setResult({
        name: "Starbucks Pink Drink (Custom Size)",
        base: "Strawberry Açaí Refresher",
        size: 24, // ounces
        bindingAgent: "Citric Acid + White Grape Juice Concentrate",
        formula: {
          baseLiquid: "6 oz White Grape Juice",
          flavorProfile: "2 oz Strawberry Açaí Syrup (Monin brand)",
          dairy: "6 oz Coconut Milk",
          addIns: "1 tbsp Freeze-dried Strawberries"
        },
        chemistry: "The citric acid in the base liquid breaks down the coconut fat's surface tension, allowing the flavors to fully fuse. DO NOT stir too aggressively, or the coconut milk will split.",
        economics: {
          setupCost: 14.50,
          perDrinkCost: 1.80,
          storePrice: 6.25,
          breakEvenPoint: 4
        }
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="bg-white border-[4px] border-[#33302A] p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.3)] mb-6">
      <div className="flex items-center gap-2 border-b-2 border-[#33302A] pb-2 mb-4">
        <FlaskConical size={20} className="text-[#ff6d8b]" />
        <h3 className="font-black text-lg uppercase tracking-wider">Flavor Forensics Lab</h3>
        <span className="ml-auto bg-[#33302A] text-[#eaff66] text-[10px] px-2 py-0.5 border border-[#555]">Beta v2.0</span>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
            Enter Secret Menu Drink (e.g., Eagle Freeze, Pink Drink)
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={searchDrink}
              onChange={(e) => setSearchDrink(e.target.value)}
              placeholder="Reverse engineer a drink..."
              className="flex-1 bg-[#f4f2eb] border-2 border-[#d4cfc4] p-2 outline-none focus:border-[#33302A] font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleCrackRecipe()}
            />
            <button 
              onClick={handleCrackRecipe}
              disabled={loading}
              className="bg-[#33302A] text-white font-bold px-6 py-2 border-2 border-[#555] shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:translate-x-[2px] active:translate-y-[2px] transition-all"
            >
              {loading ? "Analyzing..." : "Crack It"}
            </button>
          </div>
        </div>
      </div>

      {/* --- THE RESULTS DISPLAY --- */}
      {result && (
        <div className="mt-6 bg-[#F3EADA] border-[4px] border-[#ffbc51] p-4 animate-in fade-in slide-in-from-top-4 duration-500 relative">
          
          {/* Chemist Note */}
          <div className="absolute -top-3 left-4 bg-[#33302A] text-[#ffbc51] text-[10px] px-2 py-0.5 border border-[#555] uppercase font-bold">
            Chemist's Notes
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            
            {/* Formula Column */}
            <div className="col-span-1 border-r-2 border-[#33302A] pr-4">
              <h4 className="font-bold text-sm border-b border-[#33302A] pb-1 mb-2">The Recipe Base</h4>
              <ul className="space-y-1 text-xs font-mono">
                <li className="flex justify-between"><span className="text-gray-500">Binding Agent:</span><span className="font-bold">{result.bindingAgent}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Base Liquid:</span><span className="font-bold">{result.formula.baseLiquid}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Flavor Profile:</span><span className="font-bold">{result.formula.flavorProfile}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Dairy Base:</span><span className="font-bold">{result.formula.dairy}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Add-ins:</span><span className="font-bold">{result.formula.addIns}</span></li>
              </ul>
            </div>

            {/* Chemistry Column */}
            <div className="col-span-1 border-r-2 border-[#33302A] pr-4">
              <div className="flex items-center gap-2 mb-2">
                <Beaker size={16} className="text-[#005a8d]" />
                <h4 className="font-bold text-sm border-b border-[#33302A] pb-1">The Chemical Reaction</h4>
              </div>
              <p className="text-[13px] leading-relaxed text-[#33302A]/80">
                {result.chemistry}
              </p>
            </div>

            {/* Economics Column (The "Investment" Trap) */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-[#a8d672]" />
                <h4 className="font-bold text-sm border-b border-[#33302A] pb-1">The Math</h4>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Setup Cost:</span><span className="font-bold">${result.economics.setupCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Cost/Drink:</span><span className="font-bold text-[#a8d672]">${result.economics.perDrinkCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Store Price:</span><span className="text-[#ff6d8b] font-bold">${result.economics.storePrice.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-[#33302A] pt-1 mt-1"><span className="font-bold">Break-even in:</span><span className="font-black text-[#005a8d]">{result.economics.breakEvenPoint} drinks</span></div>
                <div className="bg-[#33302A] text-[#eaff66] text-[9px] p-2 mt-2 border border-[#555] text-center uppercase font-bold">
                  <ShoppingBag size={12} className="inline mr-1" /> Reusable cups = Multi-use savings
                </div>
              </div>
            </div>
          </div>

          {/* Multiplication Process */}
          <div className="mt-4 bg-[#f4f2eb] p-3 border-2 border-[#d4cfc4]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Scaling Instructions (The Multiplication Factor)</p>
            <p className="text-sm font-mono font-bold text-[#33302A]">
              To make a {result.size}oz drink: Multiply every ingredient by <span className="text-[#ff6d8b] text-lg">{result.size / 12}</span>.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}