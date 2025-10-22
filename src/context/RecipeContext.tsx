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
      const response = await fetch('/api/recipes/unified', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
      } else {
        setRecipes(initialRecipes);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setRecipes(initialRecipes);
    }
  };

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt'>) => {
    // Refresh recipes from server instead of optimistic update
    fetchRecipes();
  };

  const updateRecipe = (id: string, recipeData: Partial<Recipe>) => {
    setRecipes(prev => 
      prev.map(recipe => 
        recipe.id === id ? { ...recipe, ...recipeData } : recipe
      )
    );
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== id));
  };

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, updateRecipe, deleteRecipe }}>
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
