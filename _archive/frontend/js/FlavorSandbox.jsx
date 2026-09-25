import React, { useState } from 'react';
import { Zap, X, CheckCircle, ArrowRight } from 'lucide-react';

export default function FlavorSandbox() {
  const [ingredientA, setIngredientA] = useState("");
  const [ingredientB, setIngredientB] = useState("");
  const [result, setResult] = useState(null);

  const testFusion = () => {
    // Simulate the Chemical Compatibility Engine
    const compatible = Math.random() > 0.5;
    if (compatible) {
      setResult({
        status: "success",
        message: "This is a brilliant fusion! The umami in the soy sauce will perfectly bind with the sweetness of the honey.",
        confidence: "92%"
      });
    } else {
      setResult({
        status: "error",
        message: "These flavors clash. The bitterness of the coffee will overpower the delicate citrus notes.",
        confidence: "78%"
      });
    }
  };

  return (
    <div className="bg-white border-[4px] border-[#2d2d2d] p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] font-mono max-w-md mx-auto">
      <div className="flex items-center gap-2 border-b-2 border-[#2d2d2d] pb-2 mb-3">
        <Zap size={16} className="text-[#ffbc51]" />
        <h3 className="font-bold text-sm uppercase tracking-widest">Flavor Fusion Sandbox</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <input 
          type="text" 
          placeholder="Ingredient A (e.g., Honey)" 
          value={ingredientA}
          onChange={(e) => setIngredientA(e.target.value)}
          className="bg-[#fcfaf0] border-2 border-[#d4cfc4] p-2 text-sm outline-none focus:border-[#2d2d2d]"
        />
        <input 
          type="text" 
          placeholder="Ingredient B (e.g., Soy Sauce)" 
          value={ingredientB}
          onChange={(e) => setIngredientB(e.target.value)}
          className="bg-[#fcfaf0] border-2 border-[#d4cfc4] p-2 text-sm outline-none focus:border-[#2d2d2d]"
        />
      </div>

      <button 
        onClick={testFusion}
        className="w-full bg-[#2d2d2d] text-white font-bold py-2 border-2 border-[#555] shadow-[3px_3px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm flex justify-center items-center gap-2"
      >
        <ArrowRight size={14} /> Test Fusion
      </button>

      {result && (
        <div className={`mt-3 p-3 border-2 flex items-center gap-2 ${result.status === 'success' ? 'border-[#a8d672] bg-[#f4fcf4]' : 'border-[#ff6d8b] bg-[#fcf4f4]'}`}>
          {result.status === 'success' ? <CheckCircle size={20} className="text-[#a8d672]" /> : <X size={20} className="text-[#ff6d8b]" />}
          <div>
            <p className="text-sm font-bold">{result.status === 'success' ? 'Compatible!' : 'Incompatible'}</p>
            <p className="text-[10px] text-gray-500">{result.message}</p>
            <p className="text-[10px] font-bold mt-1">Confidence: {result.confidence}</p>
          </div>
        </div>
      )}
    </div>
  );
}