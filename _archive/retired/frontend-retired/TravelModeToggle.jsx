import React, { useState } from 'react';
import { Plane, Train, Bike, MapPin } from 'lucide-react';

export default function TravelModeToggle({ onTravelModeChange }) {
  const [mode, setMode] = useState("stationary");

  const handleToggle = (newMode) => {
    setMode(newMode);
    onTravelModeChange(newMode);
  };

  return (
    <div className="bg-white border-[4px] border-[#33302A] p-3 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] mb-4">
      <div className="flex justify-between items-center">
        <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <MapPin size={14} /> Travel Mode
        </span>
        <div className="flex gap-1">
          <button 
            onClick={() => handleToggle("stationary")}
            className={`px-3 py-1 border-2 text-xs font-bold transition-all ${mode === "stationary" ? 'bg-[#33302A] text-white border-[#555]' : 'bg-[#fcfaf0] border-[#d4cfc4]'}`}
          >
            Stay
          </button>
          <button 
            onClick={() => handleToggle("flying")}
            className={`flex items-center gap-1 px-3 py-1 border-2 text-xs font-bold transition-all ${mode === "flying" ? 'bg-[#007aff] text-white border-[#005a8d]' : 'bg-[#fcfaf0] border-[#d4cfc4]'}`}
          >
            <Plane size={12} /> Fly
          </button>
          <button 
            onClick={() => handleToggle("train")}
            className={`flex items-center gap-1 px-3 py-1 border-2 text-xs font-bold transition-all ${mode === "train" ? 'bg-[#a8d672] text-white border-[#6a9e4a]' : 'bg-[#fcfaf0] border-[#d4cfc4]'}`}
          >
            <Train size={12} /> Rail
          </button>
        </div>
      </div>
      <p className="text-[10px] text-gray-500 mt-2">
        *Your travel mode helps us recommend equipment and storage solutions for your journey.
      </p>
    </div>
  );
}