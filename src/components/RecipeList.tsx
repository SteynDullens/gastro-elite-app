"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

interface Ingredient {
  id: string;
  quantity: number;
  unit: string;
  name: string;
}

interface Recipe {
  id: string;
  name: string;
  image?: string;
  batchSize?: number;
  servings?: number;
  ingredients: Ingredient[];
  instructions?: string;
  categories: string[];
  createdAt: string;
  userId?: string | null;
  companyId?: string | null;
  isSharedWithBusiness?: boolean;
}

interface RecipeListProps {
  recipes: Recipe[];
}

export default function RecipeList({ recipes }: RecipeListProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [databaseFilter, setDatabaseFilter] = useState<"all" | "personal" | "business">("all");

  // Category translation map
  const translateCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'Voorgerecht': t.catVoorgerecht,
      'Tussengerecht': t.catTussengerecht,
      'Hoofdgerecht': t.catHoofdgerecht,
      'Dessert': t.catDessert,
      'Groentegarnituur': t.catGroentegarnituur,
      'Vlees': t.catVlees,
      'Vis': t.catVis,
      'Vegetarisch': t.catVegetarisch,
      'Zetmeelgarnituur': t.catZetmeelgarnituur,
      'Gebonden sauzen': t.catGebondenSauzen,
      'Koude sauzen': t.catKoudeSauzen,
      'Soepen': t.catSoepen,
      'Salades': t.catSalades,
      'Brood': t.catBrood,
      'Dranken': t.catDranken,
    };
    return categoryMap[category] || category;
  };

  // Categories loaded from backend
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/recipes/categories', { cache: 'no-store' });
        const data = await res.json();
        if (!isMounted) return;
        if (res.ok) {
          const names = (data.categories || []).map((c: { name: string }) => c.name);
          setCategories(names);
          // Ensure selectedCategory remains valid
          setSelectedCategory(prev => (prev && !names.includes(prev) ? "" : prev));
        } else {
          setCategories([]);
        }
      } catch {
        setCategories([]);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Handle categories - they might be objects with name property or strings
    const recipeCategories = recipe.categories.map((cat: any) => 
      typeof cat === 'string' ? cat : (cat?.name || cat)
    );
    const matchesCategory = !selectedCategory || recipeCategories.includes(selectedCategory);
    
    // Filter by database type
    let matchesDatabase = true;
    if (databaseFilter === "personal") {
      // Personal recipes: have userId and no companyId
      matchesDatabase = !!recipe.userId && !recipe.companyId;
    } else if (databaseFilter === "business") {
      // Business recipes: have companyId
      matchesDatabase = !!recipe.companyId;
    }
    // If filter is "all", show all recipes (matchesDatabase stays true)
    
    return matchesSearch && matchesCategory && matchesDatabase;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-5 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 shadow-md bg-white text-gray-700 placeholder-gray-500"
        />
      </div>

      {/* Database Filter Buttons - Always show if user has company, or if there are mixed recipes */}
      {(() => {
        const hasCompany = !!(user?.companyId || user?.ownedCompany?.id);
        const hasPersonalRecipes = recipes.some(r => !!r.userId && !r.companyId);
        const hasBusinessRecipes = recipes.some(r => !!r.companyId);
        const shouldShowFilters = hasCompany || (hasPersonalRecipes && hasBusinessRecipes);
        
        if (!shouldShowFilters) return null;
        
        return (
          <div className="mb-4 flex gap-3 flex-wrap">
            <button
              onClick={() => setDatabaseFilter("all")}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 font-medium shadow-md ${
                databaseFilter === "all"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-orange-50 border border-orange-200 hover:border-orange-300"
              }`}
            >
              Alle recepten
            </button>
            <button
              onClick={() => setDatabaseFilter("personal")}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 font-medium shadow-md ${
                databaseFilter === "personal"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
              }`}
            >
              Persoonlijke database
            </button>
            {hasCompany && (
              <button
                onClick={() => setDatabaseFilter("business")}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 font-medium shadow-md ${
                  databaseFilter === "business"
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-green-50 border border-green-200 hover:border-green-300"
                }`}
              >
                Bedrijfsdatabase
              </button>
            )}
          </div>
        );
      })()}

      {/* Horizontal Scrollable Filter Bar */}
      <div className="mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 font-medium shadow-md ${
              selectedCategory === ""
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-orange-50 border border-orange-200 hover:border-orange-300"
            }`}
          >
            {t.allCategories}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 font-medium shadow-md ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-orange-50 border border-orange-200 hover:border-orange-300"
              }`}
            >
              {translateCategory(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-16">
          {searchTerm || selectedCategory ? (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 shadow-lg border border-orange-200">
              <div className="text-orange-600 text-xl font-semibold mb-3">{t.noRecipesFound}</div>
              <p className="text-orange-500">
                {t.tryAdjustingSearch}
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-12 shadow-lg border border-orange-200">
              <div className="text-6xl mb-6">🍽️</div>
              <div className="text-gray-800 text-2xl font-bold mb-4">
                {t.noRecipesYet}
              </div>
              <p className="text-gray-600 mb-8 text-lg">
                {t.startAddingFirstRecipe}
              </p>
              <a 
                href="/add"
                className="inline-block px-8 py-4 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                style={{ backgroundColor: '#ff6b35' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
              >
                {t.addFirstRecipe}
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden flex items-center justify-center shadow-inner">
                {recipe.image ? (
                  <Image
                    src={recipe.image}
                    alt={recipe.name}
                    fill
                    unoptimized
                    className="object-cover"
                    onError={(e) => {
                      const wrapper = e.currentTarget.parentElement;
                      if (wrapper) {
                        (wrapper as HTMLElement).style.display = 'none';
                        wrapper.nextElementSibling?.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}
                <div className={`flex flex-col items-center justify-center text-gray-400 ${recipe.image ? 'hidden' : ''}`}>
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">{t.noPhoto}</span>
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-lg mb-3 text-center text-gray-800">{recipe.name}</h3>
                
                <div className="space-y-2 text-sm text-gray-600 text-center flex-grow">
                  {/* Recipe details removed for cleaner preview */}
                </div>

                {recipe.categories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {recipe.categories.map((category) => (
                      <span
                        key={typeof category === 'string' ? category : (category as any).id}
                        className="px-3 py-1 bg-orange-200 text-orange-800 text-xs rounded-full font-medium shadow-sm"
                      >
                        {translateCategory(typeof category === 'string' ? category : (category as any).name)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex gap-2 justify-center">
                  <a 
                    href={`/recipes/${recipe.id}`}
                    className="flex-1 px-4 py-2 text-white text-sm rounded-lg text-center font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    style={{ backgroundColor: '#ff6b35' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
                  >
                    {t.view}
                  </a>
                  <a 
                    href={`/recipes/${recipe.id}/edit`}
                    className="px-4 py-2 bg-white text-gray-700 text-sm rounded-lg hover:bg-gray-50 font-medium shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 text-center"
                  >
                    {t.edit}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}