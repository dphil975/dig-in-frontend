import React, { useState, useEffect } from 'react';
import { MapPin, Flame, Lock, CheckCircle, ArrowRight } from 'lucide-react';

export default function DiscoveryThreadView({ userHistory }) {
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    // Fetch the algorithm's output
    // In production: fetch('/api/thread_feed')
    setThreads([
      {
        id: "thai_curry",
        title: "Thai Curry & Street Food",
        neighbors: ["Vietnamese", "Laotian"],
        recipes: [
          { name: "Thai Green Curry", status: "unlocked", completed: true },
          { name: "Vietnamese Pho", status: "unlocked", completed: false },
          { name: "Laotian Laap", status: "locked", cost: 5 }, // 5 Gold Coins
        ]
      },
      {
        id: "italian_pasta",
        title: "Italian Pasta & Emulsions",
        neighbors: ["French", "Greek"],
        recipes: [
          { name: "Classic Carbonara", status: "unlocked", completed: false },
          { name: "French Béarnaise", status: "locked", cost: 5 },
        ]
      }
    ]);
  }, []);

  return (
    <div className="bg-white border-[4px] border-[#33302A] p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.25)]">
      <h2 className="font-black text-lg border-b-2 border-[#33302A] pb-2 mb-4 flex items-center gap-2">
        <MapPin size={20} className="text-[#005a8d]" /> Your Discovery Threads
      </h2>

      <div className="space-y-4">
        {threads.map((thread) => (
          <div key={thread.id} className="bg-[#fcfaf0] border-2 border-[#d4cfc4] p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm">{thread.title}</h3>
              <div className="flex gap-1">
                {thread.neighbors.map((n) => (
                  <span key={n} className="text-[10px] bg-[#e8e4db] px-2 py-0.5 border border-[#d4cfc4]">{n}</span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              {thread.recipes.map((recipe, idx) => (
                <div key={idx} className={`flex justify-between items-center p-2 border border-[#d4cfc4] bg-white ${recipe.status === 'locked' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2">
                    {recipe.completed && <CheckCircle size={16} className="text-[#a8d672]" />}
                    <span className="font-mono text-sm">{recipe.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {recipe.status === 'unlocked' && recipe.completed === false && (
                      <button className="bg-[#005a8d] text-white text-[10px] px-3 py-1 border border-[#003d5c] shadow-[1px_1px_0px_rgba(0,0,0,0.2)] flex items-center gap-1">
                        Cook <ArrowRight size={12} />
                      </button>
                    )}
                    {recipe.status === 'locked' && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Lock size={12} /> {recipe.cost} Gold <span className="text-[#ffbc51]">Coins</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
