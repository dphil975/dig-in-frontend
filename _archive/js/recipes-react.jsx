import React, { useState, useEffect } from 'react';
import { Clock, Globe, MapPin, Heart, Coffee, ChevronDown, Cookie } from 'lucide-react';

// --- Types & Interfaces ---
interface Ingredient {
  text: string;
}

interface DrinkPair {
  name: string;
  icon?: 'coffee' | 'latte';
}

interface RecipeCardProps {
  id: string;
  title: string;
  subtitle: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  steps: number;
  yieldCount: number;
  description: string;
  ingredients: Ingredient[];
  pairWith: DrinkPair[];
  tags: string[];
  category: string;
  region: string;
}

// --- Reusable Components ---

const TagBadge = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-md text-white text-xs font-medium border border-white/10 shadow-sm">
    {icon}
    <span>{text}</span>
  </div>
);

const StatBox = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-[#FAEBD7] p-3 rounded-lg border border-[#d4bca5]/30 flex flex-col justify-between h-20">
    <span className="text-[#6B6FBB] font-bold uppercase text-xs tracking-wider">{label}</span>
    <span className="text-[#2d1b13] font-medium text-sm">{value}</span>
  </div>
);

const IngredientItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 text-[#2d1b13] text-sm">
    <span className="text-[#6B6FBB] text-lg leading-none">•</span>
    <span className="leading-tight">{text}</span>
  </div>
);

const DrinkBadge = ({ name, icon }: DrinkPair) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-[#6B463C] bg-transparent text-[#2d1b13] text-xs font-semibold">
    {icon === 'coffee' ? (
      <Coffee size={14} className="text-[#6B463C]" />
    ) : (
      <span className="text-[#6B463C] text-sm">☕</span>
    )}
    {name}
  </div>
);

