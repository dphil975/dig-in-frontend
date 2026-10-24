import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Share2, Heart, MapPin, ArrowRight, ChevronLeft, ChevronRight,
  Instagram, Youtube, Video, FileText, Globe
} from 'lucide-react';

// --- MOCK DATA: REGION-BASED & TRENDING CONTENT ---
// In production, this would be fetched from a Geo-API based on the user's Zip Code
const CONTENT_DATA = {
  "Trending": [
    {
      id: 1,
      type: "substack",
      source: "The Chef's Gazette",
      title: "The Science of Sourdough",
      excerpt: "Understanding the fermentation chemistry behind the perfect loaf.",
      image: "https://images.unsplash.com/photo-1585478252711-f9d72b586c07?auto=format&fit=crop&q=80&w=400",
      region: "Global",
      author: "Julia B."
    },
    {
      id: 2,
      type: "tiktok",
      source: "@spice_rider",
      title: "Viral Spicy Tofu Bowl",
      excerpt: "This 20-minute recipe is currently trending in the South.",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
      region: "Dallas, TX",
      views: "1.2M"
    }
  ],
  "South East": [
    {
      id: 3,
      type: "instagram",
      source: "CookWithMe_ATL",
      title: "Southern Peach Cobbler",
      excerpt: "The ultimate comfort dessert using fresh Georgia peaches.",
      image: "https://images.unsplash.com/photo-1596702757766-be3a3dae2a8b?auto=format&fit=crop&q=80&w=400",
      region: "Atlanta, GA",
      likes: "24k"
    }
  ]
};

