"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

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
  categories: (string | { id: string; name: string })[];
  createdAt: string;
}

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  fetchRecipes: () => Promise<void>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// Start with empty recipes - no default data
const initialRecipes: Recipe[] = [];

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      // Add cache-busting timestamp to ensure fresh data
      const response = await fetch(`/api/recipes/unified?t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched recipes:', data.recipes?.length || 0);
        setRecipes(data.recipes || []);
      } else {
        console.error('❌ Failed to fetch recipes:', response.status);
        setRecipes(initialRecipes);
      }
    } catch (error) {
      console.error('❌ Error fetching recipes:', error);
      setRecipes(initialRecipes);
    }
  };

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt'>) => {
    // Refresh recipes from server for real-time update
    fetchRecipes();
  };

  const updateRecipe = (id: string, recipeData: Partial<Recipe>) => {
    // Optimistic update + refresh from server
    setRecipes(prev => 
      prev.map(recipe => 
        recipe.id === id ? { ...recipe, ...recipeData } : recipe
      )
    );
    // Refresh from server to ensure consistency
    fetchRecipes();
  };

  const deleteRecipe = (id: string) => {
    // Optimistic update - remove immediately from UI
    setRecipes(prev => prev.filter(recipe => recipe.id !== id));
  };

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, updateRecipe, deleteRecipe, fetchRecipes }}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
}
