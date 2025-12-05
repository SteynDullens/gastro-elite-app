"use client";

import RecipeList from "@/components/RecipeList";
import { useRecipes } from "@/context/RecipeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Bubble, { BackBubble } from "@/components/Bubble";

export default function RecipesPage() {
  const { recipes } = useRecipes();
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="bubble-grid">
        <Bubble variant="light" className="col-span-full text-center">
          <div className="text-gray-500">{t.loading}</div>
        </Bubble>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <BackBubble href="/" className="absolute top-4 left-4 z-10" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.recipes}</h1>
            <p className="text-gray-600">{t.manageRecipeCollection}</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">📋</div>
              <h2 className="text-xl font-semibold mb-2">{t.recipes}</h2>
              <p className="text-gray-600 text-sm">
                {t.loginToViewRecipes}
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <a 
                href="/login" 
                className="flex-1 px-6 py-3 text-white text-center rounded-xl font-medium transition-all duration-200"
                style={{ backgroundColor: '#ff6b35' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
              >
                {t.login}
              </a>
              <a 
                href="/register" 
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 text-center rounded-xl font-medium hover:bg-gray-300 transition-all duration-200"
              >
                {t.createAccount}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackBubble href="/" className="absolute top-4 left-4 z-10" />
      
      <div className="text-center">
        <h1 className="text-3xl font-bold">{t.recipes}</h1>
      </div>
      
      {/* Recipe List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">{t.loading}</div>
          </div>
        ) : (
          <RecipeList recipes={(recipes || []).map(recipe => ({
            ...recipe,
            categories: recipe.categories.map((cat: any) => typeof cat === 'string' ? cat : cat.name)
          }))} />
        )}
      </div>
    </div>
  );
}
