import React from 'react';
import { Award, Heart, Sparkles } from 'lucide-react';

export default function ChefsQuest() {
  return (
    <div className="bg-gradient-to-r from-[#fce4ec] to-[#f3e5f5] border-[4px] border-[#e91e63] p-4 rounded-xl mb-4 text-center shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
      <Award size={24} className="mx-auto text-[#e91e63] mb-2" />
      <h3 className="font-bold text-sm text-[#2d2d2d]">You've earned a Community Coin! 🪙</h3>
      <p className="text-[10px] text-[#2d2d2d]/60 font-mono">You fed 4 people tonight. That's real connection.</p>
      <div className="flex justify-center gap-2 mt-2">
        <span className="text-[10px] bg-white border border-[#2d2d2d] px-2 py-0.5 flex items-center gap-1"><Heart size={12} className="text-[#ff6d8b]" /> 1 Coin</span>
        <span className="text-[10px] bg-white border border-[#2d2d2d] px-2 py-0.5 flex items-center gap-1"><Sparkles size={12} className="text-[#ffbc51]" /> +2 XP</span>
      </div>
    </div>
  );
}