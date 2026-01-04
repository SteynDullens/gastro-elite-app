"use client";

import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRecipes } from "@/context/RecipeContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/Toast";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
  userId?: string | null;
  companyId?: string | null;
  originalOwnerId?: string | null;
  isSharedWithBusiness?: boolean;
}

interface RecipeListProps {
  recipes: Recipe[];
}

type ViewMode = "grid" | "row" | "alphabetical";

export default function RecipeList({ recipes }: RecipeListProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { deleteRecipe: deleteRecipeFromContext, fetchRecipes } = useRecipes();
  const { toasts, success, error, removeToast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [databaseFilter, setDatabaseFilter] = useState<"all" | "personal" | "business">("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid"); // Default to grid (current view)
  const alphabetRef = useRef<HTMLDivElement>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  
  // Check if user can edit a recipe
  const canEditRecipe = (recipe: Recipe): boolean => {
    if (!user) return false;
    
    const isCompanyOwner = !!user.ownedCompany?.id;
    const hasActiveMemberships = user.companyMemberships && user.companyMemberships.length > 0;
    const hasLegacyCompanyId = !!user.companyId;
    const isEmployee = (hasActiveMemberships || hasLegacyCompanyId) && !isCompanyOwner;
    const isCompanyRecipe = !!recipe.companyId;
    const isPersonalRecipe = !!recipe.userId && !recipe.companyId;
    
    if (isCompanyRecipe) {
      const isRecipeCreator = recipe.originalOwnerId === user.id;
      const employeeCompanyIds = (user.companyMemberships || []).map((m) => m.companyId);
      const companyIdsToCheck = employeeCompanyIds.length > 0 
        ? employeeCompanyIds 
        : (user.companyId ? [user.companyId] : []);
      const belongsToCompany = isCompanyOwner 
        ? user.ownedCompany?.id === recipe.companyId
        : companyIdsToCheck.includes(recipe.companyId!);
      return belongsToCompany && (isCompanyOwner || (isEmployee && isRecipeCreator));
    } else if (isPersonalRecipe) {
      return recipe.userId === user.id;
    }
    return false;
  };

  // Check if user can delete a recipe
  const canDeleteRecipe = (recipe: Recipe): boolean => {
    if (!user) return false;
    
    const isCompanyOwner = !!user.ownedCompany?.id;
    const hasActiveMemberships = user.companyMemberships && user.companyMemberships.length > 0;
    const hasLegacyCompanyId = !!user.companyId;
    const isEmployee = (hasActiveMemberships || hasLegacyCompanyId) && !isCompanyOwner;
    const isCompanyRecipe = !!recipe.companyId;
    const isPersonalRecipe = !!recipe.userId && !recipe.companyId;
    
    if (isCompanyRecipe) {
      const isRecipeCreator = recipe.originalOwnerId === user.id;
      const employeeCompanyIds = (user.companyMemberships || []).map((m) => m.companyId);
      const companyIdsToCheck = employeeCompanyIds.length > 0 
        ? employeeCompanyIds 
        : (user.companyId ? [user.companyId] : []);
      const belongsToCompany = isCompanyOwner 
        ? user.ownedCompany?.id === recipe.companyId
        : companyIdsToCheck.includes(recipe.companyId!);
      return belongsToCompany && (isCompanyOwner || (isEmployee && isRecipeCreator));
    } else if (isPersonalRecipe) {
      return recipe.userId === user.id;
    }
    return false;
  };

  const handleDeleteClick = (recipeId: string) => {
    setDeleteConfirmId(recipeId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recipes/${deleteConfirmId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        deleteRecipeFromContext(deleteConfirmId);
        await fetchRecipes();
        success(t.recipeDeletedSuccessfully || 'Recipe deleted successfully');
        setDeleteConfirmId(null);
      } else {
        const data = await response.json();
        error(data.error || t.deleteFailed || 'Failed to delete recipe');
      }
    } catch (err) {
      console.error('Delete error:', err);
      error(t.deleteFailed || 'Failed to delete recipe');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const translateCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'Voorgerecht': t.catVoorgerecht,
      'Tussengerecht': t.catTussengerecht,
      'Hoofdgerecht': t.catHoofdgerecht,
      'Dessert': t.catDessert,
      'Groentegarnituur': t.catGroentegarnituur,
      'Vlees': t.catVlees,
      'Vis': t.catVis,
      'Vegetarisch': t.catVegetarisch,
      'Zetmeelgarnituur': t.catZetmeelgarnituur,
      'Gebonden sauzen': t.catGebondenSauzen,
      'Koude sauzen': t.catKoudeSauzen,
      'Soepen': t.catSoepen,
      'Salades': t.catSalades,
      'Brood': t.catBrood,
      'Dranken': t.catDranken,
    };
    return categoryMap[category] || category;
  };

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/recipes/categories', { cache: 'no-store' });
        const data = await res.json();
        if (!isMounted) return;
        if (res.ok) {
          const names = (data.categories || []).map((c: { name: string }) => c.name);
          setCategories(names);
          setSelectedCategory(prev => (prev && !names.includes(prev) ? "" : prev));
        } else {
          setCategories([]);
        }
      } catch {
        setCategories([]);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const isCompanyOwner = !!user?.ownedCompany?.id;
  const hasActiveMemberships = user?.companyMemberships && user.companyMemberships.length > 0;
  const hasLegacyCompanyId = !!user?.companyId;
  const isEmployee = (hasActiveMemberships || hasLegacyCompanyId) && !isCompanyOwner;
  const isPersonalUser = !isCompanyOwner && !isEmployee;

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const recipeCategories = recipe.categories.map((cat: any) => 
      typeof cat === 'string' ? cat : (cat?.name || cat)
    );
    const matchesCategory = !selectedCategory || recipeCategories.includes(selectedCategory);
    
    let matchesDatabase = true;
    
    if (isCompanyOwner && recipe.userId) {
      matchesDatabase = false;
    } else if (isPersonalUser && recipe.companyId) {
      matchesDatabase = false;
    } else if (databaseFilter === "personal") {
      matchesDatabase = !!recipe.userId && !recipe.companyId;
    } else if (databaseFilter === "business") {
      matchesDatabase = !!recipe.companyId && !recipe.userId;
    }
    
    return matchesSearch && matchesCategory && matchesDatabase;
  });

  // Group recipes alphabetically for alphabetical view
  const groupedByLetter = filteredRecipes.reduce((acc: Record<string, Recipe[]>, recipe) => {
    const firstLetter = recipe.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(recipe);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedByLetter).sort();

  // Scroll to letter in alphabetical view
  const scrollToLetter = (letter: string) => {
    setSelectedLetter(letter);
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Recipe card component (reusable)
  const RecipeCard = ({ recipe, variant = "grid" }: { recipe: Recipe; variant?: "grid" | "row" | "alphabetical" }) => {
    const isRow = variant === "row";
    const isAlphabetical = variant === "alphabetical";
    
    if (isRow) {
      // Row View - Professional Gronda-style
      return (
        <div className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
          <div className="flex items-center gap-6 p-4">
            {/* Image */}
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              {recipe.image ? (
                <Image
                  src={recipe.image}
                  alt={recipe.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{recipe.name}</h3>
                    {recipe.companyId ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                        {t.businessDatabase || 'Business'}
                      </span>
                    ) : recipe.userId ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {t.personalDatabase || 'Personal'}
                      </span>
                    ) : null}
                  </div>
                  
                  {recipe.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {recipe.categories.slice(0, 3).map((category) => (
                        <span
                          key={typeof category === 'string' ? category : (category as any).id}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {translateCategory(typeof category === 'string' ? category : (category as any).name)}
                        </span>
                      ))}
                      {recipe.categories.length > 3 && (
                        <span className="px-2 py-0.5 text-gray-500 text-xs">+{recipe.categories.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {recipe.ingredients.length > 0 && (
                      <span>{recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'ingredient' : 'ingredients'}</span>
                    )}
                    {(recipe.batchSize || recipe.servings) && (
                      <span>•</span>
                    )}
                    {recipe.batchSize && (
                      <span>{recipe.batchSize} {t.pieces || 'stuks'}</span>
                    )}
                    {recipe.servings && (
                      <span>{recipe.servings} {t.persons || 'personen'}</span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a 
                    href={`/recipes/${recipe.id}`}
                    className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    {t.view}
                  </a>
                  {canEditRecipe(recipe) && (
                    <a 
                      href={`/recipes/${recipe.id}/edit`}
                      className="px-4 py-2 bg-white text-gray-700 text-sm rounded-lg hover:bg-gray-50 font-medium border border-gray-300 transition-colors"
                    >
                      {t.edit}
                    </a>
                  )}
                  {canDeleteRecipe(recipe) && (
                    <button
                      onClick={() => handleDeleteClick(recipe.id)}
                      className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 font-medium transition-colors"
                      title={t.delete || 'Delete'}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (isAlphabetical) {
      // Alphabetical View - Simple list item
      return (
        <div className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900">{recipe.name}</h3>
              {recipe.companyId ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  {t.businessDatabase || 'Business'}
                </span>
              ) : recipe.userId ? (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {t.personalDatabase || 'Personal'}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a 
                href={`/recipes/${recipe.id}`}
                className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors font-medium"
              >
                {t.view}
              </a>
              {canEditRecipe(recipe) && (
                <a 
                  href={`/recipes/${recipe.id}/edit`}
                  className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded hover:bg-gray-50 font-medium border border-gray-300 transition-colors"
                >
                  {t.edit}
                </a>
              )}
              {canDeleteRecipe(recipe) && (
                <button
                  onClick={() => handleDeleteClick(recipe.id)}
                  className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 font-medium transition-colors"
                  title={t.delete || 'Delete'}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      // Grid View - Current view (fallback)
      return (
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden flex items-center justify-center shadow-inner">
            {recipe.image ? (
              <Image
                src={recipe.image}
                alt={recipe.name}
                fill
                unoptimized
                className="object-cover"
                onError={(e) => {
                  const wrapper = e.currentTarget.parentElement;
                  if (wrapper) {
                    (wrapper as HTMLElement).style.display = 'none';
                    wrapper.nextElementSibling?.classList.remove('hidden');
                  }
                }}
              />
            ) : null}
            <div className={`flex flex-col items-center justify-center text-gray-400 ${recipe.image ? 'hidden' : ''}`}>
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">{t.noPhoto}</span>
            </div>
          </div>
          
          <div className="p-5 flex flex-col flex-grow">
            <div className="mb-2 flex justify-center">
              {recipe.companyId ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold shadow-sm">
                  {t.businessDatabase || 'Business'}
                </span>
              ) : recipe.userId ? (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold shadow-sm">
                  {t.personalDatabase || 'Personal'}
                </span>
              ) : null}
            </div>
            
            <h3 className="font-bold text-lg mb-3 text-center text-gray-800">{recipe.name}</h3>
            
            {recipe.categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {recipe.categories.map((category) => (
                  <span
                    key={typeof category === 'string' ? category : (category as any).id}
                    className="px-3 py-1 bg-orange-200 text-orange-800 text-xs rounded-full font-medium shadow-sm"
                  >
                    {translateCategory(typeof category === 'string' ? category : (category as any).name)}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex gap-2 justify-center">
              <a 
                href={`/recipes/${recipe.id}`}
                className="flex-1 px-4 py-2 text-white text-sm rounded-lg text-center font-medium shadow-md hover:shadow-lg transition-all duration-200"
                style={{ backgroundColor: '#ff6b35' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
              >
                {t.view}
              </a>
              {canEditRecipe(recipe) && (
                <a 
                  href={`/recipes/${recipe.id}/edit`}
                  className="px-4 py-2 bg-white text-gray-700 text-sm rounded-lg hover:bg-gray-50 font-medium shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 text-center"
                >
                  {t.edit}
                </a>
              )}
              {canDeleteRecipe(recipe) && (
                <button
                  onClick={() => handleDeleteClick(recipe.id)}
                  className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  title={t.delete || 'Delete'}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (() => {
        const recipeToDelete = recipes.find(r => r.id === deleteConfirmId);
        return (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) {
                handleDeleteCancel();
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                {t.confirmDelete || 'Confirm Delete'}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.deleteRecipeConfirmation || 'Are you sure you want to delete this recipe? This action cannot be undone.'}
              </p>
              {recipeToDelete && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>{t.recipeName || 'Recipe'}:</strong>
                  </p>
                  <p className="font-semibold text-gray-900">
                    &ldquo;{recipeToDelete.name}&rdquo;
                  </p>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium disabled:opacity-50"
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>{t.deleting || 'Deleting...'}</span>
                    </>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>{t.delete || 'Delete'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 shadow-sm bg-white text-gray-700 placeholder-gray-500"
        />
      </div>

      {/* View Switcher */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">{t.switchView || 'Switch View'}:</span>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === "grid"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title={t.gridView || 'Grid View'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">{t.gridView || 'Grid'}</span>
            </button>
            <button
              onClick={() => setViewMode("row")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === "row"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title={t.rowView || 'Row View'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">{t.rowView || 'Row'}</span>
            </button>
            <button
              onClick={() => setViewMode("alphabetical")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === "alphabetical"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title={t.alphabeticalView || 'Alphabetical View'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">{t.alphabeticalView || 'Alphabetical'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Database Filter Buttons */}
      {(() => {
        const isCompanyOwner = !!user?.ownedCompany?.id;
        const hasCompany = !!(user?.companyId || user?.ownedCompany?.id);
        const hasPersonalRecipes = recipes.some(r => !!r.userId && !r.companyId);
        const hasBusinessRecipes = recipes.some(r => !!r.companyId);
        const shouldShowFilters = hasCompany || (hasPersonalRecipes && hasBusinessRecipes);
        
        if (!shouldShowFilters) return null;
        
        return (
          <div className="mb-4 flex gap-3 flex-wrap">
            <button
              onClick={() => setDatabaseFilter("all")}
              className={`px-5 py-2.5 rounded-lg whitespace-nowrap transition-all duration-200 font-medium ${
                databaseFilter === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Alle recepten
            </button>
            {!isCompanyOwner && hasPersonalRecipes && (
              <button
                onClick={() => setDatabaseFilter("personal")}
                className={`px-5 py-2.5 rounded-lg whitespace-nowrap transition-all duration-200 font-medium ${
                  databaseFilter === "personal"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-blue-50 border border-blue-300"
                }`}
              >
                {t.personalDatabase}
              </button>
            )}
            {hasCompany && hasBusinessRecipes && (
              <button
                onClick={() => setDatabaseFilter("business")}
                className={`px-5 py-2.5 rounded-lg whitespace-nowrap transition-all duration-200 font-medium ${
                  databaseFilter === "business"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-green-50 border border-green-300"
                }`}
              >
                {t.businessDatabase}
              </button>
            )}
          </div>
        );
      })()}

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-5 py-2.5 rounded-lg whitespace-nowrap transition-all duration-200 font-medium ${
              selectedCategory === ""
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            {t.allCategories}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-lg whitespace-nowrap transition-all duration-200 font-medium ${
                selectedCategory === category
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              {translateCategory(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Display */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-16">
          {searchTerm || selectedCategory ? (
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
              <div className="text-gray-600 text-xl font-semibold mb-3">{t.noRecipesFound}</div>
              <p className="text-gray-500">{t.tryAdjustingSearch}</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 border border-gray-200">
              <div className="text-6xl mb-6">🍽️</div>
              <div className="text-gray-800 text-2xl font-bold mb-4">{t.noRecipesYet}</div>
              <p className="text-gray-600 mb-8 text-lg">{t.startAddingFirstRecipe}</p>
              <a 
                href="/add"
                className="inline-block px-8 py-4 bg-gray-900 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:bg-gray-800"
              >
                {t.addFirstRecipe}
              </a>
            </div>
          )}
        </div>
      ) : viewMode === "row" ? (
        // View 1: Row View (Gronda-style) - Professional row layout
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {filteredRecipes.map((recipe, index) => (
            <div key={recipe.id}>
              <RecipeCard recipe={recipe} variant="row" />
              {index < filteredRecipes.length - 1 && <div className="border-b border-gray-200" />}
            </div>
          ))}
        </div>
      ) : viewMode === "alphabetical" ? (
        // View 2: Alphabetical View with scrollable alphabet
        <div className="flex gap-6 relative">
          {/* Main content */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            <div className="overflow-y-auto h-full">
              {sortedLetters.length === 0 ? (
                <div className="p-8 text-center text-gray-500">{t.noRecipesFound}</div>
              ) : (
                sortedLetters.map((letter) => (
                  <div key={letter} id={`letter-${letter}`} className="scroll-mt-4">
                    {/* Letter header */}
                    <div className="sticky top-0 bg-gray-900 text-white px-6 py-3 font-bold text-lg z-10 border-b-2 border-gray-700">
                      {letter}
                    </div>
                    {/* Recipes for this letter */}
                    {groupedByLetter[letter]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((recipe, idx) => (
                        <div key={recipe.id}>
                          <RecipeCard recipe={recipe} variant="alphabetical" />
                          {idx < groupedByLetter[letter].length - 1 && <div className="border-b border-gray-100" />}
                        </div>
                      ))}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Alphabet sidebar - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="flex flex-col gap-1.5 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
                {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => {
                  const hasRecipes = sortedLetters.includes(letter);
                  return (
                    <button
                      key={letter}
                      onClick={() => scrollToLetter(letter)}
                      className={`w-11 h-11 rounded-lg text-sm font-bold transition-all ${
                        selectedLetter === letter
                          ? "bg-gray-900 text-white shadow-md scale-105"
                          : hasRecipes
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                          : "text-gray-300 cursor-not-allowed opacity-40"
                      }`}
                      disabled={!hasRecipes}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Mobile alphabet scrollbar - floating at bottom */}
          <div className="lg:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border-2 border-gray-300 rounded-xl p-3 shadow-2xl z-40 max-w-[95vw]">
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
              {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => {
                const hasRecipes = sortedLetters.includes(letter);
                return (
                  <button
                    key={letter}
                    onClick={() => scrollToLetter(letter)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all flex-shrink-0 flex items-center justify-center ${
                      selectedLetter === letter
                        ? "bg-gray-900 text-white scale-110"
                        : hasRecipes
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                        : "text-gray-300 cursor-not-allowed opacity-50"
                    }`}
                    disabled={!hasRecipes}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // Grid View (current/fallback)
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
