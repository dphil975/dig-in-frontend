import React, { useState } from 'react';
import { Globe, Sun, Moon, Coffee, Utensils } from 'lucide-react';

export default function CulturalMealSwitcher({ onCultureChange, onMealChange }) {
  const [selectedCulture, setSelectedCulture] = useState("MX");
  const [selectedMeal, setSelectedMeal] = useState("Breakfast");

  const handleCultureChange = (e) => {
    const newCulture = e.target.value;
    setSelectedCulture(newCulture);
    onCultureChange(newCulture);
  };

  const handleMealChange = (meal) => {
    setSelectedMeal(meal);
    onMealChange(meal);
  };

  return (
    <div className="bg-white border-[4px] border-[#33302A] p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.25)] mb-4">
      <div className="flex items-center gap-2 border-b-2 border-[#33302A] pb-2 mb-3">
        <Globe size={20} className="text-[#005a8d]" />
        <h3 className="font-black text-sm uppercase tracking-wider">Cultural Compass</h3>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Culture Selector */}
        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
            Your Culinary Heritage
          </label>
          <select 
            value={selectedCulture} 
            onChange={handleCultureChange}
            className="w-full bg-[#fcfaf0] border-2 border-[#d4cfc4] p-2 text-sm font-mono outline-none"
          >
            <option value="MX">🇲🇽 Mexico</option>
            <option value="JP">🇯🇵 Japan</option>
            <option value="IT">🇮🇹 Italy</option>
            <option value="US">🇺🇸 United States</option>
          </select>
        </div>

        {/* Meal Time Selector */}
        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
            Current Meal Time
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            <button 
              onClick={() => handleMealChange("Breakfast")}
              className={`flex flex-col items-center py-1 border-2 transition-all ${selectedMeal === "Breakfast" ? 'border-[#33302A] bg-[#fcfaf0]' : 'border-transparent text-gray-400'}`}
            >
              <Sun size={16} /> <span className="text-[10px] uppercase font-bold">Break</span>
            </button>
            <button 
              onClick={() => handleMealChange("Lunch")}
              className={`flex flex-col items-center py-1 border-2 transition-all ${selectedMeal === "Lunch" ? 'border-[#33302A] bg-[#fcfaf0]' : 'border-transparent text-gray-400'}`}
            >
              <Utensils size={16} /> <span className="text-[10px] uppercase font-bold">Lunch</span>
            </button>
            <button 
              onClick={() => handleMealChange("Snack")}
              className={`flex flex-col items-center py-1 border-2 transition-all ${selectedMeal === "Snack" ? 'border-[#33302A] bg-[#fcfaf0]' : 'border-transparent text-gray-400'}`}
            >
              <Coffee size={16} /> <span className="text-[10px] uppercase font-bold">Snack</span>
            </button>
            <button 
              onClick={() => handleMealChange("Dinner")}
              className={`flex flex-col items-center py-1 border-2 transition-all ${selectedMeal === "Dinner" ? 'border-[#33302A] bg-[#fcfaf0]' : 'border-transparent text-gray-400'}`}
            >
              <Moon size={16} /> <span className="text-[10px] uppercase font-bold">Dinner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}