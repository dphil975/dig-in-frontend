import React, { useState } from 'react';
import { Heart, Coffee, Moon, Sparkles } from 'lucide-react';

export default function CommunityWarmth({ onResponse }) {
  const [feeling, setFeeling] = useState(null);

  const handleResponse = (mood) => {
    setFeeling(mood);
    onResponse(mood);
    // In production, this logs the mood anonymously to the backend
    // to generate the "Community Sentiment" dashboard.
  };

  return (
    <div className="bg-gradient-to-r from-[#e8f5e9] to-[#fce4ec] border-[4px] border-[#e91e63] p-6 rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,0.15)] text-center font-mono max-w-md mx-auto">
      <Heart size={32} className="mx-auto text-[#e91e63] mb-2 animate-pulse" />
      <h2 className="font-black text-lg text-[#2d2d2d]">How are you feeling today?</h2>
      <p className="text-[10px] text-gray-500 mb-4">No judgment. Just checking in.</p>
      
      <div className="flex justify-center gap-3">
        <button onClick={() => handleResponse("peaceful")} className="bg-white p-3 rounded-full border-2 border-[#2d2d2d] shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.2)] transition">
          <Sparkles size={20} className="text-[#ffbc51]" />
        </button>
        <button onClick={() => handleResponse("tired")} className="bg-white p-3 rounded-full border-2 border-[#2d2d2d] shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.2)] transition">
          <Moon size={20} className="text-[#005a8d]" />
        </button>
        <button onClick={() => handleResponse("loved")} className="bg-white p-3 rounded-full border-2 border-[#2d2d2d] shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.2)] transition">
          <Heart size={20} className="text-[#ff6d8b]" />
        </button>
      </div>
    </div>
  );
}