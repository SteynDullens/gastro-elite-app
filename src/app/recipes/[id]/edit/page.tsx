"use client";

import RecipeForm from "@/components/RecipeForm";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRecipes } from "@/context/RecipeContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EditRecipePage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const { recipes, fetchRecipes } = useRecipes();
  const params = useParams();
  const router = useRouter();
  const recipeId = params?.id as string;

  const [listReady, setListReady] = useState(false);

  /** Ensure recipes are loaded after navigation (avoids “not found” / auth races on full reload). */
  useEffect(() => {
    if (!user?.id || !recipeId) {
      setListReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await fetchRecipes();
      } finally {
        if (!cancelled) setListReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, recipeId, fetchRecipes]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const recipe = recipes.find((r) => r.id === recipeId);

  if (loading || (user && !listReady)) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">{t.loading}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-4">Recept niet gevonden</h1>
          <Link
            href="/recipes"
            className="inline-block px-6 py-3 text-white rounded-xl font-medium"
            style={{ backgroundColor: "#ff6b35" }}
          >
            Terug naar recepten
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Recept bewerken</h1>
          <p className="text-gray-600 mt-1">Wijzig de details van je recept</p>
        </div>

        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <RecipeForm recipeId={recipeId} initialData={recipe} />
        </div>
      </div>
    </div>
  );
}
