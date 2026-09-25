import React, { useState } from 'react';
import { MapPin, Navigation, Search, Filter } from 'lucide-react';
import { TEXAS_REGIONS } from './texasRegions';

export default function TexasRegionSelector({ onRegionSelect }) {
  const [activeRegion, setActiveRegion] = useState("North Texas (DFW)");

  const handleRegionChange = (region) => {
    setActiveRegion(region);
    onRegionSelect(region);
  };

  return (
    <div className="bg-white border-[4px] border-[#33302A] p-3 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] mb-4">
      <div className="flex items-center gap-2 border-b-2 border-[#33302A] pb-2 mb-3">
        <MapPin size={18} className="text-[#ff6d8b]" />
        <h3 className="font-black text-sm uppercase tracking-wider">Texas Metro Search</h3>
        <span className="ml-auto text-[10px] bg-[#fcfaf0] px-2 py-0.5 border border-[#d4cfc4]">5 Regions</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.keys(TEXAS_REGIONS).map((region) => (
          <button
            key={region}
            onClick={() => handleRegionChange(region)}
            className={`
              px-4 py-2 border-[3px] font-bold text-xs transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.2)]
              ${activeRegion === region 
                ? 'bg-[#33302A] text-white border-[#555]' 
                : 'bg-[#fcfaf0] text-[#33302A] border-[#d4cfc4] hover:bg-[#e8e4db]'}
            `}
          >
            {region}
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-[#d4cfc4] flex gap-2">
        <input 
          type="text" 
          placeholder="Search a specific county (e.g., Travis, Dallas)..."
          className="flex-1 border-2 border-[#d4cfc4] p-2 text-sm outline-none focus:border-[#33302A]"
        />
        <button className="bg-[#33302A] text-white px-4 py-2 border-2 border-[#555] shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
          <Search size={16} />
        </button>
      </div>
    </div>
  );
}