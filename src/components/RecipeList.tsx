"use client";

import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRecipes } from "@/context/RecipeContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/Toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { displayRecipeImageUrl } from "@/lib/recipe-image-url";
import { recipeMatchesSearchQuery } from "@/lib/recipe-search";
import RecipeImagePlaceholder from "@/components/RecipeImagePlaceholder";

const TrashIcon = (props: { className?: string }) => (
  <svg
    className={props.className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const PencilIcon = (props: { className?: string }) => (
  <svg className={props.className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M21.731 2.269a2.625 2.625 0 00-3.714 0l-1.157 1.157 3.714 3.714 1.157-1.157a2.625 2.625 0 000-3.714zM19.513 8.199l-3.714-3.714L3.879 16.405a4.5 4.5 0 00-1.112 1.846l-.799 2.796a.75.75 0 00.927.927l2.796-.799a4.5 4.5 0 001.846-1.112L19.513 8.199z" />
  </svg>
);

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

/** v2: nieuwe key zodat oude/local test-waarden niet raster als default forceren */
const RECIPE_VIEW_STORAGE_KEY = "gastro-elite-recipe-view-v2";

export default function RecipeList({ recipes }: RecipeListProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { deleteRecipe: deleteRecipeFromContext, fetchRecipes } = useRecipes();
  const { toasts, success, error, removeToast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [databaseFilter, setDatabaseFilter] = useState<"all" | "personal" | "business">("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("alphabetical");
  const alphabetRef = useRef<HTMLDivElement>(null);

  const persistViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(RECIPE_VIEW_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECIPE_VIEW_STORAGE_KEY);
      if (raw === "grid" || raw === "row" || raw === "alphabetical") {
        setViewMode(raw);
      }
    } catch {
      /* ignore */
    }
  }, []);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
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
          setSelectedCategories((prev) => prev.filter((c) => names.includes(c)));
        } else {
          setCategories([]);
        }
      } catch {
        setCategories([]);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };

    if (filterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterDropdownOpen]);

  const isCompanyOwner = !!user?.ownedCompany?.id;
  const hasActiveMemberships = user?.companyMemberships && user.companyMemberships.length > 0;
  const hasLegacyCompanyId = !!user?.companyId;
  const isEmployee = (hasActiveMemberships || hasLegacyCompanyId) && !isCompanyOwner;
  const isPersonalUser = !isCompanyOwner && !isEmployee;

  const filteredRecipes = recipes.filter((recipe) => {
    const categories = recipe.categories ?? [];

    const matchesSearch = recipeMatchesSearchQuery(recipe, searchTerm);

    const recipeCategories = categories.map((cat: any) =>
      typeof cat === "string" ? cat : cat?.name || cat
    );
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.some((sel) => recipeCategories.includes(sel));
    
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
    const nm = (recipe.name ?? "").trim();
    const firstLetter = nm ? nm.charAt(0).toUpperCase() : "#";
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(recipe);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedByLetter).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

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
    const [coverFailed, setCoverFailed] = useState(false);

    useEffect(() => {
      setCoverFailed(false);
    }, [recipe.id, recipe.image]);

    const isRow = variant === "row";
    const isAlphabetical = variant === "alphabetical";
    const cardCategories = recipe.categories ?? [];
    const cardIngredients = recipe.ingredients ?? [];
    const showImage = Boolean(recipe.image) && !coverFailed;

    if (isRow) {
      // Row view — tap row to open; edit/delete stop propagation
      return (
        <div
          className="bg-white border-b border-stone-200/80 hover:bg-stone-50/80 transition-colors duration-200 cursor-pointer"
          onClick={() => router.push(`/recipes/${recipe.id}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/recipes/${recipe.id}`);
            }
          }}
          role="link"
          tabIndex={0}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4">
            <div className="relative w-full sm:w-24 h-40 sm:h-24 flex-shrink-0 rounded-md overflow-hidden border border-stone-200/90 bg-stone-100 pointer-events-none">
              {showImage ? (
                <Image
                  src={displayRecipeImageUrl(recipe.image!)}
                  alt={recipe.name ?? ""}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  unoptimized
                  referrerPolicy="no-referrer"
                  onError={() => setCoverFailed(true)}
                />
              ) : (
                <RecipeImagePlaceholder compact className="h-full w-full" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-stone-900 tracking-tight break-words">{recipe.name}</h3>
                  {recipe.companyId ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded border border-emerald-900/15 bg-emerald-950/[0.04] text-emerald-900 shrink-0">
                      {t.businessDatabase || 'Business'}
                    </span>
                  ) : recipe.userId ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded border border-slate-200 bg-slate-50 text-slate-800 shrink-0">
                      {t.personalDatabase || 'Personal'}
                    </span>
                  ) : null}
                </div>
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canEditRecipe(recipe) && (
                    <Link
                      href={`/recipes/${recipe.id}/edit`}
                      className="inline-flex items-center justify-center p-2 rounded-md border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 transition-colors"
                      title={t.edit}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Link>
                  )}
                  {canDeleteRecipe(recipe) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(recipe.id)}
                      className="inline-flex items-center justify-center p-2 text-red-700 rounded-md border border-red-200 bg-white hover:bg-red-50 transition-colors"
                      title={t.delete || 'Delete'}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {cardCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 pointer-events-none">
                  {cardCategories.slice(0, 3).map((category) => (
                    <span
                      key={typeof category === 'string' ? category : (category as any).id}
                      className="px-2 py-0.5 bg-stone-50 text-stone-600 text-xs rounded-md border border-stone-200/80"
                    >
                      {translateCategory(typeof category === 'string' ? category : (category as any).name)}
                    </span>
                  ))}
                  {cardCategories.length > 3 && (
                    <span className="px-2 py-0.5 text-gray-500 text-xs">+{cardCategories.length - 3}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-stone-500 pointer-events-none flex-wrap">
                {cardIngredients.length > 0 && (
                  <span>{cardIngredients.length} {cardIngredients.length === 1 ? 'ingredient' : 'ingredients'}</span>
                )}
                {(recipe.batchSize || recipe.servings) && (
                  <span aria-hidden>•</span>
                )}
                {recipe.batchSize && (
                  <span>{recipe.batchSize} {t.pieces || 'stuks'}</span>
                )}
                {recipe.servings && (
                  <span>{recipe.servings} {t.persons || 'personen'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (isAlphabetical) {
      // Alphabetical — tap row to open recipe
      return (
        <div
          className="bg-white border-b border-stone-200/80 hover:bg-stone-50/60 transition-colors duration-150 cursor-pointer"
          onClick={() => router.push(`/recipes/${recipe.id}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/recipes/${recipe.id}`);
            }
          }}
          tabIndex={0}
          aria-label={`${recipe.name}`}
        >
          <div className="flex items-center justify-between gap-2 p-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="text-base font-medium text-stone-900 tracking-tight truncate">{recipe.name}</h3>
              {recipe.companyId ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded border border-emerald-900/15 bg-emerald-950/[0.04] text-emerald-900 shrink-0">
                  {t.businessDatabase || 'Business'}
                </span>
              ) : recipe.userId ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded border border-slate-200 bg-slate-50 text-slate-800 shrink-0">
                  {t.personalDatabase || 'Personal'}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {canEditRecipe(recipe) && (
                <Link
                  href={`/recipes/${recipe.id}/edit`}
                  className="inline-flex items-center justify-center p-2 rounded-md border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 transition-colors"
                  title={t.edit}
                >
                  <PencilIcon className="w-4 h-4" />
                </Link>
              )}
              {canDeleteRecipe(recipe) && (
                <button
                  type="button"
                  onClick={() => handleDeleteClick(recipe.id)}
                  className="inline-flex items-center justify-center p-2 text-red-700 rounded-md border border-red-200 bg-white hover:bg-red-50 transition-colors"
                  title={t.delete || 'Delete'}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      // Grid — tap card or title to open; edit/delete next to title
      return (
        <div
          className="group bg-white border border-stone-200/90 rounded-lg shadow-sm hover:shadow-md hover:border-stone-300/90 transition-all duration-300 h-full flex flex-col cursor-pointer"
          onClick={() => router.push(`/recipes/${recipe.id}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/recipes/${recipe.id}`);
            }
          }}
          tabIndex={0}
          aria-label={`${recipe.name}`}
        >
          <div className="relative aspect-video overflow-hidden bg-stone-100 border-b border-stone-200/60 pointer-events-none">
            {showImage ? (
              <Image
                src={displayRecipeImageUrl(recipe.image!)}
                alt={recipe.name ?? ""}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 480px"
                unoptimized
                referrerPolicy="no-referrer"
                onError={() => setCoverFailed(true)}
              />
            ) : (
              <RecipeImagePlaceholder className="absolute inset-0" />
            )}
          </div>

          <div className="p-5 flex flex-col flex-grow">
            <div className="mb-2 flex justify-center pointer-events-none">
              {recipe.companyId ? (
                <span className="px-2.5 py-1 text-[11px] uppercase tracking-wide font-medium rounded border border-emerald-900/15 bg-emerald-950/[0.04] text-emerald-900">
                  {t.businessDatabase || 'Business'}
                </span>
              ) : recipe.userId ? (
                <span className="px-2.5 py-1 text-[11px] uppercase tracking-wide font-medium rounded border border-slate-200 bg-slate-50 text-slate-800">
                  {t.personalDatabase || 'Personal'}
                </span>
              ) : null}
            </div>

            <div className="flex items-start justify-between gap-2 mb-3 w-full min-w-0">
              <h3 className="font-semibold text-base text-left text-stone-900 tracking-tight leading-snug flex-1 min-w-0 break-words pr-1">
                {recipe.name}
              </h3>
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {canEditRecipe(recipe) && (
                  <Link
                    href={`/recipes/${recipe.id}/edit`}
                    className="inline-flex items-center justify-center p-2 rounded-md border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 transition-colors"
                    title={t.edit}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Link>
                )}
                {canDeleteRecipe(recipe) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(recipe.id)}
                    className="inline-flex items-center justify-center p-2 text-red-700 rounded-md border border-red-200 bg-white hover:bg-red-50 transition-colors"
                    title={t.delete || 'Delete'}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {cardCategories.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2 justify-center pointer-events-none">
                {cardCategories.map((category) => (
                  <span
                    key={typeof category === 'string' ? category : (category as any).id}
                    className="px-2.5 py-0.5 bg-stone-50 text-stone-600 text-xs rounded-md border border-stone-200/90 font-medium"
                  >
                    {translateCategory(typeof category === 'string' ? category : (category as any).name)}
                  </span>
                ))}
              </div>
            )}
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
                  className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-all duration-200 font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                      <span>{t.deleting || 'Deleting...'}</span>
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-4 h-4" />
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
          className="w-full px-5 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400/25 focus:border-stone-300 shadow-sm bg-white text-stone-800 placeholder-stone-400"
        />
      </div>

      {/* View Switcher and Filter */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <span className="text-sm font-semibold text-stone-600">{t.switchView || 'Switch View'}:</span>
          <div className="flex gap-1 bg-stone-100 rounded-lg p-1 border border-stone-200/90 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => persistViewMode("alphabetical")}
              className={`px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 flex-1 sm:flex-none min-w-0 ${
                viewMode === "alphabetical"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-900"
              }`}
              title={t.alphabeticalView || "Alphabetical View"}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="sm:hidden text-[10px] font-semibold leading-tight">{t.recipeViewShortAz}</span>
              <span className="hidden sm:inline">{t.alphabeticalView || "Alphabetical"}</span>
            </button>
            <button
              type="button"
              onClick={() => persistViewMode("grid")}
              className={`px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 flex-1 sm:flex-none min-w-0 ${
                viewMode === "grid"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-900"
              }`}
              title={t.gridView || "Grid View"}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="sm:hidden text-[10px] font-semibold leading-tight truncate max-w-full">
                {t.recipeViewShortGrid}
              </span>
              <span className="hidden sm:inline">{t.gridView || "Grid"}</span>
            </button>
            <button
              type="button"
              onClick={() => persistViewMode("row")}
              className={`px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 flex-1 sm:flex-none min-w-0 ${
                viewMode === "row"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-900"
              }`}
              title={t.rowView || "Row View"}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="sm:hidden text-[10px] font-semibold leading-tight truncate max-w-full">
                {t.recipeViewShortRow}
              </span>
              <span className="hidden sm:inline">{t.rowView || "Row"}</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdown Button */}
        <div className="relative w-full sm:w-auto" ref={filterDropdownRef}>
          <button
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg border transition-all w-full sm:w-auto ${
              filterDropdownOpen || databaseFilter !== "all" || selectedCategories.length > 0
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
            }`}
            title={t.filter || 'Filter'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="hidden sm:inline text-sm font-medium">{t.filter || 'Filter'}</span>
            {(databaseFilter !== "all" || selectedCategories.length > 0) && (
              <span className="w-2 h-2 bg-white rounded-full"></span>
            )}
          </button>

          {/* Filter Dropdown Menu */}
          {filterDropdownOpen && (
            <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-72 bg-white border border-stone-200 rounded-lg shadow-xl z-[1100] max-h-[80vh] overflow-y-auto">
              <div className="p-4">
                {/* Database Filter Section */}
                {(() => {
                  const isCompanyOwner = !!user?.ownedCompany?.id;
                  const hasCompany = !!(user?.companyId || user?.ownedCompany?.id);
                  const hasPersonalRecipes = recipes.some(r => !!r.userId && !r.companyId);
                  const hasBusinessRecipes = recipes.some(r => !!r.companyId);
                  const shouldShowFilters = hasCompany || (hasPersonalRecipes && hasBusinessRecipes);
                  
                  if (!shouldShowFilters) return null;
                  
                  return (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-stone-700 mb-3">{t.database || 'Database'}</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setDatabaseFilter("all");
                            setFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                            databaseFilter === "all"
                              ? "bg-stone-900 text-white"
                              : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          {t.allRecipes || 'Alle recepten'}
                        </button>
                        {!isCompanyOwner && hasPersonalRecipes && (
                          <button
                            onClick={() => {
                              setDatabaseFilter("personal");
                              setFilterDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                              databaseFilter === "personal"
                                ? "bg-slate-800 text-white"
                                : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            {t.personalDatabase}
                          </button>
                        )}
                        {hasCompany && hasBusinessRecipes && (
                          <button
                            onClick={() => {
                              setDatabaseFilter("business");
                              setFilterDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                              databaseFilter === "business"
                                ? "bg-emerald-900 text-white"
                                : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            {t.businessDatabase}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Category Filter Section (multi-select) */}
                <div>
                  <h3 className="text-sm font-semibold text-stone-700 mb-1">{t.categories}</h3>
                  <p className="text-xs text-stone-500 mb-3">{t.multipleCategoriesHint}</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedCategories([])}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                        selectedCategories.length === 0
                          ? "bg-stone-900 text-white"
                          : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {t.allCategories}
                    </button>
                    {categories.map((category) => {
                      const checked = selectedCategories.includes(category);
                      return (
                        <label
                          key={category}
                          className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg cursor-pointer transition-all border-2 ${
                            checked
                              ? "border-stone-900 bg-stone-100 text-stone-900"
                              : "border-transparent bg-stone-50 text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-stone-400 text-stone-900 focus:ring-stone-500"
                            checked={checked}
                            onChange={() => toggleCategoryFilter(category)}
                          />
                          <span className="text-sm font-medium flex-1">{translateCategory(category)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Display */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-16">
          {searchTerm || selectedCategories.length > 0 ? (
            <div className="bg-stone-50 rounded-lg p-8 border border-stone-200/90">
              <div className="text-stone-700 text-xl font-semibold mb-3">{t.noRecipesFound}</div>
              <p className="text-stone-500">{t.tryAdjustingSearch}</p>
            </div>
          ) : (
            <div className="bg-stone-50/80 rounded-lg p-12 border border-stone-200/90">
              <div className="mx-auto relative h-20 w-20 mb-6 opacity-90">
                <Image src="/logo.svg" alt="Gastro-Elite" fill className="object-contain" />
              </div>
              <div className="text-stone-900 text-2xl font-semibold tracking-tight mb-3">{t.noRecipesYet}</div>
              <p className="text-stone-600 mb-8 text-base max-w-md mx-auto leading-relaxed">{t.startAddingFirstRecipe}</p>
              <a 
                href="/add"
                className="inline-block px-8 py-3.5 bg-stone-900 text-white rounded-md font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:bg-stone-800"
              >
                {t.addFirstRecipe}
              </a>
            </div>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} variant="grid" />
          ))}
        </div>
      ) : viewMode === "row" ? (
        // Row View — lijst met covers
        <div className="bg-white border border-stone-200/90 rounded-lg overflow-hidden shadow-sm">
          {filteredRecipes.map((recipe, index) => (
            <div key={recipe.id}>
              <RecipeCard recipe={recipe} variant="row" />
              {index < filteredRecipes.length - 1 && <div className="border-b border-stone-200/80" />}
            </div>
          ))}
        </div>
      ) : (
        // Alfabetisch — standaard (fallback als viewMode niet expliciet grid/row is)
        // A–Z: alleen letters met recepten; op mobiel één doorlopende gestapelde lijst (geen A–Z met lege letters)
        <div className="flex gap-3 sm:gap-6 relative lg:pb-0 pb-28 max-sm:pb-32">
          {/* Main content — mobiel: geen vaste max-height, volledige pagina-scroll */}
          <div className="flex-1 bg-white border border-stone-200/90 rounded-lg overflow-hidden shadow-sm lg:max-h-[calc(100vh-400px)]">
            <div className="lg:overflow-y-auto lg:max-h-[calc(100vh-400px)]">
              {sortedLetters.length === 0 ? (
                <div className="p-8 text-center text-stone-500">{t.noRecipesFound}</div>
              ) : (
                sortedLetters.map((letter) => (
                  <div key={letter} id={`letter-${letter}`} className="scroll-mt-20 lg:scroll-mt-4">
                    <div className="sticky top-0 lg:top-0 bg-stone-900 text-white px-4 sm:px-6 py-3 font-semibold text-base sm:text-lg z-10 tracking-tight border-b border-stone-700">
                      {letter === "#" ? t.otherRecipesLetter : letter}
                    </div>
                    {groupedByLetter[letter]
                      .sort((a, b) =>
                        (a.name ?? "").localeCompare(b.name ?? "", undefined, {
                          sensitivity: "base",
                        })
                      )
                      .map((recipe, idx) => (
                        <div key={recipe.id}>
                          <RecipeCard recipe={recipe} variant="alphabetical" />
                          {idx < groupedByLetter[letter].length - 1 && <div className="border-b border-stone-100" />}
                        </div>
                      ))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop: alleen letters die daadwerkelijk voorkomen */}
          <div className="hidden lg:block">
            <div className="sticky top-4 bg-white border border-stone-200/90 rounded-lg p-3 shadow-sm">
              <div className="flex flex-col gap-1.5 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
                {sortedLetters.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => scrollToLetter(letter)}
                    className={`w-11 h-11 rounded-lg text-sm font-bold transition-all ${
                      selectedLetter === letter
                        ? "bg-stone-900 text-white shadow-md scale-105"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200 hover:scale-105"
                    }`}
                  >
                    {letter === "#" ? "…" : letter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobiel: snelkiezer alleen voor letters met recepten */}
          {sortedLetters.length > 0 && (
            <div
              className="lg:hidden fixed left-1/2 -translate-x-1/2 bg-white border border-stone-200 rounded-xl p-2.5 shadow-2xl z-[1005] max-w-[95vw]"
              style={{
                bottom: "calc(5.35rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <div
                className="flex gap-1.5 overflow-x-auto pb-0.5 px-0.5"
                style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}
              >
                {sortedLetters.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => scrollToLetter(letter)}
                    className={`min-w-[2.25rem] h-9 px-2 rounded-lg text-xs font-bold transition-all flex-shrink-0 flex items-center justify-center ${
                      selectedLetter === letter
                        ? "bg-stone-900 text-white scale-105"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-95"
                    }`}
                  >
                    {letter === "#" ? "…" : letter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
