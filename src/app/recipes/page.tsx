"use client";

import RecipeList from "@/components/RecipeList";
import { useRecipes } from "@/context/RecipeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Bubble, { BackBubble } from "@/components/Bubble";
import { useEffect } from "react";

export default function RecipesPage() {
  const { recipes, fetchRecipes } = useRecipes();
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  
  // Force fetch recipes when page loads and user is ready
  useEffect(() => {
    if (!loading && user) {
      console.log('📄 RecipesPage: User ready, ensuring recipes are fetched...', {
        userId: user.id
      });
      // Small delay to ensure RecipeContext has initialized
      const timer = setTimeout(() => {
        console.log('📄 RecipesPage: Triggering fetchRecipes...');
        fetchRecipes();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);
  
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
      <div className="relative min-h-[60vh] flex items-center justify-center py-8">
        <div className="relative w-full max-w-md">
          <BackBubble href="/" className="absolute -top-2 left-0 z-10 sm:top-0" />
          
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
    <div className="relative w-full max-w-6xl mx-auto space-y-6">
      <BackBubble href="/" className="absolute top-0 left-0 z-10" />
      
      <header className="text-center pt-2 space-y-2">
        <p className="text-[11px] uppercase tracking-[0.35em] text-stone-500 font-medium">Gastro-Elite</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">{t.recipes}</h1>
        <p className="text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">{t.manageRecipeCollection}</p>
      </header>
      
      {/* Recipe List */}
      <div className="bg-white border border-stone-200/90 rounded-lg p-5 sm:p-6 shadow-sm">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">{t.loading}</div>
          </div>
        ) : (
          <RecipeList
            recipes={(recipes || []).map((recipe) => ({
              ...recipe,
              categories: (recipe.categories ?? []).map((cat: any) =>
                typeof cat === "string" ? cat : cat?.name ?? ""
              ),
            }))}
          />
        )}
      </div>
    </div>
  );
}