// --- Flavor Profile Modal ---
const FlavorRemixModal = ({ recipe, flavor, pairings, onClose }: any) => {
  if (!recipe) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#FAEBD7] rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto border-2 border-[#8b5cf6]">

        <h2 className="text-3xl font-black text-[#8b5cf6] mb-2">{recipe.name}</h2>
        <p className="text-[#8b5cf6] font-bold mb-4">✨ {flavor.toUpperCase()} TRANSFORMATION</p>

        <p className="text-[#666] mb-6 leading-relaxed">{recipe.transformation_notes}</p>

        {recipe.flavor_notes?.eating_experience && (
          <p className="text-[#8b5cf6] italic mb-6 text-sm">{recipe.flavor_notes.eating_experience}</p>
        )}

        {recipe.flavor_notes?.dominant_seasonings && (
          <div className="mb-6">
            <p className="text-[#8b5cf6] font-bold mb-3">🧂 DOMINANT SEASONINGS:</p>
            <div className="flex flex-wrap gap-2">
              {recipe.flavor_notes.dominant_seasonings.map((s: string, i: number) => (
                <span key={i} className="bg-[#f0e8f8] border border-[#8b5cf6] rounded-full px-3 py-1.5 text-sm text-[#8b5cf6]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {pairings && (
          <div className="mb-6">
            <p className="text-[#8b5cf6] font-bold mb-3">🥘 INGREDIENT PAIRINGS:</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#f0e8f8] border border-[#d4a574] rounded-lg p-3">
                <div className="text-[#d4a574] font-bold text-xs mb-1">PROTEIN</div>
                <div className="text-[#333] text-sm mb-1">{pairings.protein.name}</div>
                <div className="text-[#666] text-xs">{pairings.protein.reason}</div>
              </div>
              <div className="bg-[#f0e8f8] border border-[#8b5cf6] rounded-lg p-3">
                <div className="text-[#8b5cf6] font-bold text-xs mb-1">CARBS</div>
                <div className="text-[#333] text-sm mb-1">{pairings.carb.name}</div>
                <div className="text-[#666] text-xs">{pairings.carb.reason}</div>
              </div>
              <div className="bg-[#f0e8f8] border border-[#8b5cf6] rounded-lg p-3">
                <div className="text-[#8b5cf6] font-bold text-xs mb-1">LEGUMES</div>
                <div className="text-[#333] text-sm mb-1">{pairings.bean.name}</div>
                <div className="text-[#666] text-xs">{pairings.bean.reason}</div>
              </div>
            </div>

            {pairings.pairing_scores && (
              <div className="text-sm space-y-1">
                <div className="text-[#666]">Protein Match: <span className="text-[#8b5cf6] font-bold">{(pairings.pairing_scores.protein_flavor_match * 100).toFixed(0)}%</span></div>
                <div className="text-[#666]">Carb Match: <span className="text-[#8b5cf6] font-bold">{(pairings.pairing_scores.carb_flavor_match * 100).toFixed(0)}%</span></div>
                <div className="text-[#666]">Bean Match: <span className="text-[#8b5cf6] font-bold">{(pairings.pairing_scores.bean_flavor_match * 100).toFixed(0)}%</span></div>
                <div className="text-[#666] border-t border-[#ddd] pt-2 mt-2">Overall Harmony: <span className="text-[#8b5cf6] font-bold">{(pairings.pairing_scores.overall_harmony * 100).toFixed(0)}%</span></div>
              </div>
            )}
          </div>
        )}

        {recipe.flavor_notes?.pairing_drinks && (
          <div className="mb-6">
            <p className="text-[#8b5cf6] font-bold mb-3">🍷 BEVERAGE PAIRINGS:</p>
            <div className="flex flex-wrap gap-2">
              {recipe.flavor_notes.pairing_drinks.map((drink: string, i: number) => (
                <span key={i} className="bg-[#f0e8f8] border border-[#d4a574] rounded-full px-3 py-1.5 text-sm text-[#8b5cf6]">
                  {drink}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold py-3 rounded-lg mt-6"
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
};

// --- Main Card Component ---
const RecipeCard: React.FC<RecipeCardProps> = ({
  id, title, subtitle, prepTime, cookTime, difficulty, steps, yieldCount,
  description, ingredients, pairWith, tags, category, region
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
  const [flavorRemixData, setFlavorRemixData] = useState<any>(null);
  const [flavorPairings, setFlavorPairings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const flavors = ['spicy', 'umami', 'fresh'];

  const handleFlavorClick = (flavor: string) => {
    setSelectedFlavor(selectedFlavor === flavor ? null : flavor);
  };

  const handleFlavorRemix = async () => {
    if (!selectedFlavor) {
      alert('Please select a flavor first!');
      return;
    }

    setLoading(true);
    try {
      const [remixRes, pairingsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/recipes/${id}/remix-flavor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flavor: selectedFlavor, format: 'salad' })
        }),
        fetch(`http://localhost:5000/api/recipes/${id}/pairings/${selectedFlavor}`)
      ]);

      const remixData = await remixRes.json();
      const pairingsData = await pairingsRes.json();

      setFlavorRemixData(remixData.recipe);
      setFlavorPairings(pairingsData.pairings);
    } catch (error) {
      console.error('Error:', error);
      alert('Error generating flavor remix');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-md w-full bg-[#FAEBD7] rounded-2xl overflow-hidden shadow-2xl border-2 border-[#6B463C]/40 font-sans">

        {/* Header Section */}
        <div className="bg-[#6B6FBB] p-6 pb-10 relative">
          <h1 className="text-3xl font-black text-white tracking-wide drop-shadow-md mb-1">{title}</h1>
          <p className="text-white/90 text-sm italic mb-4">{subtitle}</p>

          <div className="flex flex-wrap gap-2">
            <TagBadge icon={<Globe size={14} />} text={subtitle} />
            <TagBadge icon={<MapPin size={14} />} text={region} />
            <TagBadge icon={<Clock size={14} />} text={`${prepTime + cookTime}min`} />
            <TagBadge icon={<Cookie size={14} />} text={yieldCount.toString()} />
          </div>
        </div>

        {/* Body Section */}
        <div className="px-6 pb-6 pt-2 -mt-6 relative z-10 bg-[#FAEBD7] rounded-t-2xl shadow-inner">

          {/* Description */}
          <p className="text-[#2d1b13]/80 text-sm leading-relaxed mb-6 pt-2">
            {description}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatBox label="Prep" value={`${prepTime} min`} />
            <StatBox label="Cook" value={`${cookTime} min`} />
            <StatBox label="Difficulty" value={difficulty} />
            <StatBox label="Steps" value={`${steps} steps`} />
          </div>

          {/* Ingredients */}
          <div className="border border-[#d4bca5]/50 rounded-xl p-4 mb-6 bg-[#FAEBD7] shadow-sm">
            <h3 className="text-[#6B6FBB] font-bold text-sm uppercase tracking-wider mb-3">Key Ingredients</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {ingredients.map((ing, idx) => (
                <IngredientItem key={idx} text={ing.text} />
              ))}
            </div>
          </div>

          {/* Pairs With */}
          <div className="border border-[#d4bca5]/50 rounded-xl p-4 bg-[#FAEBD7] shadow-sm mb-6">
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-[#6B6FBB] font-bold text-sm uppercase tracking-wider">Pairs With</h3>
              <span className="text-[#2d1b13]/50 text-[10px] italic font-semibold tracking-wide">sweet · rich · fatty</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pairWith.map((drink, idx) => (
                <DrinkBadge key={idx} name={drink.name} icon={drink.icon} />
              ))}
            </div>
          </div>

          {/* Flavor Profile Selector */}
          <div className="border border-[#d4bca5]/50 rounded-xl p-4 bg-[#f0e8f8] shadow-sm mb-6">
            <h3 className="text-[#8b5cf6] font-bold text-sm uppercase tracking-wider mb-3">🌟 Flavor Profile</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {flavors.map(flavor => (
                <button
                  key={flavor}
                  onClick={() => handleFlavorClick(flavor)}
                  className={`px-3 py-1.5 rounded-full border-2 font-semibold text-xs transition-all ${
                    selectedFlavor === flavor
                      ? 'bg-[#8b5cf6] text-white border-[#8b5cf6]'
                      : 'border-[#8b5cf6] text-[#8b5cf6] bg-white hover:bg-[#f9f6f2]'
                  }`}
                >
                  {flavor === 'spicy' && '🌶️'} {flavor === 'umami' && '🍜'} {flavor === 'fresh' && '🌿'} {flavor}
                </button>
              ))}
            </div>
            <button
              onClick={handleFlavorRemix}
              disabled={!selectedFlavor || loading}
              className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-gray-400 text-white font-bold py-2 rounded-lg text-sm transition-all"
            >
              {loading ? '⏳ Transforming...' : '✨ FLAVOR REMIX'}
            </button>
          </div>

          {/* Actions Footer */}
          <div className="flex gap-3">
            <button className="flex-1 bg-[#6B6FBB] hover:bg-[#585B9E] text-white font-bold py-3 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-sm border-b-2 border-[#4A4D80]">
              VIEW STEPS <ChevronDown size={16} />
            </button>
            <button className="flex-[2] bg-[#4A2E25] hover:bg-[#3A241D] text-white font-bold py-3 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-sm border-b-2 border-[#2D1B13]">
              <Coffee size={16} /> ALL DRINKS
            </button>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="w-12 h-11 bg-white border border-[#d4bca5]/50 rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors duration-200"
            >
              <Heart
                size={20}
                className={`${isLiked ? 'fill-red-500 text-red-500' : 'text-[#6B463C]'} transition-colors duration-200`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Flavor Remix Modal */}
      {flavorRemixData && (
        <FlavorRemixModal
          recipe={flavorRemixData}
          flavor={selectedFlavor}
          pairings={flavorPairings}
          onClose={() => {
            setFlavorRemixData(null);
            setFlavorPairings(null);
          }}
        />
      )}
    </>
  );
};

// --- Main App with API Integration ---
export default function RecipeApp() {
  const [recipes, setRecipes] = useState<RecipeCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ country: '', category: '' });

  useEffect(() => {
    loadRecipes();
  }, [filter]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const url = new URL('http://localhost:5000/api/recipes');
      url.searchParams.append('limit', '100');
      if (filter.country) url.searchParams.append('country', filter.country);
      if (filter.category) url.searchParams.append('category', filter.category);

      const response = await fetch(url.toString());
      const data = await response.json();

      const formatted: RecipeCardProps[] = data.recipes.map((r: any) => ({
        id: r.id,
        title: r.name,
        subtitle: r.country,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        difficulty: r.difficulty || 'easy',
        steps: r.instructions?.length || 0,
        yieldCount: r.servings || 4,
        description: r.description,
        ingredients: r.ingredients?.slice(0, 4).map((i: string) => ({ text: i })) || [],
        pairWith: [
          { name: 'Coffee', icon: 'coffee' },
          { name: 'Tea', icon: 'latte' }
        ],
        tags: [r.country, r.category],
        category: r.category,
        region: r.region || 'Global'
      }));

      setRecipes(formatted);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#8D7B9E] p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-2">🍽️ DIG IN</h1>
          <p className="text-white/80">Premium Recipe Collection with Flavor Profiles</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 justify-center mb-8 flex-wrap">
          <input
            type="text"
            placeholder="Search recipes..."
            className="px-4 py-2 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50"
          />
          <select
            className="px-4 py-2 rounded-lg border border-white/30 bg-white/10 text-white"
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center text-white text-lg">Loading recipes...</div>
        ) : (
          <>
            {/* Recipe Count */}
            <div className="text-center text-white/70 mb-8 text-sm">
              Showing {recipes.length} recipes
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} {...recipe} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
