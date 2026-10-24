import React from 'react';
import { Shield, Users, Flame, Footprints } from 'lucide-react';

export default function FusionResultCard({ fusion }) {
  return (
    <div className="bg-[#fcfaf0] border-[4px] border-[#ffbc51] p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.25)]">
      <div className="flex justify-between items-center border-b-2 border-[#2d2d2d] pb-2 mb-3">
        <h2 className="text-xl font-black tracking-tight text-[#2d2d2d]">{fusion.name}</h2>
        <div className="bg-[#1a1a2e] text-[#eaff66] px-2 py-0.5 text-[10px] border border-[#555] font-bold uppercase flex items-center gap-1">
          <Flame size={12} /> Hidden Gem
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border-2 border-[#d4cfc4] p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Prep Time</div>
          <div className="font-bold text-xl text-[#005a8d]">25 min</div>
        </div>
        <div className="bg-white border-2 border-[#d4cfc4] p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Caloric Impact</div>
          <div className="font-bold text-xl text-[#ff6d8b]">680 cal</div>
        </div>
      </div>

      <div className="bg-[#1a1a2e] p-3 border-2 border-[#eaff66] mb-4">
        <div className="flex items-center gap-2 mb-1 text-[#eaff66]">
          <Shield size={16} /> The Competitive Edge
        </div>
        <p className="text-white text-xs font-mono leading-relaxed">
          This dish is designed to impress. The {fusion.countries.split(' x ')[1]} influence gives it a bold, unexpected kick. 
          Serve this at your next gathering and watch the room go silent.
        </p>
      </div>

      <div className="flex justify-between items-center border-t-2 border-[#d4cfc4] pt-3">
        <div className="flex items-center gap-1 text-xs text-[#2d2d2d]">
          <Users size={14} /> Hosts 4-6 people
        </div>
        <button className="bg-[#2d2d2d] text-white font-bold px-4 py-1 border-2 border-[#555] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] transition-all text-xs flex items-center gap-2">
          <Zap size={14} /> Start the Competition
        </button>
      </div>
    </div>
  );
}