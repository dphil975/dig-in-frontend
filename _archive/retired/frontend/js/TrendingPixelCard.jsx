import React from 'react';
import PixelBoomerangRenderer from './PixelBoomerangRenderer';

export default function TrendingPixelCard({ item }) {
  // If the user has uploaded start/end images, use them. 
  // Otherwise, fallback to stock images.
  const startImage = item.startImage || "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400";
  const endImage = item.endImage || "https://images.unsplash.com/photo-1511690656952-34342ae2b273?auto=format&fit=crop&q=80&w=400";

  return (
    <div className="bg-white border-2 border-[#2d2d2d] rounded-2xl overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,0.15)] p-4 mb-4">
      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
      <p className="text-sm text-gray-500 font-mono mb-3">{item.excerpt}</p>
      
      {/* The Pixel Boomerang */}
      <div className="w-full aspect-video rounded-lg overflow-hidden border border-[#d4cfc4]">
        <PixelBoomerangRenderer startImage={startImage} endImage={endImage} />
      </div>
    </div>
  );
}