import React, { useState } from 'react';
import { Music, Shield, ChefHat } from 'lucide-react';

export default function SomaticPortal({ shadowProfile }) {
  const [harmony, setHarmony] = useState(null);

  const activateHarmony = () => {
    // In production, this fetches from the backend
    setHarmony({
      blocked_chakra: "Heart",
      frequency: 528,
      color: "#a8d672",
      note: "F",
      food_texture: "Leafy greens, herbs, bitter, vibrant",
      shadow_affirmation: "I am worthy of love. I open my heart safely."
    });
  };

  return (
    <div 
      className="relative w-full h-[600px] overflow-hidden font-mono text-white flex flex-col items-center justify-center transition-all duration-1000"
      style={{ backgroundColor: harmony ? harmony.color : '#1a1a2e' }}
    >
      {/* The Frequency Wave Visualizer */}
      {harmony && (
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <svg className="w-full h-full">
            <path d="M0,300 Q100,100 200,300 T400,300 T600,300 T800,300 T1000,300 T1200,300" stroke="white" strokeWidth="2" fill="none" className="animate-pulse" />
          </svg>
        </div>
      )}

      <div className="relative z-10 text-center max-w-lg px-6">
        {!harmony ? (
          <button onClick={activateHarmony} className="bg-white text-[#1a1a2e] font-black py-3 px-6 border-4 border-[#2d2d2d] shadow-[6px_6px_0px_rgba(0,0,0,0.5)] active:translate-x-[3px] active:translate-y-[3px] transition-all text-sm uppercase tracking-widest">
            <Shield size={18} className="inline mr-2" /> Activate Somatic Shield
          </button>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-700 space-y-6">
            
            {/* The Musical Note + Frequency */}
            <div className="flex items-center justify-center gap-2">
              <Music size={24} />
              <span className="text-3xl font-black">Note {harmony.note}</span>
            </div>
            <div className="text-6xl font-black tracking-tighter animate-pulse">
              {harmony.frequency} Hz
            </div>

            {/* The Shadow Affirmation */}
            <div className="bg-white/20 backdrop-blur-sm border-2 border-white p-4 rounded-xl">
              <p className="text-sm font-mono leading-relaxed">
                {harmony.shadow_affirmation}
              </p>
            </div>

            {/* The Culinary Prescription */}
            <div className="bg-black/30 p-4 rounded-xl border border-white/30">
              <ChefHat size={16} className="inline mr-2" />
              <span className="font-bold text-sm uppercase tracking-widest">Today's Culinary Prescription</span>
              <p className="text-xs mt-2 leading-relaxed font-mono">
                Your shadow is asking for grounding. To heal your <span className="font-bold text-white">{harmony.blocked_chakra}</span> chakra, 
                we are making a dish of <span className="font-bold">{harmony.food_texture}</span>. 
                This meal is your mathematical anchor. Eat it slowly. Feel your nervous system shift.
              </p>
            </div>

            <button className="bg-white text-[#1a1a2e] font-black py-2 px-6 border-2 border-[#2d2d2d] shadow-[4px_4px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] transition-all text-xs uppercase tracking-widest">
              Start Cooking the Frequency
            </button>
          </div>
        )}
      </div>
    </div>
  );
}