// --- SUB-COMPONENT: THE CONTENT CARD (Floating "KISY" Style) ---
const ContentCard = ({ item }) => {
  return (
    <div className="relative group flex flex-col bg-white border-[3px] border-[#2d2d2d] rounded-2xl overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,0.15)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.2)] transition-all w-full h-[320px]">
      
      {/* Image Container */}
      <div className="h-3/5 overflow-hidden relative">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
        
        {/* Source Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-[#2d2d2d] px-2 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest shadow-md">
          {item.type === 'substack' && <FileText size={12} />}
          {item.type === 'tiktok' && <Video size={12} />}
          {item.type === 'instagram' && <Instagram size={12} />}
          {item.type === 'youtube' && <Youtube size={12} />}
          {item.source}
        </div>

        {/* Region Badge */}
        <div className="absolute bottom-3 right-3 bg-[#1a1a2e] text-white border border-[#555] px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 shadow-md">
          <MapPin size={12} /> {item.region}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg leading-tight text-[#2d2d2d]">{item.title}</h3>
          <p className="text-sm text-[#2d2d2d]/70 font-mono line-clamp-2 mt-1">{item.excerpt}</p>
        </div>
        
        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#d4cfc4]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">{item.author || item.source}</span>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-full hover:bg-[#f4f2eb] transition-colors text-[#2d2d2d]">
              <Heart size={16} />
            </button>
            <button className="p-1.5 rounded-full hover:bg-[#f4f2eb] transition-colors text-[#2d2d2d]">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: THE HERO CAROUSEL (The "KISY" Product Header) ---
const HeroCarousel = ({ onRegionSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBoomeranging, setIsBoomeranging] = useState(false);

  // Auto-play Boomerang Effect (Simulating the loop)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBoomeranging(true);
      setTimeout(() => setIsBoomeranging(false), 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[400px] bg-[#f4f6fa] rounded-3xl overflow-hidden border-2 border-white/20 shadow-inner mb-8">
      {/* Background Hero Image */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1200)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-transparent"></div>
      </div>

      {/* Typography Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12 max-w-lg">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#2d2d2d] leading-tight mb-4">
          Discover the <span className="text-[#ff6d8b]">Taste</span> of Your Region.
        </h1>
        <p className="text-sm text-[#2d2d2d]/70 font-mono mb-6">Trending recipes, articles, and creator content based on your Zip Code.</p>
        <div className="flex gap-3">
          <button onClick={() => onRegionSelect("South East")} className="bg-[#2d2d2d] text-white px-6 py-2 rounded-full border border-[#555] font-bold text-sm flex items-center gap-2 hover:bg-[#3a3a3a] transition">
            <Globe size={14} /> South East
          </button>
          <button onClick={() => onRegionSelect("West Coast")} className="bg-white text-[#2d2d2d] px-6 py-2 rounded-full border-2 border-[#2d2d2d] font-bold text-sm flex items-center gap-2 hover:bg-[#f4f2eb] transition">
            <Globe size={14} /> West Coast
          </button>
        </div>
      </div>

      {/* The "Floating" KISY-Style Product Card (Mocking the interactive UI) */}
      <div className="absolute bottom-6 right-6 md:right-12 bg-white/95 backdrop-blur-sm border-2 border-[#2d2d2d] rounded-2xl p-4 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] max-w-[200px] text-center transition-all duration-500">
        <div className="relative h-24 w-full mb-2 overflow-hidden rounded-lg bg-gray-100">
          <img src="https://images.unsplash.com/photo-1606313564200-e75d5e30476c" alt="Recipe of the Day" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <Play size={24} className={`text-white transition-all duration-300 ${isBoomeranging ? 'opacity-100 scale-110' : 'opacity-80'}`} />
          </div>
        </div>
        <p className="font-bold text-xs text-[#2d2d2d]">Recipe of the Day</p>
        <p className="text-[10px] text-gray-500 font-mono">Click to view</p>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: THE CAROUSEL NAVIGATION ---
const CarouselControls = ({ onPrev, onNext }) => (
  <div className="flex justify-end gap-2 mb-4">
    <button onClick={onPrev} className="w-10 h-10 rounded-full border-2 border-[#2d2d2d] flex items-center justify-center hover:bg-[#f4f2eb] transition"><ChevronLeft size={20} /></button>
    <button onClick={onNext} className="w-10 h-10 rounded-full border-2 border-[#2d2d2d] flex items-center justify-center hover:bg-[#f4f2eb] transition"><ChevronRight size={20} /></button>
  </div>
);

// --- MAIN APP COMPONENT ---
export default function SocialFeed() {
  const [selectedRegion, setSelectedRegion] = useState("Trending");
  const [currentData, setCurrentData] = useState(CONTENT_DATA["Trending"]);

  // Simulate fetching data based on region
  useEffect(() => {
    // In production: fetch(`/api/social_feed?region=${selectedRegion}&zip=90210`)
    setCurrentData(CONTENT_DATA[selectedRegion] || CONTENT_DATA["Trending"]);
  }, [selectedRegion]);

  return (
    <div className="min-h-screen bg-[#fcf9f2] p-4 md:p-8 font-sans max-w-6xl mx-auto">
      
      {/* --- HERO SECTION (The KISY Layout) --- */}
      <HeroCarousel onRegionSelect={setSelectedRegion} />

      {/* --- TRENDING HEADER --- */}
      <div className="flex justify-between items-center mb-6 border-b-2 border-[#d4cfc4] pb-2">
        <div>
          <h2 className="text-xl font-black tracking-tight text-[#2d2d2d]">Trending {selectedRegion}</h2>
          <p className="text-[10px] text-gray-500 font-mono">Based on your region & zip code</p>
        </div>
        <button className="text-sm font-bold text-[#005a8d] hover:underline flex items-center gap-1">
          View All <ArrowRight size={16} />
        </button>
      </div>

      {/* --- CONTENT CAROUSEL (The "Boomerang" Scrolling Feed) --- */}
      <div className="relative">
        <CarouselControls 
          onPrev={() => console.log('Prev')} 
          onNext={() => console.log('Next')} 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentData.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </div>

    </div>
  );
}
