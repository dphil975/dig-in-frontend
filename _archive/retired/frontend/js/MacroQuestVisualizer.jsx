import React from 'react';
import { Activity, Droplet, Flame, Target } from 'lucide-react';

export default function MacroQuestVisualizer({ recipeMacros, userMacroTargets }) {
  // Calculate percentages for the progress bars
  const proteinPct = Math.min(100, (recipeMacros.protein / userMacroTargets.protein) * 100);
  const fiberPct = Math.min(100, (recipeMacros.fiber / userMacroTargets.fiber) * 100);
  const netCarbsPct = Math.min(100, (recipeMacros.net_carbs / userMacroTargets.net_carbs) * 100);

  return (
    <div className="bg-[#fcfaf0] border-[4px] border-[#2d2d2d] p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] w-full">
      <div className="flex items-center gap-2 border-b-2 border-[#2d2d2d] pb-2 mb-3">
        <Activity size={18} className="text-[#005a8d]" />
        <h3 className="font-bold text-sm uppercase tracking-widest">Macro Quest</h3>
      </div>

      <div className="space-y-3">
        {/* Protein Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="flex items-center gap-1 font-bold text-[#2d2d2d]">
              <Flame size={14} className="text-[#ff6d8b]" /> Protein
            </span>
            <span>{recipeMacros.protein}g / {userMacroTargets.protein}g</span>
          </div>
          <div className="w-full h-4 bg-[#e8e4db] border-2 border-[#2d2d2d] overflow-hidden">
            <div 
              className="h-full bg-[#ff6d8b] transition-all duration-500"
              style={{ width: `${proteinPct}%` }}
            ></div>
          </div>
        </div>

        {/* Fiber Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="flex items-center gap-1 font-bold text-[#2d2d2d]">
              <Droplet size={14} className="text-[#a8d672]" /> Fiber
            </span>
            <span>{recipeMacros.fiber}g / {userMacroTargets.fiber}g</span>
          </div>
          <div className="w-full h-4 bg-[#e8e4db] border-2 border-[#2d2d2d] overflow-hidden">
            <div 
              className="h-full bg-[#a8d672] transition-all duration-500"
              style={{ width: `${fiberPct}%` }}
            ></div>
          </div>
        </div>

        {/* Net Carbs Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="flex items-center gap-1 font-bold text-[#2d2d2d]">
              <Target size={14} className="text-[#ffbc51]" /> Net Carbs
            </span>
            <span>{recipeMacros.net_carbs}g / {userMacroTargets.net_carbs}g</span>
          </div>
          <div className="w-full h-4 bg-[#e8e4db] border-2 border-[#2d2d2d] overflow-hidden">
            <div 
              className="h-full bg-[#ffbc51] transition-all duration-500"
              style={{ width: `${netCarbsPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center text-[10px] text-gray-500 font-mono border-t border-[#d4cfc4] pt-2">
        *Protein builds muscle, fiber aids digestion, net carbs manage blood sugar.
      </div>
    </div>
  );
}