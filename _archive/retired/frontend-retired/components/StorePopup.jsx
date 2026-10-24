import React from 'react';
import { X, Navigation, Clock, Car } from 'lucide-react';

export default function StorePopup({ store, onClose }) {
  
  // Determine status color based on travel time
  const getTrafficColor = (minutes) => {
    if (minutes < 10) return "text-[#a8d672]"; // Green
    if (minutes < 20) return "text-[#ffbc51]"; // Yellow
    return "text-[#ff6d8b]"; // Red
  };

  return (
    <div className="bg-[#F3EADA] font-mono relative w-full min-h-[250px] flex flex-col p-4 border-[4px] border-[#33302A]">
      
      {/* Close Button */}
      <button onClick={onClose} className="absolute top-2 right-2 text-[#33302A] hover:text-[#ff6d8b] z-50">
        <X size={20} strokeWidth={3} />
      </button>

      {/* Deal / Sale Badge */}
      {store.deal ? (
        <div className="bg-[#ffbc51] border-[3px] border-[#33302A] p-2 mb-3 shadow-[3px_3px_0px_rgba(0,0,0,0.3)] flex justify-between items-center">
          <span className="font-bold text-xs uppercase">{store.deal.item}</span>
          <span className="font-black text-sm">{store.deal.price}</span>
        </div>
      ) : (
        <div className="bg-[#33302A] text-white p-2 mb-3 border border-[#555] text-center text-[10px] uppercase font-bold tracking-widest">
          {store.name}
        </div>
      )}

      {/* Store Details */}
      <div className="flex flex-col gap-1 mb-3">
        <div className="text-[#ff6d8b] font-bold text-xs tracking-widest uppercase">{store.type}</div>
        <div className="font-bold text-base">{store.name}</div>
        <div className="text-xs text-[#33302A]/60">{store.address}</div>
        <div className="flex items-center gap-2 text-xs text-[#33302A]/80 mt-1 border-b border-[#d4cfc4] pb-2">
          <Clock size={12} /> {store.hours}
        </div>
      </div>

      {/* TRAFFIC & LOGISTICS ROW (The New Big Feature) */}
      <div className="bg-[#fcfaf0] border-2 border-[#d4cfc4] p-3 mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Car size={18} className="text-[#33302A]" />
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Est. Drive Time</div>
            <div className={`text-lg font-black ${getTrafficColor(store.travel_time_min)}`}>
              {store.travel_time_min} min
            </div>
          </div>
        </div>
        <div className="text-[10px] text-right text-[#33302A]/60">
          Avg traffic for this time
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {store.website && (
          <a href={store.website} target="_blank" rel="noreferrer">
            <button className="w-full border-[2px] border-[#ff6d8b] bg-transparent font-bold py-2 text-xs shadow-[2px_2px_0px_rgba(255,109,139,0.5)] hover:bg-[#ff6d8b] hover:text-white transition-colors">
              Visit website
            </button>
          </a>
        )}
        <button className="w-full bg-[#33302A] text-white font-bold py-3 flex justify-center items-center gap-2 border-[3px] border-[#555] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-x-[3px] active:translate-y-[3px] transition-all text-sm">
          <Navigation size={16} strokeWidth={3} /> Get Directions
        </button>
      </div>
      
    </div>
  );
}