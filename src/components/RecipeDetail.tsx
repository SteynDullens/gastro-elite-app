"use client";

import { useLanguage } from "@/context/LanguageContext";

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
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">{recipe.name}</h1>
        
        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`flex flex-col items-center justify-center text-gray-400 ${recipe.image ? 'hidden' : ''}`}>
            <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-lg">{t.noPhotoAvailable}</span>
          </div>
        </div>

        <div className="flex justify-center gap-6 text-sm text-gray-600">
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
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ingredients */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{t.ingredientsLabel}</h2>
        <div className="grid gap-3">
          {recipe.ingredients.map((ingredient) => (
            <div key={ingredient.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <span className="font-medium">{ingredient.name}</span>
              <span className="text-gray-600">
                {ingredient.quantity} {ingredient.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {recipe.instructions && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{t.instructionsLabel}</h2>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {recipe.instructions}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <button 
          className="px-6 py-2 text-white rounded-md hover:bg-opacity-90"
          style={{ backgroundColor: '#FF8C00' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
        >
          {t.editRecipe}
        </button>
        <button 
          className="px-6 py-2 text-white rounded-md hover:bg-opacity-90"
          style={{ backgroundColor: '#FF8C00' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
        >
          {t.printRecipe}
        </button>
        <button className="px-6 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200">
          {t.deleteRecipe}
        </button>
      </div>
    </div>
  );
}
