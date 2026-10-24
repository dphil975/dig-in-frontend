import React, { useState, useEffect } from 'react';
import { Footprints, Flame, Apple, Zap, TrendingUp } from 'lucide-react';

export default function StepQuestCard({ recipe, userDailySteps }) {
  const [stepCost, setStepCost] = useState(null);
  const [showLoophole, setShowLoophole] = useState(false);

  useEffect(() => {
    // Simulate fetching the physics data
    // In production: fetch(`/api/nutritional_physics?calories=${recipe.calories}`)
    setStepCost({
      calories: recipe.calories,
      steps_required: Math.ceil(recipe.calories / 0.045),
      miles_required: (recipe.calories / 100).toFixed(1), // 100 cal per mile avg
    });
  }, [recipe]);

  if (!stepCost) return <div className="p-2 text-center text-xs">Calculating your quest...</div>;

  // "Girl Math" Justification
  const canEat = userDailySteps >= stepCost.steps_required;

  return (
    <div className="bg-[#1a1a2e] border-2 border-[#eaff66] p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] text-white font-mono w-full">
      
      <div className="flex justify-between items-center border-b border-[#eaff66]/30 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Footprints size={16} className="text-[#eaff66]" />
          <span className="font-bold text-sm uppercase tracking-widest">Step Quest</span>
        </div>
        <span className="text-[10px] bg-[#2d2d2d] px-2 py-0.5 border border-[#555]">{recipe.calories} Cal</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#2d2d2d] p-2 border border-[#555] text-center">
          <div className="text-[10px] text-gray-400">Steps to Burn</div>
          <div className="text-xl font-black text-[#ffbc51]">{stepCost.steps_required.toLocaleString()}</div>
        </div>
        <div className="bg-[#2d2d2d] p-2 border border-[#555] text-center">
          <div className="text-[10px] text-gray-400">Miles to Walk</div>
          <div className="text-xl font-black text-[#a8d672]">{stepCost.miles_required} mi</div>
        </div>
      </div>

      {/* "Girl Math" Justification Bar */}
      <div className={`p-3 border-2 mb-3 flex justify-between items-center ${canEat ? 'border-[#a8d672] bg-[#2d2d2d]' : 'border-[#ff6d8b] bg-[#2d2d2d]'}`}>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400">Today's Steps</span>
          <span className="font-bold text-lg">{userDailySteps.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          {canEat ? (
            <div className="text-[#a8d672] font-bold text-sm flex items-center gap-1">
              <Apple size={16} /> Earned! 🍎
            </div>
          ) : (
            <div className="text-[#ff6d8b] font-bold text-sm flex items-center gap-1">
              <Zap size={16} /> Need {stepCost.steps_required - userDailySteps} more
            </div>
          )}
        </div>
      </div>

      {/* The "Healthy Loophole" Toggle */}
      <button 
        onClick={() => setShowLoophole(!showLoophole)}
        className="w-full bg-[#eaff66] text-[#1a1a2e] font-bold py-2 border-2 border-[#2d2d2d] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] transition-all text-xs flex justify-center items-center gap-2 uppercase tracking-widest"
      >
        {showLoophole ? "Hide Healthy Hack" : "Find a Healthy Loophole"}
      </button>

      {showLoophole && (
        <div className="mt-3 p-3 bg-[#2d2d2d] border-2 border-[#ffbc51] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-[#ffbc51]" />
            <span className="font-bold text-xs text-[#ffbc51] uppercase">The Loophole</span>
          </div>
          <p className="text-xs font-mono leading-relaxed text-gray-300">
            We swapped the heavy cream for <span className="font-bold text-white">pureed zucchini</span>. 
            It adds moisture and fiber, and you won't taste a thing. 
            <span className="block text-[10px] text-[#a8d672] mt-1">Nutrition: -40% sugar, +30% fiber.</span>
          </p>
        </div>
      )}
    </div>
  );
}