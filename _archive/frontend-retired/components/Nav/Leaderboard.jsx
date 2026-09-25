import React, { useState, useEffect } from 'react';
import { Trophy, ThumbsUp, MapPin, Users, Crown } from 'lucide-react';

export default function Leaderboard({ zipCode }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE ?? '';
    if (!base) { setLoading(false); return; }
    fetch(`${base}/api/leaderboard/${zipCode}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setRecipes(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [zipCode]);

  if (loading) return <div className="text-center text-sm font-bold animate-pulse">Loading local bests...</div>;
  if (!recipes.length) return (
    <div className="bg-white border-[4px] border-[#33302A] p-5 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] mb-6 text-center">
      <Trophy size={28} className="text-[#ffbc51] mx-auto mb-2" />
      <p className="font-black text-sm uppercase mb-1">Leaderboard Coming Soon</p>
      <p className="text-xs text-gray-500">Be the first to post a restaurant dupe in your area!</p>
    </div>
  );

  return (
    <div className="bg-white border-[4px] border-[#33302A] p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] mb-6">
      <div className="flex justify-between items-center border-b-2 border-[#33302A] pb-2 mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-[#ffbc51]" />
          <h3 className="font-black uppercase text-sm">Local Bake-Off Leaderboard</h3>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <MapPin size={12} /> {zipCode}
        </div>
      </div>

      <div className="space-y-3">
        {recipes.map((recipe, index) => (
          <div key={recipe.id} className={`p-3 border-[3px] border-[#d4cfc4] bg-[#F3EADA] flex justify-between items-center relative ${index === 0 ? 'border-[#ffbc51] bg-[#fff8e1]' : ''}`}>
            <div className="flex items-center gap-3">
              <span className={`font-black text-xl ${index === 0 ? 'text-[#ffbc51]' : 'text-gray-400'}`}>
                #{index + 1}
              </span>
              <div>
                <h4 className="font-bold text-sm leading-tight">{recipe.title}</h4>
                <p className="text-[10px] text-gray-500">Dupe of: {recipe.restaurant_chain}</p>
                <div className="flex gap-2 mt-1 text-[10px]">
                  <span className="bg-[#a8d672] px-1 border border-[#33302A]">Save ${(recipe.original_restaurant_price - recipe.home_cost_per_serving).toFixed(2)}/meal</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {recipe.successful_bake_off_reports || 0} won</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <button className="flex items-center gap-1 bg-[#005a8d] text-white px-2 py-0.5 border border-[#003d5c] text-[10px] font-bold shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
                <ThumbsUp size={12} /> {recipe.upvotes}
              </button>
              {index === 0 && <span className="text-[8px] text-[#ffbc51] mt-1 font-bold uppercase flex items-center gap-1"><Crown size={10} /> Reigning Champ</span>}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 border-t border-[#d4cfc4] pt-3 text-center">
        <button className="text-[#005a8d] text-xs font-bold uppercase tracking-wider hover:underline">
          Host a local bake-off in your area
        </button>
      </div>
    </div>
  );
}