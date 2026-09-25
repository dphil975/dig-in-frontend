import React, { useState } from 'react';
import { Search, Brain, Thermometer, Activity, Zap, Globe, Shield } from 'lucide-react';

export default function FlavorSensoriumSearch({ onSearch }) {
  const [query, setQuery] = useState("");
  
  // State for the 7 vectors
  const [mood, setMood] = useState("any");
  const [mouthfeel, setMouthfeel] = useState(5); // 1-10 slider
  const [equipment, setEquipment] = useState([]);
  const [time, setTime] = useState("any");
  const [budget, setBudget] = useState("any");
  const [vibe, setVibe] = useState("any");
  const [riskLevel, setRiskLevel] = useState("any");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Build the complex query object to send to the backend
    const searchParams = {
      text: query,
      mood,
      mouthfeel_score: mouthfeel,
      equipment_owned: equipment,
      time_budget: time,
      financial_budget: budget,
      culinary_vibe: vibe,
      risk_tolerance: riskLevel
    };
    onSearch(searchParams);
  };

  return (
    <div className="bg-white border-[4px] border-[#33302A] p-5 shadow-[6px_6px_0px_rgba(0,0,0,0.25)] mb-6">
      <h2 className="font-black text-lg border-b-2 border-[#33302A] pb-2 mb-4 flex items-center gap-2">
        <Brain size={20} className="text-[#005a8d]" /> Flavor Sensorium Search
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Primary Text Search */}
        <input 
          type="text" 
          placeholder="What are you craving? (e.g., 'I want something spicy and comforting')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#f4f2eb] border-2 border-[#d4cfc4] p-3 text-lg outline-none focus:border-[#33302A] placeholder:text-[#b0b0b0]"
        />

        {/* The 7 Vector Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 border-t border-[#d4cfc4] pt-4">
          
          {/* 1. Mood */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1"><Activity size={12} /> Mood</label>
            <select value={mood} onChange={(e) => setMood(e.target.value)} className="bg-[#fcfaf0] border-2 border-[#d4cfc4] p-1 text-sm font-mono outline-none">
              <option value="any">Any</option>
              <option value="stressed">Stressed (Comfort)</option>
              <option value="tired">Tired (Quick)</option>
              <option value="celebratory">Celebrating (Fancy)</option>
            </select>
          </div>

          {/* 2. Mouthfeel Slider */}
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1"><Thermometer size={12} /> Mouthfeel</label>
            <div className="flex justify-between text-[10px] text-gray-400 px-1">
              <span>Crispy/Dry</span>
              <span>Creamy/Soft</span>
            </div>
            <input type="range" min="1" max="10" value={mouthfeel} onChange={(e) => setMouthfeel(parseInt(e.target.value))} className="w-full accent-[#33302A]" />
          </div>

          {/* 3. Equipment */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1"><Zap size={12} /> Tools</label>
            <div className="flex flex-wrap gap-1">
              {["Rice Cooker", "Air Fryer", "Sous Vide"].map(gear => (
                <label key={gear} className="flex items-center gap-1 text-[10px] cursor-pointer bg-[#fcfaf0] border border-[#d4cfc4] px-2 py-0.5 hover:bg-[#eaff66]">
                  <input type="checkbox" value={gear} onChange={(e) => {
                    if(e.target.checked) setEquipment([...equipment, gear]);
                    else setEquipment(equipment.filter(g => g !== gear));
                  }} className="w-3 h-3 accent-[#33302A]" /> {gear}
                </label>
              ))}
            </div>
          </div>

          {/* 4. Time & 5. Budget */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Time</label>
            <select value={time} onChange={(e) => setTime(e.target.value)} className="bg-[#fcfaf0] border-2 border-[#d4cfc4] p-1 text-sm font-mono outline-none">
              <option value="any">Any</option>
              <option value="15">Under 15 min</option>
              <option value="45">Under 45 min</option>
              <option value="120">Under 2 hours</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Budget</label>
            <select value={budget} onChange={(e) => setBudget(e.target.value)} className="bg-[#fcfaf0] border-2 border-[#d4cfc4] p-1 text-sm font-mono outline-none">
              <option value="any">Any</option>
              <option value="cheap">Cheap (<$10)</option>
              <option value="standard">Standard ($10-$25)</option>
              <option value="expensive">Premium ($25+)</option>
            </select>
          </div>

          {/* 6. Vibe */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1"><Globe size={12} /> Flavor Vibe</label>
            <select value={vibe} onChange={(e) => setVibe(e.target.value)} className="bg-[#fcfaf0] border-2 border-[#d4cfc4] p-1 text-sm font-mono outline-none">
              <option value="any">Any</option>
              <option value="tuscany">Tuscany (Mediterranean)</option>
              <option value="tokyo">Tokyo (Umami)</option>
              <option value="new_orleans">New Orleans (Deep South)</option>
            </select>
          </div>

          {/* 7. Physics Risk */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1"><Shield size={12} /> Failure Risk</label>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="bg-[#fcfaf0] border-2 border-[#d4cfc4] p-1 text-sm font-mono outline-none">
              <option value="any">Any</option>
              <option value="failproof">Fail-Proof (Hosting)</option>
              <option value="moderate">Moderate (Daily)</option>
              <option value="molecular">Molecular Chef (Fun)</option>
            </select>
          </div>

        </div>

        <button type="submit" className="w-full bg-[#33302A] text-white font-black py-3 border-[4px] border-[#555] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-x-[3px] active:translate-y-[3px] transition-all flex justify-center items-center gap-2 text-lg mt-2">
          <Search size={20} /> Decode My Craving
        </button>

      </form>
    </div>
  );
}