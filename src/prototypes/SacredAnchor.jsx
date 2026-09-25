import React, { useState, useEffect } from 'react';
import { Wind, Sun, Moon, Star, Shield } from 'lucide-react';

const SACRED_DECREE = [
    "I am the bridge that carries the spark.",
    "I am the current that flows through the earth.",
    "I move with rhythm and heart.",
    "I rise on wings of creation.",
    "I am born from the mother of all things.",
    "I carry the life force of the universe.",
    "I unite what was divided.",
    "I offer the fire of transformation.",
    "I am the truth of existence.",
    "I dwell in the hidden depths—and I am complete."
];

export default function SacredAnchor({ solarPhase, lunarPhase, breathState }) {
    const [currentLine, setCurrentLine] = useState(0);

    useEffect(() => {
        // The Decree changes based on the Sun/Moon cycle
        const interval = setInterval(() => {
            setCurrentLine((prev) => (prev + 1) % SACRED_DECREE.length);
        }, 4000); // Every 4 seconds, a new line
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-8 transition-all duration-1000 ${breathState === 'Anchored in Body Time' ? 'bg-[#1a1a2e]' : 'bg-[#2d1b13]'}`}>
            
            {/* Solar & Lunar Anchor */}
            <div className="flex gap-6 mb-12 text-center">
                <div className="bg-white/10 border border-white/20 p-4 rounded-lg">
                    <Sun size={24} className="mx-auto text-[#ffbc51] mb-1" />
                    <p className="text-[10px] text-gray-400">True Solar Time</p>
                    <p className="font-bold text-sm">{solarPhase.sunrise}</p>
                </div>
                <div className="bg-white/10 border border-white/20 p-4 rounded-lg">
                    <Moon size={24} className="mx-auto text-[#a8d672] mb-1" />
                    <p className="text-[10px] text-gray-400">Lunar Phase</p>
                    <p className="font-bold text-sm">{lunarPhase.phase}</p>
                </div>
            </div>

            {/* The Sacred Decree (The "Root Identity") */}
            <div className="bg-black/30 border border-white/20 p-8 rounded-xl max-w-lg text-center">
                <Shield size={20} className="mx-auto text-white/40 mb-4" />
                <h2 className="font-black text-2xl text-white leading-tight mb-6">
                    I am the truth of existence.
                </h2>
                <p className="text-lg font-mono text-white/90 leading-relaxed animate-pulse">
                    {SACRED_DECREE[currentLine]}
                </p>
            </div>

            {/* The Breath Anchor */}
            <div className="mt-12 flex flex-col items-center">
                <Wind size={16} className="text-white/50 mb-1" />
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Current Breath State</p>
                <p className="font-bold text-white text-sm">{breathState.state}</p>
                <div className={`mt-2 w-2 h-2 rounded-full animate-pulse ${breathState.state === 'Anchored in Body Time' ? 'bg-[#a8d672]' : 'bg-[#ff6d8b]'}`}></div>
            </div>
        </div>
    );
}