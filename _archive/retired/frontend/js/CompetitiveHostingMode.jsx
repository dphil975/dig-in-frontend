import React, { useState } from 'react';
import { Zap, Trophy, Shield, Flame, Users, MapPin } from 'lucide-react';

export default function CompetitiveHostingMode({ onFusionSelect }) {
  const [countryA, setCountryA] = useState("Jamaica");
  const [countryB, setCountryB] = useState("USA");

  const fusionOptions = [
    { id: 1, name: "Jamaican Mac & Cheese", countries: "Jamaica x USA", vibe: "Creamy, Spicy, Heavy" },
    { id: 2, name: "Korean BBQ Tacos", countries: "Korea x Mexico", vibe: "Sweet, Smoky, Umami" },
    { id: 3, name: "Italian Spiced Jerk Chicken", countries: "Italy x Jamaica", vibe: "Herby, Heat, Rich" }
  ];

  return (
    <div className="bg-[#1a1a2e] border-[4px] border-[#eaff66] p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] text-white max-w-md mx-auto">
      
      <div className="flex items-center gap-2 border-b border-[#eaff66]/30 pb-2 mb-4">
        <Zap size={20} className="text-[#eaff66]" />
        <h2 className="text-lg font-black uppercase tracking-wider">The Fusion Forge</h2>
        <span className="ml-auto bg-[#2d2d2d] px-2 py-0.5 text-[10px] border border-[#555]">Competitive Mode</span>
      </div>

      {/* Country Selectors */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Home Base</label>
          <select value={countryA} onChange={(e) => setCountryA(e.target.value)} className="w-full bg-[#2d2d2d] border-2 border-[#555] p-2 text-white font-mono outline-none">
            <option>Jamaica</option>
            <option>Italy</option>
            <option>Korea</option>
            <option>USA</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Challenge</label>
          <select value={countryB} onChange={(e) => setCountryB(e.target.value)} className="w-full bg-[#2d2d2d] border-2 border-[#555] p-2 text-white font-mono outline-none">
            <option>USA</option>
            <option>Mexico</option>
            <option>Italy</option>
            <option>Korea</option>
          </select>
        </div>
      </div>

      <button 
        onClick={() => onFusionSelect(countryA, countryB)}
        className="w-full bg-[#eaff66] text-[#1a1a2e] font-black py-3 border-[4px] border-[#2d2d2d] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-x-[3px] active:translate-y-[3px] transition-all flex justify-center items-center gap-2 text-lg uppercase tracking-widest"
      >
        <Flame size={18} /> Forge Fusion
      </button>

      {/* Competitive Leaderboard Preview */}
      <div className="mt-4 border-t border-[#eaff66]/30 pt-4">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="text-gray-400 flex items-center gap-1"><Trophy size={14} /> Iron Host Leaderboard</span>
          <span className="text-[#eaff66]">Your Rank: #12</span>
        </div>
        <div className="bg-[#2d2d2d] p-2 border border-[#555] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#ffbc51] flex items-center justify-center text-[10px] font-bold text-[#1a1a2e]">1</div>
            <span className="font-bold text-sm">Chef_Thor</span>
          </div>
          <span className="text-[#eaff66] text-xs">2,450 pts</span>
        </div>
      </div>
    </div>
  );
}