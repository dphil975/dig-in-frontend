import React, { useState } from 'react';
import { Camera, CheckCircle, AlertCircle, Beaker, Upload, Zap } from 'lucide-react';

export default function RecipeProgressTracker({ recipeSteps, currentStepIndex }) {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const currentStep = recipeSteps[currentStepIndex];
  const isPremium = false; // Hook into your payment system

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
        // Automatically trigger AI analysis
        analyzeImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData) => {
    setIsAnalyzing(true);
    // Simulate hitting the AI backend
    setTimeout(() => {
      // Mock result based on the current step
      const mockResult = {
        success: Math.random() > 0.4, // 60% chance of passing, 40% chance of error
        error_description: "The sauce looks grainy and separated.",
        chemistry_reason: "You likely added the cream while the pan was too hot, causing the proteins to curdle.",
        ai_recommendation: "Remove from heat. Add 1 tablespoon of cold water and whisk vigorously to re-emulsify. Do not boil it again.",
        creator_fix: (Math.random() > 0.8) ? "Chef_Hacks: Add a pinch of cornstarch slurry to bind it back together instantly." : null
      };
      setAiAnalysis(mockResult);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="bg-white border-[4px] border-[#33302A] p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.25)] mb-6">
      <div className="flex justify-between items-center border-b-2 border-[#33302A] pb-2 mb-4">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Zap size={20} className="text-[#ffbc51]" /> Visual Progress AI
        </h2>
        {isPremium && <span className="bg-[#eaff66] text-[#33302A] text-[10px] px-2 py-0.5 font-bold border border-[#33302A] uppercase">Creator Mode</span>}
      </div>

      {/* Step Display */}
      <div className="mb-4 bg-[#fcfaf0] p-4 border-2 border-[#d4cfc4]">
        <h3 className="font-bold text-sm">Step {currentStepIndex + 1}: {currentStep}</h3>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-[#d4cfc4] p-6 text-center bg-[#F3EADA]">
        {!uploadedImage ? (
          <div className="flex flex-col items-center gap-2">
            <Camera size={40} className="text-[#33302A]/30" />
            <p className="text-sm font-mono text-[#33302A]/60">Upload a photo of this step to check for errors</p>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="stepPhoto" />
            <label htmlFor="stepPhoto" className="cursor-pointer bg-[#005a8d] text-white px-4 py-2 border-[3px] border-[#003d5c] shadow-[3px_3px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm font-bold flex items-center gap-2">
              <Upload size={16} /> Upload Progress
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <img src={uploadedImage} alt="Cooking Progress" className="w-full h-48 object-cover border-2 border-[#33302A]" />
            
            {isAnalyzing ? (
              <div className="flex items-center justify-center gap-2 text-[#005a8d] font-mono animate-pulse">
                <Beaker size={18} /> Analyzing chemistry and texture...
              </div>
            ) : aiAnalysis && (
              <div className={`border-2 p-4 text-left font-mono text-sm ${aiAnalysis.success ? 'border-[#a8d672] bg-[#f4fcf4]' : 'border-[#ff6d8b] bg-[#fcf4f4]'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {aiAnalysis.success ? (
                    <CheckCircle size={18} className="text-[#a8d672]" />
                  ) : (
                    <AlertCircle size={18} className="text-[#ff6d8b]" />
                  )}
                  <span className="font-bold">{aiAnalysis.success ? "Step Verified" : "Error Detected"}</span>
                </div>
                
                {!aiAnalysis.success && (
                  <div className="space-y-2">
                    <p className="text-[#33302A]">{aiAnalysis.error_description}</p>
                    <div className="bg-[#33302A] text-[#ffbc51] p-2 border border-[#555] text-[10px]">
                      <span className="font-bold block mb-1">Chemistry Break:</span>
                      {aiAnalysis.chemistry_reason}
                    </div>
                    <div className="bg-[#eaff66] text-[#33302A] p-2 border border-[#33302A] text-[10px] font-bold">
                      <span className="block mb-1">AI Fix:</span>
                      {aiAnalysis.ai_recommendation}
                    </div>
                    {aiAnalysis.creator_fix && isPremium && (
                      <div className="bg-[#ffbc51] text-[#33302A] p-2 border border-[#33302A] text-[10px] font-bold italic">
                        <span className="block mb-1">Creator Hack:</span>
                        {aiAnalysis.creator_fix}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setUploadedImage(null)} className="text-xs text-[#33302A]/60 underline font-mono">
              Retake Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}