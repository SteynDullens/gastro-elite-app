"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

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
}

interface RecipeListProps {
  recipes: Recipe[];
}

export default function RecipeList({ recipes }: RecipeListProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

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
    const matchesCategory = !selectedCategory || recipe.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Horizontal Scrollable Filter Bar */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedCategory === ""
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {t.allCategories}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          {searchTerm || selectedCategory ? (
            <>
              <div className="text-gray-500 text-lg mb-2">{t.noRecipesFound}</div>
              <p className="text-gray-400">
                {t.tryAdjustingSearch}
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🍽️</div>
              <div className="text-gray-600 text-xl font-semibold mb-2">
                Er zijn nog geen recepturen toegevoegd
              </div>
              <p className="text-gray-500 mb-6">
                Begin snel met het toevoegen van je eerste recept!
              </p>
              <a 
                href="/add"
                className="inline-block px-6 py-3 text-white rounded-xl font-medium transition-all duration-200"
                style={{ backgroundColor: '#FF8C00' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
              >
                Eerste recept toevoegen
              </a>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden flex items-center justify-center">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`flex flex-col items-center justify-center text-gray-400 ${recipe.image ? 'hidden' : ''}`}>
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">No photo</span>
                </div>
              </div>
              
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg mb-2 text-center">{recipe.name}</h3>
                
                <div className="space-y-2 text-sm text-gray-600 text-center flex-grow">
                  {/* Recipe details removed for cleaner preview */}
                </div>

                {recipe.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1 justify-center">
                    {recipe.categories.map((category) => (
                      <span
                        key={typeof category === 'string' ? category : (category as any).id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {typeof category === 'string' ? category : (category as any).name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-2 justify-center">
                  <a 
                    href={`/recipes/${recipe.id}`}
                    className="flex-1 px-3 py-2 text-white text-sm rounded-md text-center"
                    style={{ backgroundColor: '#FF8C00' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
                  >
                    {t.view}
                  </a>
                  <button className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300">
                    {t.edit}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
