import React, { useState } from 'react';
import { Gift, Heart, Music, MapPin, Users, ArrowRight } from 'lucide-react';

export default function HostingBox({ onPlanParty }) {
  const [guestCount, setGuestCount] = useState(4);
  const [mood, setMood] = useState("Cozy");

  return (
    <div className="bg-[#fce4ec] border-[4px] border-[#e91e63] p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.15)] mb-6 rounded-xl">
      <div className="flex items-center gap-2 mb-3 border-b border-[#e91e63]/30 pb-2">
        <Gift size={18} className="text-[#e91e63]" />
        <h3 className="font-bold text-sm uppercase tracking-widest text-[#2d2d2d]">Your Hosting Box</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Guests</label>
          <input type="number" value={guestCount} onChange={e => setGuestCount(parseInt(e.target.value))} className="w-full bg-white border-2 border-[#2d2d2d] p-1 text-center font-bold" />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Vibe</label>
          <select value={mood} onChange={e => setMood(e.target.value)} className="w-full bg-white border-2 border-[#2d2d2d] p-1 text-sm font-mono">
            <option>Cozy</option>
            <option>Elegant</option>
            <option>Playful</option>
          </select>
        </div>
      </div>

      <div className="bg-[#fff8e1] border-2 border-[#ffbc51] p-3 mb-3 text-[10px] font-mono leading-relaxed">
        <span className="font-bold block mb-1 text-[#2d2d2d]">💡 The "Imperfect" Grace Note</span>
        Share this with your guests: <br />
        <span className="italic text-[#2d2d2d]/80">"I planned this with joy, not perfection. If the rice is a little sticky, that's just an excuse to eat it with your hands."</span>
      </div>

      <button onClick={() => onPlanParty(guestCount, mood)} className="w-full bg-[#e91e63] text-white font-bold py-2 border-2 border-[#b71c1c] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm flex justify-center items-center gap-2">
        <Heart size={14} /> Plan My Dinner
      </button>
    </div>
  );
}