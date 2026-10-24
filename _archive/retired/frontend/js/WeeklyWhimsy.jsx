import React from 'react';
import { Music, Mic, FileText, ArrowRight, Play } from 'lucide-react';

export default function WeeklyWhimsy({ episode }) {
  return (
    <div className="bg-[#1a1a2e] border-[4px] border-[#eaff66] p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.5)] text-white font-mono mb-6">
      <div className="flex items-center gap-2 border-b border-[#eaff66]/30 pb-2 mb-3">
        <Mic size={16} className="text-[#eaff66]" />
        <h3 className="font-bold text-sm uppercase tracking-widest">Weekly Whimsy</h3>
        <span className="ml-auto text-[10px] bg-[#2d2d2d] px-2 py-0.5 border border-[#555]">Episode {episode.number}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Podcast */}
        <div className="bg-[#2d2d2d] border border-[#555] p-3 flex flex-col items-center text-center">
          <Mic size={24} className="text-[#ffbc51] mb-1" />
          <span className="font-bold text-sm">{episode.title}</span>
          <span className="text-[10px] text-gray-400 mb-2">{episode.location}</span>
          <button className="bg-[#eaff66] text-[#1a1a2e] font-bold px-4 py-1 border border-[#2d2d2d] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] text-xs flex items-center gap-1 hover:bg-[#d4e85c]">
            <Play size={12} /> Listen
          </button>
        </div>

        {/* Playlist */}
        <div className="bg-[#2d2d2d] border border-[#555] p-3 flex flex-col items-center text-center">
          <Music size={24} className="text-[#ff6d8b] mb-1" />
          <span className="font-bold text-sm">The {episode.theme} Playlist</span>
          <span className="text-[10px] text-gray-400 mb-2">{episode.tracks} tracks</span>
          <button className="bg-[#ff6d8b] text-white font-bold px-4 py-1 border border-[#2d2d2d] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] text-xs flex items-center gap-1 hover:bg-[#e55a7b]">
            <Music size={12} /> Save
          </button>
        </div>

        {/* Article */}
        <div className="bg-[#2d2d2d] border border-[#555] p-3 flex flex-col items-center text-center">
          <FileText size={24} className="text-[#a8d672] mb-1" />
          <span className="font-bold text-sm">{episode.article_title}</span>
          <span className="text-[10px] text-gray-400 mb-2">5 min read</span>
          <button className="bg-[#a8d672] text-[#1a1a2e] font-bold px-4 py-1 border border-[#2d2d2d] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] text-xs flex items-center gap-1 hover:bg-[#92c059]">
            <ArrowRight size={12} /> Read
          </button>
        </div>
      </div>
    </div>
  );
}