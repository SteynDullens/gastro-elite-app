"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Recipe {
  id: string;
  name: string;
  isSharedWithBusiness: boolean;
  originalOwnerId: string;
}

export default function RecipeSharingControls() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRecipes();
  }, []);

  const fetchUserRecipes = async () => {
    try {
      const response = await fetch('/api/recipes/user-recipes', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Error fetching user recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSharing = async (recipeId: string, isShared: boolean) => {
    setUpdating(recipeId);
    try {
      const response = await fetch('/api/recipes/sharing', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipeId,
          isSharedWithBusiness: isShared
        })
      });

      if (response.ok) {
        setRecipes(prev => prev.map(recipe => 
          recipe.id === recipeId 
            ? { ...recipe, isSharedWithBusiness: isShared }
            : recipe
        ));
      } else {
        alert('Er is een fout opgetreden bij het bijwerken van de deelinstellingen');
      }
    } catch (error) {
      console.error('Error updating sharing:', error);
      alert('Er is een fout opgetreden bij het bijwerken van de deelinstellingen');
    } finally {
      setUpdating(null);
    }
  };

  const toggleAllSharing = async (shareAll: boolean) => {
    setUpdating('all');
    try {
      const promises = recipes.map(recipe => 
        toggleSharing(recipe.id, shareAll)
      );
      await Promise.all(promises);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-gray-500">Laden...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Recepten delen met bedrijf</h3>
        <p className="text-gray-600 text-sm">
          Kies welke van je persoonlijke recepten zichtbaar moeten zijn in de bedrijfsdatabase.
        </p>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">Geen persoonlijke recepten gevonden</div>
          <p className="text-gray-400 text-sm">
            Maak eerst een recept aan om deelinstellingen te beheren.
          </p>
        </div>
      ) : (
        <>
          {/* Bulk Actions */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => toggleAllSharing(true)}
              disabled={updating === 'all'}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              {updating === 'all' ? 'Bijwerken...' : 'Alles delen'}
            </button>
            <button
              onClick={() => toggleAllSharing(false)}
              disabled={updating === 'all'}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              {updating === 'all' ? 'Bijwerken...' : 'Alles verbergen'}
            </button>
          </div>

          {/* Recipe List */}
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{recipe.name}</h4>
                  <p className="text-sm text-gray-500">
                    {recipe.isSharedWithBusiness ? 'Zichtbaar in bedrijfsdatabase' : 'Alleen persoonlijk'}
                  </p>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recipe.isSharedWithBusiness}
                      onChange={(e) => toggleSharing(recipe.id, e.target.checked)}
                      disabled={updating === recipe.id}
                      className="sr-only"
                    />
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      recipe.isSharedWithBusiness ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        recipe.isSharedWithBusiness ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {updating === recipe.id ? 'Bijwerken...' : recipe.isSharedWithBusiness ? 'Delen' : 'Verbergen'}
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}





