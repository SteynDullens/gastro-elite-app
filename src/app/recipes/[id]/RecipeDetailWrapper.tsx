"use client";

import { useRecipes } from "@/context/RecipeContext";
import RecipeDetail from "@/components/RecipeDetail";
import Link from "next/link";

interface RecipeDetailWrapperProps {
  id: string;
}

export default function RecipeDetailWrapper({ id }: RecipeDetailWrapperProps) {
  const { recipes } = useRecipes();
  const recipe = recipes.find(r => r.id === id);

  if (!recipe) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Recipe Not Found</h1>
        <p className="text-gray-600 mb-6">The recipe you&apos;re looking for doesn&apos;t exist.</p>
        <Link 
          href="/recipes" 
          className="px-4 py-2 text-white rounded-md"
          style={{ backgroundColor: '#FF8C00' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
        >
          Back to Recipes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/recipes" 
          className="flex items-center gap-1 hover:underline"
          style={{ color: '#FF8C00' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#cc7000'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#FF8C00'}
        >
          ← Back to Recipes
        </Link>
      </div>
      <RecipeDetail recipe={{
        ...recipe,
        categories: recipe.categories.map((cat: any) => typeof cat === 'string' ? cat : cat.name)
      }} />
    </div>
  );
}
