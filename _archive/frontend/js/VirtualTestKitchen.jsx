import React, { useState, useRef } from 'react';
import { Play, RotateCcw, FlaskConical, CheckCircle, XCircle } from 'lucide-react';

export default function VirtualTestKitchen({ recipe }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  // The "Practice" Steps
  const steps = [
    { id: 1, instruction: "Add 1 cup of flour to the bowl.", action: "add_flour" },
    { id: 2, instruction: "Whisk in the eggs.", action: "whisk_eggs" },
    { id: 3, instruction: "Heat the butter until it melts.", action: "heat_butter" }
  ];

  const handleAction = (action) => {
    const current = steps[currentStep];
    if (action === current.action) {
      setScore(score + 10);
      setFeedback({ type: "success", message: "Correct! Great job." });
      if (currentStep === steps.length - 1) {
        setIsComplete(true);
      } else {
        setTimeout(() => setCurrentStep(currentStep + 1), 1000);
      }
    } else {
      setFeedback({ type: "error", message: "Oops! Try reading the instruction again." });
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  if (isComplete) {
    return (
      <div className="bg-[#1a1a2e] border-4 border-[#a8d672] p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] text-white font-mono max-w-md mx-auto text-center">
        <div className="text-4xl mb-2">🍪</div>
        <h2 className="font-bold text-xl text-[#a8d672]">Practice Complete!</h2>
        <p className="text-sm text-gray-400 mb-4">You have mastered the chemistry of this recipe.</p>
        <button className="bg-[#eaff66] text-[#1a1a2e] font-black px-6 py-2 border-2 border-[#2d2d2d] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm uppercase">
          Cook for Real
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a2e] border-4 border-[#eaff66] p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] text-white font-mono max-w-md mx-auto relative">
      
      {/* Game Header */}
      <div className="flex justify-between items-center border-b border-[#eaff66]/30 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Play size={16} className="text-[#eaff66]" />
          <span className="font-bold text-sm uppercase tracking-widest">Practice Kitchen</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <FlaskConical size={12} className="text-[#ffbc51]" />
          <span>Step {currentStep + 1} of {steps.length}</span>
        </div>
      </div>

      {/* The Instruction Card */}
      <div className="bg-[#2d2d2d] border-2 border-[#555] p-4 mb-4 min-h-[100px] flex items-center justify-center text-center">
        <p className="text-lg font-bold text-[#eaff66]">{steps[currentStep].instruction}</p>
      </div>

      {/* The Action Buttons (The "Game" Controls) */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button onClick={() => handleAction("add_flour")} className="bg-[#d4cfc4] text-[#1a1a2e] py-2 border-2 border-[#2d2d2d] font-bold text-sm hover:bg-white transition">Add Flour</button>
        <button onClick={() => handleAction("whisk_eggs")} className="bg-[#d4cfc4] text-[#1a1a2e] py-2 border-2 border-[#2d2d2d] font-bold text-sm hover:bg-white transition">Whisk</button>
        <button onClick={() => handleAction("heat_butter")} className="bg-[#d4cfc4] text-[#1a1a2e] py-2 border-2 border-[#2d2d2d] font-bold text-sm hover:bg-white transition">Heat</button>
        <button onClick={() => handleAction("chop_veggies")} className="bg-[#d4cfc4] text-[#1a1a2e] py-2 border-2 border-[#2d2d2d] font-bold text-sm hover:bg-white transition">Chop</button>
      </div>

      {/* Feedback Area */}
      {feedback && (
        <div className={`p-2 border-2 text-center text-sm font-mono animate-in fade-in zoom-in-95 duration-200 ${feedback.type === 'success' ? 'border-[#a8d672] text-[#a8d672] bg-[#2d2d2d]' : 'border-[#ff6d8b] text-[#ff6d8b] bg-[#2d2d2d]'}`}>
          {feedback.type === 'success' ? <CheckCircle size={16} className="inline mr-1" /> : <XCircle size={16} className="inline mr-1" />}
          {feedback.message}
        </div>
      )}

      <div className="mt-4 flex justify-between items-center text-xs text-gray-400 border-t border-[#eaff66]/30 pt-2">
        <span>Score: {score}</span>
        <button className="flex items-center gap-1 hover:text-white transition"><RotateCcw size={12} /> Reset</button>
      </div>
    </div>
  );
}