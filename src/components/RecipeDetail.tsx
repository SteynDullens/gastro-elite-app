"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";
import Link from "next/link";
import RecipeImagePlaceholder from "@/components/RecipeImagePlaceholder";
import { displayRecipeImageUrl } from "@/lib/recipe-image-url";

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

interface RecipeDetailProps {
  recipe: Recipe;
}

export default function RecipeDetail({ recipe }: RecipeDetailProps) {
  const { t } = useLanguage();
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    setCoverFailed(false);
  }, [recipe.id, recipe.image]);

  const showImage = Boolean(recipe.image) && !coverFailed;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold text-stone-900 tracking-tight">{recipe.name}</h1>
        
        <div className="relative aspect-video bg-stone-100 rounded-lg overflow-hidden border border-stone-200/90 shadow-sm">
          {showImage ? (
            <Image
              src={displayRecipeImageUrl(recipe.image!)}
              alt={recipe.name}
              fill
              unoptimized
              className="object-cover"
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <RecipeImagePlaceholder className="absolute inset-0 min-h-[200px]" />
          )}
        </div>

        <div className="flex justify-center gap-6 text-sm text-stone-600">
          {recipe.batchSize && (
            <div>
              <span className="font-medium">{t.batchSizeLabel}</span> {recipe.batchSize}
            </div>
          )}
          {recipe.servings && (
            <div>
              <span className="font-medium">{t.servingsLabel}</span> {recipe.servings}
            </div>
          )}
          <div>
            <span className="font-medium">{t.ingredientsLabel}:</span> {recipe.ingredients.length}
          </div>
        </div>

        {recipe.categories.length > 0 && (
          <div className="flex justify-center flex-wrap gap-2">
            {recipe.categories.map((category) => (
              <span
                key={category}
                className="px-3 py-1 bg-stone-50 text-stone-700 text-sm rounded-md border border-stone-200/90"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ingredients */}
      <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-stone-900">{t.ingredientsLabel}</h2>
        <div className="grid gap-3">
          {recipe.ingredients.map((ingredient) => (
            <div key={ingredient.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-b-0">
              <span className="font-medium text-stone-900">{ingredient.name}</span>
              <span className="text-stone-600">
                {ingredient.quantity} {ingredient.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {recipe.instructions && (
        <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-stone-900">{t.instructionsLabel}</h2>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-stone-700 leading-relaxed">
              {recipe.instructions}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href={`/recipes/${recipe.id}/edit`}
          className="px-6 py-2.5 text-white rounded-md hover:bg-stone-800 inline-block text-center font-medium bg-stone-900 transition-colors"
        >
          {t.editRecipe}
        </Link>
        <button 
          type="button"
          className="px-6 py-2.5 text-stone-800 rounded-md font-medium border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
        >
          {t.printRecipe}
        </button>
        <button type="button" className="px-6 py-2.5 bg-red-50 text-red-800 rounded-md border border-red-200 hover:bg-red-100 font-medium transition-colors">
          {t.deleteRecipe}
        </button>
      </div>
    </div>
  );
}
