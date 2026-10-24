import React, { useState } from 'react';
import { Upload, DollarSign, Flame, Star } from 'lucide-react';

export default function RecipeSubmissionForm({ onRecipeSubmit }) {
  const [title, setTitle] = useState("");
  const [chain, setChain] = useState("");
  const [restaurantPrice, setRestaurantPrice] = useState("");
  const [homePrice, setHomePrice] = useState("");
  const [recipe, setRecipe] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const base = import.meta.env.VITE_API_BASE ?? '';
    if (!base) {
      alert("Recipe submissions are coming soon! We'll notify you when community sharing goes live.");
      return;
    }
    fetch(`${base}/api/submit_recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1, title, chain, restaurantPrice, homePrice, recipe }),
    })
      .then(res => {
        if (res.ok) {
          alert("Recipe posted! You're now on the Leaderboard!");
          onRecipeSubmit();
        } else {
          alert('Something went wrong — please try again.');
        }
      })
      .catch(() => alert('Unable to submit right now. Please try again later.'));
  };

  return (
    <div className="bg-white border-[4px] border-[#33302A] p-5 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] mb-6">
      <div className="flex items-center gap-2 mb-4 border-b-2 border-[#33302A] pb-2">
        <Flame size={18} className="text-[#e83e8c]" />
        <h3 className="text-sm font-black uppercase">Submit a Restaurant Dupe</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input type="text" placeholder="Recipe Name (e.g., Chick-fil-A Sauce)" value={title} onChange={e => setTitle(e.target.value)} className="border-[3px] border-[#d4cfc4] p-2 bg-[#F3EADA]" required />
          <input type="text" placeholder="Restaurant Chain" value={chain} onChange={e => setChain(e.target.value)} className="border-[3px] border-[#d4cfc4] p-2 bg-[#F3EADA]" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center border-[3px] border-[#d4cfc4] bg-[#F3EADA] p-2">
            <DollarSign size={16} className="text-gray-400 mr-2" />
            <input type="number" placeholder="Cost eating out" value={restaurantPrice} onChange={e => setRestaurantPrice(e.target.value)} className="bg-transparent outline-none w-full" required />
          </div>
          <div className="flex items-center border-[3px] border-[#d4cfc4] bg-[#F3EADA] p-2">
            <DollarSign size={16} className="text-[#a8d672] mr-2" />
            <input type="number" placeholder="Cost to make at home" value={homePrice} onChange={e => setHomePrice(e.target.value)} className="bg-transparent outline-none w-full" required />
          </div>
        </div>
        <textarea placeholder="Paste your detailed recipe & secret hacks here..." value={recipe} onChange={e => setRecipe(e.target.value)} rows={4} className="w-full border-[3px] border-[#d4cfc4] p-2 bg-[#F3EADA]" required />
        <button type="submit" className="w-full bg-[#e83e8c] text-white font-black py-3 border-[4px] border-[#a32a63] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-x-[4px] active:translate-y-[4px] transition-all flex justify-center items-center gap-2 text-lg">
          <Upload size={20} /> Publish to Community
        </button>
      </form>
    </div>
  );
}