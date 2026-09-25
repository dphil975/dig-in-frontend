import React, { useState, useEffect } from 'react';
import { HeartPulse, Activity, Scale, FlaskConical, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function ClinicalNutritionAI({ recipeData }) {
  const [userProfile, setUserProfile] = useState({
    age: 28, gender: "female", weight_kg: 65, height_cm: 165, 
    activity: 1.375, medical_condition: "none", life_stage: "adult"
  });
  
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = () => {
    // Simulate hitting the backend to calculate BMR and check Medical interactions
    const bmr = 1325; // Mocked BMR
    const tdee = bmr * userProfile.activity;
    
    setAnalysis({
      bmr: bmr,
      tdee: tdee,
      recipe_calories: 650,
      compatibility: "This meal fits well within your daily metabolic budget.",
      experimental_swap: "Replace the all-purpose flour with almond flour to lower the glycemic index.",
      medical_note: "No contraindications found for your selected profile."
    });
  };

  return (
    <div className="bg-white border-[4px] border-[#33302A] p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.25)] mb-6">
      <div className="flex items-center gap-2 border-b-2 border-[#33302A] pb-2 mb-4">
        <ShieldCheck size={20} className="text-[#a8d672]" />
        <h2 className="font-black text-lg">Clinical & Metabolic AI</h2>
      </div>

      {/* User Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-[#fcfaf0] p-4 border-2 border-[#d4cfc4]">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Age</label>
          <input type="number" value={userProfile.age} onChange={e => setUserProfile({...userProfile, age: parseInt(e.target.value)})} className="w-full bg-white border-2 border-[#d4cfc4] p-1 font-mono" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Weight (kg)</label>
          <input type="number" value={userProfile.weight_kg} onChange={e => setUserProfile({...userProfile, weight_kg: parseInt(e.target.value)})} className="w-full bg-white border-2 border-[#d4cfc4] p-1 font-mono" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Medical Condition</label>
          <select value={userProfile.medical_condition} onChange={e => setUserProfile({...userProfile, medical_condition: e.target.value})} className="w-full bg-white border-2 border-[#d4cfc4] p-1 font-mono">
            <option value="none">None</option>
            <option value="type_2_diabetes">Type 2 Diabetes</option>
            <option value="hypertension">Hypertension</option>
            <option value="celiac_disease">Celiac Disease</option>
          </select>
        </div>
      </div>
      
      <button onClick={handleAnalyze} className="w-full bg-[#005a8d] text-white font-bold py-2 border-[3px] border-[#003d5c] shadow-[3px_3px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm mb-4 flex justify-center items-center gap-2">
        <Activity size={16} /> Analyze Recipe for My Profile
      </button>

      {/* Results Section */}
      {analysis && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Metabolic Summary */}
          <div className="bg-[#33302A] text-white p-4 border-2 border-[#a8d672] shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse size={18} className="text-[#ff6d8b]" />
              <h4 className="font-bold text-sm uppercase tracking-widest text-[#a8d672]">Metabolic Profile</h4>
            </div>
            <div className="grid grid-cols-2 text-sm font-mono border-b border-[#555] pb-2 mb-2">
              <div>Basal Metabolic Rate: <span className="font-bold text-[#eaff66]">{analysis.bmr} kcal</span></div>
              <div>Daily Energy Need: <span className="font-bold text-[#ffbc51]">{analysis.tdee} kcal</span></div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span>Recipe Calories: {analysis.recipe_calories} kcal</span>
              <span className={analysis.recipe_calories < analysis.tdee * 0.3 ? "text-[#a8d672]" : "text-[#ff6d8b]"}>
                {analysis.compatibility}
              </span>
            </div>
          </div>

          {/* Experimental Foods Swap */}
          <div className="bg-[#fcfaf0] border-2 border-[#ffbc51] p-4">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical size={18} className="text-[#ffbc51]" />
              <h4 className="font-bold text-sm uppercase tracking-widest text-[#33302A]">Experimental Foods Modification</h4>
            </div>
            <p className="text-sm font-mono leading-relaxed">{analysis.experimental_swap}</p>
          </div>

          {/* Medical Warning (If applicable) */}
          {userProfile.medical_condition !== "none" && (
            <div className="bg-[#fcf4f4] border-2 border-[#ff6d8b] p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-[#ff6d8b]" />
                <h4 className="font-bold text-sm uppercase tracking-widest text-[#ff6d8b]">Medical Nutrition Therapy Advisory</h4>
              </div>
              <p className="text-sm font-mono leading-relaxed text-[#33302A]">
                {analysis.medical_note}
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}