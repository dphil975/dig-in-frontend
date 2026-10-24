import React, { useState } from 'react';
import { ShoppingCart, ChefHat, Users, Plus, CheckCircle, MapPin } from 'lucide-react';

export default function NineItemGrid() {
  const [fusionChoice, setFusionChoice] = useState(null);
  const [isHosting, setIsHosting] = useState(false);

  const baseItems = ["Flour", "Butter", "Sugar", "Eggs", "Chicken Thighs", "Rice", "Canned Tomatoes", "Onions", "Garlic"];
  const fusionOptions = ["Gochujang", "Cinnamon", "Kimchi", "Soy Sauce"];

  const handleHostDinner = () => {
    setIsHosting(true);
    // In production, this triggers the CommunityTableEngine to find guests.
    setTimeout(() => setIsHosting(false), 2000);
  };

  return (
    <div className="bg-[#fcf9f2] border-[4px] border-[#2d2d2d] p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.25)] max-w-md mx-auto font-mono">
      
      <div className="flex items-center gap-2 border-b-2 border-[#2d2d2d] pb-2 mb-3">
        <ShoppingCart size={18} className="text-[#ffbc51]" />
        <h2 className="font-bold text-sm uppercase tracking-widest">The 9-Item Grid</h2>
        <span className="ml-auto text-[10px] bg-[#a8d672] px-2 py-0.5 border border-[#2d2d2d] font-bold">$18.75 Total</span>
      </div>

      {/* The Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {baseItems.map((item, idx) => (
          <div key={idx} className="bg-white border-2 border-[#d4cfc4] p-2 text-center text-xs font-bold hover:bg-[#fcfaf0] transition">
            {item}
          </div>
        ))}
      </div>

      {/* The Fusion Challenge */}
      <div className="bg-[#1a1a2e] border-2 border-[#eaff66] p-3 mb-4 text-white">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Fusion Challenge</p>
        <p className="text-sm">Choose a condiment to transform your grid.</p>
        <div className="flex gap-2 mt-2">
          {fusionOptions.map((opt) => (
            <button 
              key={opt}
              onClick={() => setFusionChoice(opt)}
              className={`px-2 py-1 border text-[10px] transition ${fusionChoice === opt ? 'bg-[#eaff66] text-[#1a1a2e] border-[#2d2d2d]' : 'bg-[#2d2d2d] text-white border-[#555] hover:bg-[#3a3a3a]'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* The Social Action */}
      <div className="flex gap-2">
        <button 
          onClick={handleHostDinner}
          className="flex-1 bg-[#ffbc51] text-[#1a1a2e] font-bold py-2 border-2 border-[#2d2d2d] shadow-[2px_2px_0px_rgba(0,0,0,0.2)] active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm flex justify-center items-center gap-2"
        >
          {isHosting ? <CheckCircle size={16} /> : <Users size={16} />} 
          {isHosting ? "Invite Sent!" : "Host a Dinner"}
        </button>
        <button className="flex-1 bg-white border-2 border-[#2d2d2d] font-bold py-2 text-sm flex justify-center items-center gap-2 hover:bg-[#f4f2eb] transition">
          <MapPin size={16} /> Find a Table
        </button>
      </div>
    </div>
  );
}