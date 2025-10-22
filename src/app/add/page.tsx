"use client";

import RecipeForm from "@/components/RecipeForm";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function AddPage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">{t.loading}</div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Toevoegen receptuur</h1>
            <p className="text-gray-600">Maak nieuwe recepten aan</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">➕</div>
              <h2 className="text-xl font-semibold mb-2">Toevoegen receptuur</h2>
              <p className="text-gray-600 text-sm">
                Log in of maak een account aan om recepten toe te voegen.
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
                Account aanmaken
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Toevoegen receptuur</h1>
          <p className="text-gray-600 mt-1">Vul de gegevens in om een nieuwe receptuur toe te voegen.</p>
        </div>

        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <RecipeForm />
        </div>
      </div>
    </div>
  );
}


