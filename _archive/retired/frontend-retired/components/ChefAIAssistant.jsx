import React, { useState } from 'react';
import { ChefHat, Brain, Timer, Beaker, Sparkles, Flame } from 'lucide-react';

export default function ChefAIAssistant() {
  const [mainItem, setMainItem] = useState("");
  const [vibe, setVibe] = useState("Sweet");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!mainItem) return;
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/chef_ai/build_meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ main_item: mainItem, vibe })
      });
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Error talking to Chef AI", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#33302A] border-[4px] border-[#a8d672] p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] mb-6 text-white">
      <div className="flex items-center gap-3 border-b-2 border-[#a8d672]/40 pb-3 mb-4">
        <ChefHat size={24} className="text-[#a8d672]" />
        <h2 className="text-xl font-black uppercase tracking-wider">Culinary AI Assistant</h2>
        <span className="ml-auto bg-[#a8d672] text-[#33302A] text-[10px] px-2 py-0.5 font-bold border border-[#33302A]">v2.0 Molecular</span>
      </div>

      {/* Input Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
            What are you cooking?
          </label>
          <input 
            type="text" 
            value={mainItem}
            onChange={(e) => setMainItem(e.target.value)}
            placeholder="e.g., Chocolate Chip Cookie, Steak, Chicken..."
            className="w-full bg-[#33302A] border-2 border-[#555] p-3 text-white outline-none focus:border-[#a8d672] font-mono"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
            Flavor Vibe
          </label>
          <select 
            value={vibe} 
            onChange={(e) => setVibe(e.target.value)}
            className="w-full bg-[#33302A] border-2 border-[#555] p-3 text-white outline-none focus:border-[#a8d672] font-mono"
          >
            <option value="Sweet">Sweet (Dessert)</option>
            <option value="Savory">Savory (Dinner)</option>
            <option value="Umami">Umami (Asian/Rich)</option>
          </select>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="self-end bg-[#eaff66] text-[#33302A] font-black px-6 py-3 border-[4px] border-[#33302A] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-x-[3px] active:translate-y-[3px] transition-all flex items-center gap-2 uppercase tracking-widest"
        >
          {loading ? "Thinking..." : <><Flame size={18} /> Pair It</>}
        </button>
      </div>

      {/* Results Section */}
      {loading && (
        <div className="p-10 text-center border-2 border-[#a8d672] border-dashed">
          <Brain className="animate-pulse mx-auto mb-2 text-[#a8d672]" size={32} />
          <p className="text-gray-400 font-mono text-sm">Analyzing flavor bridges and bioavailability...</p>
        </div>
      )}

      {results && results.success && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Main Pairings */}
          <div className="bg-[#33302A] border-l-4 border-[#eaff66] p-4">
            <h3 className="font-bold text-lg uppercase tracking-wider text-[#eaff66] flex items-center gap-2">
              <Sparkles size={18} /> Recommended Meal Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div className="bg-[#33302A] p-3 border border-[#555] text-center">
                <span className="text-[10px] text-gray-400 uppercase">Main</span>
                <div className="font-black text-lg">{results.meal.main_dish}</div>
              </div>
              <div className="bg-[#33302A] p-3 border border-[#555] text-center">
                <span className="text-[10px] text-gray-400 uppercase">Ideal Side</span>
                <div className="font-black text-lg text-[#ffbc51]">{results.meal.ideal_side_dishes[0]}</div>
                <div className="text-[10px] text-gray-500 mt-1">Alternative: {results.meal.ideal_side_dishes.slice(1).join(", ")}</div>
              </div>
            </div>
          </div>

          {/* The Chemistry */}
          <div className="bg-[#33302A] border-2 border-[#a8d672] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Beaker size={16} className="text-[#a8d672]" />
              <h4 className="font-bold text-xs uppercase tracking-widest text-[#a8d672]">Why This Works</h4>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed font-mono">
              {results.meal.why_this_works}
            </p>
            <div className="mt-2 bg-[#33302A] px-2 py-1 inline-block border border-[#555] text-[10px] text-[#ff6d8b]">
              {results.meal.chemistry_principle}
            </div>
          </div>

          {/* The Timing */}
          <div className="bg-[#33302A] border-2 border-[#ffbc51] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Timer size={16} className="text-[#ffbc51]" />
              <h4 className="font-bold text-xs uppercase tracking-widest text-[#ffbc51]">Thermodynamic Schedule</h4>
            </div>
            <div className="bg-[#33302A] p-3 border border-[#555] text-center text-[#ffbc51] font-mono">
              {results.timing_advice}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}