import React from 'react';
import { Leaf, HeartPulse, Moon, Coffee, Shield } from 'lucide-react';

export default function KitchenWisdom() {
  const wisdoms = [
    { icon: HeartPulse, title: "Honor Your Vessel", desc: "Did you know B12 is essential for nerve health? Let's find recipes rich in it today." },
    { icon: Moon, title: "Rest is Sacred", desc: "The 7.83Hz frequency (Schumann) is the Earth's heartbeat. It mirrors deep sleep. We won't ask you to do 100 things today. Just eat well." },
    { icon: Coffee, title: "The Truth about Caffeine", desc: "Coffee is a sacred plant, but it taxes your adrenal glands. Here is how to brew it slower to protect your energy." },
    { icon: Leaf, title: "Find the Green", desc: "Micronutrients are the quiet magicians. Spinach isn't just food; it's iron, magnesium, and love for your blood." }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
      {wisdoms.map((w, idx) => (
        <div key={idx} className="bg-[#fcfaf0] border-2 border-[#a8d672] p-4 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.15)] transition-all">
          <div className="flex items-center gap-2 mb-2">
            <w.icon size={18} className="text-[#005a8d]" />
            <h3 className="font-bold text-sm text-[#2d2d2d]">{w.title}</h3>
          </div>
          <p className="text-xs font-mono text-[#2d2d2d]/80 leading-relaxed">{w.desc}</p>
          <button className="mt-3 text-[10px] font-bold text-[#005a8d] hover:underline">Explore this wisdom →</button>
        </div>
      ))}
    </div>
  );
}