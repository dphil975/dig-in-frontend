import React from 'react';
import { Heart, Sparkles, Users, Globe } from 'lucide-react';

export default function WhimsyManifesto() {
  return (
    <div className="bg-gradient-to-r from-[#fce4ec] to-[#f3e5f5] border-[4px] border-[#e91e63] p-6 rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,0.15)] mb-6">
      <div className="flex items-center gap-3 mb-3">
        <Sparkles size={24} className="text-[#e91e63]" />
        <h2 className="text-xl font-black text-[#2d2d2d] tracking-tight">The Whimsy Manifesto</h2>
      </div>
      <p className="text-sm font-mono text-[#2d2d2d]/80 leading-relaxed mb-4">
        You are not broken. You are not too much. You are not perfect, and you don't have to be. 
        This is a space for learning, for listening, and for building a table where everyone is welcome. 
        We don't do chaos. We do color. We don't do pity. We do connection.
      </p>
      <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-[#e91e63]">
        <span className="flex items-center gap-1"><Heart size={12} /> Community</span>
        <span className="flex items-center gap-1"><Users size={12} /> Hosting</span>
        <span className="flex items-center gap-1"><Globe size={12} /> Whimsy</span>
      </div>
    </div>
  );
}