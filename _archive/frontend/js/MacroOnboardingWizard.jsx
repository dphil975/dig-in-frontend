import React, { useState } from 'react';
import { Weight, Flame, Zap, ArrowRight } from 'lucide-react';

export default function MacroOnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [weight, setWeight] = useState(70);
  const [goal, setGoal] = useState("Maintenance");

  const handleNext = () => {
    if (step === 2) {
      onComplete({ weight, goal });
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="bg-[#1a1a2e] border-4 border-[#eaff66] p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] text-white max-w-md mx-auto font-mono">
      
      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center gap-2 mb-4 border-b border-[#eaff66]/30 pb-2">
            <Weight size={20} className="text-[#ffbc51]" />
            <h2 className="text-lg font-black uppercase tracking-wider">Your Physical DNA</h2>
          </div>
          <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
            Enter your body weight (kg)
          </label>
          <div className="flex items-center gap-4">
            <input 
              type="number" 
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value))}
              className="flex-1 bg-[#2d2d2d] border-2 border-[#555] p-3 text-white text-2xl font-bold outline-none focus:border-[#eaff66]"
            />
            <span className="font-bold text-gray-400">kg</span>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center gap-2 mb-4 border-b border-[#eaff66]/30 pb-2">
            <Zap size={20} className="text-[#eaff66]" />
            <h2 className="text-lg font-black uppercase tracking-wider">Your Primary Goal</h2>
          </div>
          <div className="space-y-2">
            {["Muscle", "Fat Loss", "Maintenance"].map((opt) => (
              <button
                key={opt}
                onClick={() => setGoal(opt)}
                className={`w-full text-left p-3 border-2 font-bold transition-all ${goal === opt ? 'bg-[#eaff66] text-[#1a1a2e] border-[#2d2d2d]' : 'bg-[#2d2d2d] text-white border-[#555] hover:bg-[#3a3a3a]'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      <button 
        onClick={handleNext}
        className="w-full mt-6 bg-[#eaff66] text-[#1a1a2e] font-black py-3 border-[4px] border-[#2d2d2d] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-x-[3px] active:translate-y-[3px] transition-all flex justify-center items-center gap-2 text-lg uppercase tracking-widest"
      >
        {step === 2 ? "Start My Macro Quest" : "Next"} <ArrowRight size={18} />
      </button>
    </div>
  );
}
