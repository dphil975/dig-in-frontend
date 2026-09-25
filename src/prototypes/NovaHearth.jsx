import React, { useState, useEffect, useRef } from 'react';
import { Heart, Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function NovaHearth() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(528); // Default: Love Frequency
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);

  useEffect(() => {
    // Create Web Audio Context on first interaction (browsers block autoplay)
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (isPlaying) {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Set the frequency
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      // Use a very low volume (2%) so it hums, not shouts
      gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      
      oscillatorRef.current = osc;
    } else {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
    }

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
    };
  }, [isPlaying, frequency]);

  // Map the user's emotional state to a frequency
  const handleEmotionSelect = (emotion) => {
    const freqMap = {
      pain: 174, health: 285, guilt: 396, stuck: 417, 
      love: 528, lonely: 639, blocked: 714, disorder: 852, seek: 963
    };
    setFrequency(freqMap[emotion]);
  };

  return (
    <div className="bg-[#1a1a2e] border-2 border-[#eaff66] p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] text-white font-mono w-full max-w-sm mx-auto">
      
      <div className="flex items-center gap-2 border-b border-[#eaff66]/30 pb-2 mb-3">
        <Sparkles size={16} className="text-[#eaff66] animate-pulse" />
        <h3 className="font-bold text-sm uppercase tracking-widest">Nova Hearth</h3>
        <span className="ml-auto text-[10px] bg-[#2d2d2d] px-2 py-0.5 border border-[#555]">{frequency} Hz</span>
      </div>

      <div className="space-y-2 mb-4">
        {[
          { label: "Healing Love (Default)", emotion: "love", color: "#ff6d8b" },
          { label: "Release Stress & Pain", emotion: "pain", color: "#ffbc51" },
          { label: "Connect & Heal Loneliness", emotion: "lonely", color: "#a8d672" },
          { label: "Find Inner Peace", emotion: "seek", color: "#005a8d" }
        ].map((freq) => (
          <button 
            key={freq.emotion}
            onClick={() => handleEmotionSelect(freq.emotion)}
            className={`w-full text-left p-2 border-2 transition flex justify-between items-center ${frequency === freqMap[freq.emotion] ? 'border-[#eaff66] bg-[#2d2d2d]' : 'border-[#555] hover:bg-[#3a3a3a]'}`}
            style={{ borderColor: frequency === freqMap[freq.emotion] ? freq.color : '#555' }}
          >
            <span className="text-xs font-bold">{freq.label}</span>
            <span className="text-[10px] text-gray-400">{freqMap[freq.emotion]}Hz</span>
          </button>
        ))}
      </div>

      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-full bg-[#eaff66] text-[#1a1a2e] font-bold py-2 border-2 border-[#2d2d2d] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm flex justify-center items-center gap-2"
      >
        {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
        {isPlaying ? "Pause the Hearth" : "Light the Hearth"}
      </button>
    </div>
  );
}