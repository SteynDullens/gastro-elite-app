"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

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
  const { user, loading: authLoading } = useAuth();
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    try {
      console.log('🔄 RecipeContext: Fetching recipes from server...', {
        timestamp: new Date().toISOString(),
        userId: user?.id
      });
      // Add cache-busting timestamp to ensure fresh data
      const url = `/api/recipes/unified?t=${Date.now()}&_=${Math.random()}`;
      console.log('📡 Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        const recipeCount = data.recipes?.length || 0;
        console.log(`✅ RecipeContext: Fetched ${recipeCount} recipes from server`);
        console.log('📦 Response data:', {
          recipeCount,
          hasRecipes: !!data.recipes,
          isArray: Array.isArray(data.recipes)
        });
        
        if (recipeCount > 0) {
          console.log('📋 Recipe names:', data.recipes.map((r: any) => ({ 
            name: r.name, 
            type: r.companyId ? 'company' : 'personal',
            id: r.id,
            userId: r.userId,
            companyId: r.companyId
          })));
        } else {
          console.warn('⚠️ RecipeContext: No recipes returned from server');
        }
        
        setRecipes(data.recipes || []);
      } else {
        const errorText = await response.text();
        console.error('❌ RecipeContext: Failed to fetch recipes:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        setRecipes(initialRecipes);
      }
    } catch (error: any) {
      console.error('❌ RecipeContext: Error fetching recipes:', {
        message: error.message,
        stack: error.stack
      });
      setRecipes(initialRecipes);
    }
  }, [user?.id]);

  // Fetch recipes when auth is ready and user is loaded
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('⏳ RecipeContext: Waiting for auth to finish loading...');
      return;
    }
    
    const currentUserId = user?.id || null;
    
    // Always fetch on mount or when user changes
    // Use a ref-like pattern with state to track if we've fetched for this user
    if (currentUserId !== lastUserId) {
      console.log('🔄 RecipeContext: User changed, fetching recipes...', { 
        hasUser: !!user, 
        userId: currentUserId,
        lastUserId,
        reason: lastUserId === null ? 'initial-load' : 'user-changed'
      });
      fetchRecipes();
      setLastUserId(currentUserId);
    } else if (lastUserId === null && !user) {
      // No user logged in, but auth is ready - fetch anyway (will return empty array)
      console.log('🔄 RecipeContext: No user, fetching empty recipes...');
      fetchRecipes();
      setLastUserId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

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
