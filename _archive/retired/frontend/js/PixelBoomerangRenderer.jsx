import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function PixelBoomerangRenderer({ startImage, endImage }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [pixelSize, setPixelSize] = useState(8);

  // Simulating the backend processing for the demo
  // In production, this would request the generated GIF from the backend
  const [currentFrame, setCurrentFrame] = useState(0);
  const frames = 10; // Number of transition frames

  // Boomerang loop logic
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        // Loop forward then backward
        const next = prev + 1;
        if (next >= frames * 2) return 0;
        return next;
      });
    }, 150); // Speed of the boomerang
    return () => clearInterval(interval);
  }, [isPlaying, frames]);

  // Calculate the visual blend between the two images based on the frame
  // 0 -> frames-1 (Forward), frames -> 2*frames-1 (Reverse)
  const getBlend = (frame) => {
    const normalized = frame % frames;
    const isReversing = frame >= frames;
    const progress = isReversing ? (frames - 1 - normalized) / (frames - 1) : normalized / (frames - 1);
    return progress;
  };

  return (
    <div className="bg-[#1a1a2e] border-4 border-[#eaff66] p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] text-white font-mono w-full max-w-md mx-auto">
      
      <div className="flex justify-between items-center border-b border-[#eaff66]/30 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <RotateCcw size={16} className="text-[#eaff66]" />
          <span className="font-bold text-sm uppercase tracking-widest">Pixel Boomerang</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="bg-[#2d2d2d] p-1 rounded border border-[#555] hover:bg-[#3a3a3a]">
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>

      {/* The Pixelated Render */}
      <div className="relative w-full aspect-square bg-[#2d2d2d] border-2 border-[#555] overflow-hidden mb-3">
        <img 
          src={startImage} 
          alt="Start" 
          className="absolute inset-0 w-full h-full object-cover transition-all duration-100"
          style={{ 
            opacity: 1 - getBlend(currentFrame),
            filter: `url(#pixelate)`, // We apply the pixel filter via SVG
            imageRendering: 'pixelated'
          }}
        />
        <img 
          src={endImage} 
          alt="End" 
          className="absolute inset-0 w-full h-full object-cover transition-all duration-100"
          style={{ 
            opacity: getBlend(currentFrame),
            filter: `url(#pixelate)`,
            imageRendering: 'pixelated'
          }}
        />
        
        {/* SVG Filter for Pixelation (CSS approach) */}
        <svg className="absolute inset-0 w-0 h-0">
          <filter id="pixelate">
            <feFlood x="4" y="4" width="2" height="2"/>
            <feComposite width="2" height="2"/>
            <feTile result="a"/>
            <feComposite in="SourceGraphic" in2="a" operator="in"/>
            <feMorphology operator="dilate" radius="2"/>
          </filter>
        </svg>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">Pixel Size</span>
        <input 
          type="range" 
          min="2" 
          max="20" 
          value={pixelSize}
          onChange={(e) => setPixelSize(parseInt(e.target.value))}
          className="w-1/2 accent-[#eaff66]"
        />
      </div>
    </div>
  );
}