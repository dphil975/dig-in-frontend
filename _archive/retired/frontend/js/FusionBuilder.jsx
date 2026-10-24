import React, { useState } from 'react';
import { MapPin, ChefHat, Plus, Minus, RotateCcw, Leaf, Beef } from 'lucide-react';

export default function FusionBuilder() {
  const [baseItem, setBaseItem] = useState("Sandwich");
  const [region, setRegion] = useState("Jamaican");
  const [mods, setMods] = useState([]);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock Pixel Description (In production, this comes from the AI)
  const [pixelRender, setPixelRender] = useState(
    "A blocky pixel art of a plain sandwich on a plate."
  );

  const handleGenerate = async () => {
    setIsLoading(true);
    // Simulate hitting the backend
    setTimeout(() => {
      setGeneratedResult({
        fusion_name: "Jamaican Jerk Sandwich",
        base_item: "Sandwich",
        region: "Jamaican",
        recipe_steps: [
          "1. Marinate chicken thighs in jerk seasoning for 2 hours.",
          "2. Grill chicken until charred and cooked through.",
          "3. Toast the bun with garlic butter.",
          "4. Assemble: Bun, chicken, pickled onions, and a mango-habanero aioli."
        ],
        flavor_bridge: "The scotch bonnet heat in the jerk seasoning is balanced by the creamy mango aioli. The fat in the aioli binds the capsaicin, allowing the heat to linger without burning.",
        pixel_description: "A pixel art sandwich with blocky grilled chicken, a bright orange mango aioli layer, and green pickled onions on a toasted brown bun."
      });
      setPixelRender("A blocky pixel art of a sandwich with a glowing orange sauce, green onions, and a thick, charred chicken patty.");
      setIsLoading(false);
    }, 1500);
  };

  const addModification = (mod) => {
    setMods([...mods, mod]);
    // In a real app, this would immediately trigger a re-generation of the pixel image
    // to show the "Add Protein" effect.
  };

  return (
    <div className="bg-white border-[4px] border-[#2d2d2d] p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.25)] max-w-4xl mx-auto font-mono">
      
      <div className="flex items-center gap-2 border-b-2 border-[#2d2d2d] pb-2 mb-4">
        <ChefHat size={20} className="text-[#ffbc51]" />
        <h2 className="font-black text-lg">Fusion Customizer</h2>
        <span className="ml-auto text-[10px] bg-[#eaff66] px-2 py-0.5 border border-[#2d2d2d]">BETA</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* LEFT: Customization Menu */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Step 1: Choose Your Base</label>
            <div className="grid grid-cols-2 gap-2">
              {["Sandwich", "Bowl", "Taco", "Pasta"].map((item) => (
                <button 
                  key={item}
                  onClick={() => setBaseItem(item)}
                  className={`p-2 border-2 font-bold text-xs transition-all ${baseItem === item ? 'bg-[#2d2d2d] text-white border-[#555]' : 'bg-[#fcfaf0] border-[#d4cfc4] hover:bg-[#e8e4db]'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Step 2: Pick Your Flavor Region</label>
            <div className="grid grid-cols-2 gap-2">
              {["Jamaican", "Korean", "Italian", "Thai"].map((reg) => (
                <button 
                  key={reg}
                  onClick={() => setRegion(reg)}
                  className={`p-2 border-2 font-bold text-xs transition-all flex items-center gap-1 justify-center ${region === reg ? 'bg-[#ffbc51] text-[#1a1a2e] border-[#2d2d2d]' : 'bg-[#fcfaf0] border-[#d4cfc4] hover:bg-[#e8e4db]'}`}
                >
                  <MapPin size={12} /> {reg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Step 3: Add Modifiers</label>
            <div className="flex gap-2 flex-wrap">
              {["Add Protein", "Make Healthy", "Extra Spicy", "Gluten Free"].map((mod) => (
                <button 
                  key={mod}
                  onClick={() => addModification(mod)}
                  className="bg-white border border-[#d4cfc4] px-3 py-1 text-[10px] font-bold hover:bg-[#f4f2eb] transition flex items-center gap-1"
                >
                  <Plus size={12} /> {mod}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {mods.map((m, idx) => (
                <span key={idx} className="bg-[#1a1a2e] text-white text-[10px] px-2 py-0.5 flex items-center gap-1 border border-[#555]">
                  {m} <button onClick={() => setMods(mods.filter((_, i) => i !== idx))} className="hover:text-[#ff6d8b]"><Minus size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-[#005a8d] text-white font-bold py-3 border-[4px] border-[#003d5c] shadow-[4px_4px_0px_rgba(0,0,0,0.3)] active:translate-x-[3px] active:translate-y-[3px] transition-all text-sm flex justify-center items-center gap-2"
          >
            {isLoading ? "Cooking..." : <RotateCcw size={16} />} Generate Fusion
          </button>
        </div>

        {/* RIGHT: The Visual Output */}
        <div className="bg-[#1a1a2e] border-2 border-[#eaff66] p-4 min-h-[400px] flex flex-col justify-between text-white relative">
          
          <div className="text-center">
            <h3 className="text-lg font-black text-[#eaff66] uppercase tracking-widest mb-2">
              {isLoading ? "Generating..." : generatedResult?.fusion_name || "Waiting for your order"}
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">{generatedResult?.flavor_bridge || "Select a base and region to begin."}</p>
          </div>

          {/* The Pixelated Visualization (The "Preview") */}
          <div className="flex-1 bg-[#2d2d2d] border-2 border-[#555] my-4 flex items-center justify-center text-center p-4">
            {isLoading ? (
              <div className="animate-pulse text-[#eaff66]">Building your dish...</div>
            ) : generatedResult ? (
              <div className="text-xs text-[#a8d672] font-mono leading-relaxed">
                <div className="text-6xl mb-2">🍔</div>
                <p className="border-t border-[#555] pt-2 mt-2">{generatedResult.pixel_description}</p>
              </div>
            ) : (
              <span className="text-gray-500 text-xs font-mono">No preview yet</span>
            )}
          </div>

          {/* Modifier Call-to-Action Buttons (Fast Food Style) */}
          {generatedResult && (
            <div className="flex gap-2 border-t border-[#eaff66]/30 pt-3">
              <button onClick={() => addModification("Add Protein")} className="flex-1 bg-[#2d2d2d] border border-[#555] py-1 text-[10px] text-white flex items-center justify-center gap-1 hover:bg-[#3a3a3a]">
                <Beef size={12} /> Add Protein
              </button>
              <button onClick={() => addModification("Make Healthy")} className="flex-1 bg-[#2d2d2d] border border-[#555] py-1 text-[10px] text-white flex items-center justify-center gap-1 hover:bg-[#3a3a3a]">
                <Leaf size={12} /> Make Healthy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}