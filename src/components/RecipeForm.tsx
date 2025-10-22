"use client";

import { useEffect, useState, useRef } from "react";
import { useRecipes } from "@/context/RecipeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

interface Ingredient {
  id: string;
  quantity: number;
  unit: string;
  name: string;
}

interface RecipeFormData {
  name: string;
  image: string; // stored URL after upload
  batchAmount: number;
  batchUnit: "stuks" | "personen" | "portie";
  ingredients: Ingredient[];
  steps: string[]; // step-based preparation
  categories: string[];
  saveTo: "personal" | "business" | "both"; // New field for recipe destination
}

const UNITS = ["stuks", "gram", "kg", "l", "ml"];

// Auto-replacement function for temperature and other common terms
const autoReplaceText = (text: string): string => {
  return text
    .replace(/\bgraden\b/gi, '°C')
    .replace(/\bgraad\b/gi, '°C')
    .replace(/\bgraden celsius\b/gi, '°C')
    .replace(/\bcelsius\b/gi, '°C');
};

export default function RecipeForm() {
  const { addRecipe } = useRecipes();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [formData, setFormData] = useState<RecipeFormData>({
    name: "",
    image: "",
    batchAmount: 1,
    batchUnit: "stuks",
    ingredients: [],
    steps: [""],
    categories: [],
    saveTo: "personal", // Default to personal
  });

  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [newIngredient, setNewIngredient] = useState({
    quantity: "",
    unit: "gram",
    name: "",
  });

  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<{ quantity: string; unit: string; name: string } | null>(null);

  // Categories state
  const DEFAULT_CATEGORIES = [
    'Voorgerecht',
    'Tussengerecht',
    'Hoofdgerecht',
    'Dessert',
    'Groentegarnituur',
    'Vlees',
    'Vis',
    'Vegetarisch',
    'Zetmeelgarnituur',
  ];
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/recipes/categories', { cache: 'no-store' });
        const data = await res.json();
        if (!isMounted) return;
        const names = res.ok && Array.isArray(data?.categories)
          ? (data.categories as { name: string }[]).map((c) => c.name)
          : [];
        setAllCategories(names.length ? names : DEFAULT_CATEGORIES);
      } catch {
        if (!isMounted) return;
        setAllCategories(DEFAULT_CATEGORIES);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const toggleCategory = (name: string) => {
    const exists = formData.categories.includes(name);
    setFormData({
      ...formData,
      categories: exists
        ? formData.categories.filter(c => c !== name)
        : [...formData.categories, name],
    });
  };

  const addNewCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (isAddingCategory) return;
    setIsAddingCategory(true);
    if (allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      // Select it if it already exists
      toggleCategory(trimmed);
      setNewCategoryName("");
      setIsAddingCategory(false);
      return;
    }
    // Optimistic add for instant UX
    setAllCategories(prev => [...prev, trimmed].sort((a, b) => a.localeCompare(b)));
    setFormData({ ...formData, categories: Array.from(new Set([...formData.categories, trimmed])) });
    setNewCategoryName("");
    try {
      const res = await fetch('/api/recipes/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      const data = await res.json();
      if (!res.ok) return;
      // Handle duplicate path from API
      const createdName = (data.category?.name || trimmed) as string;
      if (!allCategories.some(c => c.toLowerCase() === createdName.toLowerCase())) {
        setAllCategories(prev => Array.from(new Set([...prev, createdName])).sort((a, b) => a.localeCompare(b)));
      }
      // Select category
      setFormData(prev => ({ ...prev, categories: Array.from(new Set([...prev.categories, createdName])) }));
    } catch {}
    finally {
      setIsAddingCategory(false);
    }
  };

  const addIngredient = () => {
    if (!newIngredient.name.trim()) {
      alert("Voer een ingrediënt naam in");
      return;
    }
    if (!newIngredient.quantity || newIngredient.quantity.trim() === "" || parseFloat(newIngredient.quantity) <= 0) {
      alert("Voer een geldige hoeveelheid in");
      return;
    }
    
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        {
          id: `ingredient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...newIngredient,
          quantity: parseFloat(newIngredient.quantity),
        },
      ],
    });
    setNewIngredient({ quantity: "", unit: "gram", name: "" });
  };

  const removeIngredient = (id: string) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((ing) => ing.id !== id),
    });
  };

  const beginEditIngredient = (id: string) => {
    const ing = formData.ingredients.find(i => i.id === id);
    if (!ing) return;
    setEditingIngredientId(id);
    setEditingDraft({ quantity: ing.quantity.toString(), unit: ing.unit, name: ing.name });
    // focus will be handled by autoFocus on the last input
  };

  const commitEditIngredient = (id: string) => {
    if (!editingDraft) {
      setEditingIngredientId(null);
      return;
    }
    
    // Validate quantity
    if (!editingDraft.quantity || editingDraft.quantity.trim() === "" || parseFloat(editingDraft.quantity) <= 0) {
      alert("Voer een geldige hoeveelheid in");
      return;
    }
    
    setFormData({
      ...formData,
      ingredients: formData.ingredients.map((ing) =>
        ing.id === id ? { ...ing, ...editingDraft, quantity: parseFloat(editingDraft.quantity) } : ing
      ),
    });
    setEditingIngredientId(null);
    setEditingDraft(null);
  };

  const onEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEditIngredient(id);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/recipes/upload-image", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData({ ...formData, image: data.url });
      } else {
        alert(data.error || "Upload mislukt");
      }
    } catch (err) {
      alert("Upload mislukt");
    } finally {
      setIsUploading(false);
    }
  };

  const updateStep = (index: number, value: string) => {
    const next = [...formData.steps];
    next[index] = value;
    setFormData({ ...formData, steps: next });
  };

  const addStep = () => {
    const next = [...formData.steps, ""];
    setFormData({ ...formData, steps: next });
    const newIndex = next.length - 1;
    setEditingStepIndex(newIndex);
    setEditingStepDraft("");
  };

  const removeStep = (index: number) => {
    let next = formData.steps.filter((_, i) => i !== index);
    if (next.length === 0) next = [""];
    // Ensure at least one empty step remains editable
    if (!next.some((s) => !s || !s.trim())) {
      next = [...next, ""];
    }
    setFormData({ ...formData, steps: next });
  };

  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(0);
  const [editingStepDraft, setEditingStepDraft] = useState<string>("");
  const stepTextareasRef = useRef<Record<number, HTMLTextAreaElement | null>>({});

  const beginEditStep = (index: number) => {
    setEditingStepIndex(index);
    setEditingStepDraft(formData.steps[index] ?? "");
  };

  const commitEditStep = (index: number) => {
    const next = [...formData.steps];
    next[index] = editingStepDraft;
    // Ensure there is always an empty editable step available
    const hasEmpty = next.some((s) => !s || !s.trim());
    const updated = hasEmpty ? next : [...next, ""];
    setFormData({ ...formData, steps: updated });
    setEditingStepIndex(null);
    setEditingStepDraft("");
  };

  const onStepKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitEditStep(index);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setEditingStepIndex(null);
      setEditingStepDraft("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting recipe form with data:', formData);
    
    // Persist to backend
    try {
      const requestData = {
        name: formData.name,
        image: formData.image || undefined,
        batchAmount: formData.batchAmount,
        batchUnit: formData.batchUnit,
        ingredients: formData.ingredients,
        steps: formData.steps,
        categories: formData.categories,
        saveTo: formData.saveTo,
      };
      
      console.log('Sending request data:', requestData);
      
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('Recipe creation failed:', err);
        alert(err.error || 'Opslaan mislukt');
        return;
      }
      
      const { recipe } = await response.json();
      console.log('Recipe created successfully:', recipe);

      // Update local list for immediate feedback
      addRecipe({
        name: recipe.name,
        image: recipe.image,
        batchSize: recipe.batchSize,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        categories: recipe.categories?.map((c: any) => c.name) || [],
    });
    
    // Reset form
    setFormData({
      name: "",
      image: "",
        batchAmount: 1,
        batchUnit: "stuks",
      ingredients: [],
        steps: [""],
      categories: [],
      saveTo: "personal",
    });
      setImagePreview("");
    router.push("/recipes");
    } catch (err) {
      alert('Opslaan mislukt');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            {t.recipeNameRequired}
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: autoReplaceText(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Receptfoto</label>
          <div className="flex items-center gap-3">
          <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>
          {(imagePreview || formData.image) && (
            <div className="mt-3">
              <div className="w-full aspect-video bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview || formData.image} alt="Preview" className="h-full object-cover" />
              </div>
              {isUploading && <p className="text-sm text-gray-500 mt-1">Bezig met uploaden...</p>}
            </div>
          )}
        </div>
      </div>

        <div>
        <label className="block text-sm font-medium mb-2">Batch grootte</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={formData.batchAmount}
            onChange={(e) => setFormData({ ...formData, batchAmount: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
          />
          <select
            value={formData.batchUnit}
            onChange={(e) => setFormData({ ...formData, batchUnit: e.target.value as RecipeFormData["batchUnit"] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="stuks">stuks</option>
            <option value="personen">personen</option>
            <option value="portie">portie</option>
          </select>
        </div>
        </div>

      {/* Categories multi-select */}
        <div>
        <label className="block text-sm font-medium mb-2">Categorieën</label>
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {formData.categories.length > 0 ? (
                <span className="flex flex-wrap gap-1">
                  {formData.categories.map((c) => (
                    <span key={c} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">{c}</span>
                  ))}
                </span>
              ) : (
                <span className="text-gray-500">Selecteer categorieën</span>
              )}
            </button>
            {categoryOpen && (
              <button
                type="button"
                onClick={() => setCategoryOpen(false)}
                className="px-3 py-2 text-white rounded-md whitespace-nowrap"
                style={{ backgroundColor: '#FF8C00' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
              >
                Gereed
              </button>
            )}
          </div>
          {categoryOpen && (
            <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-md shadow p-2 max-h-64 overflow-auto">
              <div className="space-y-1">
                {allCategories.map((c) => {
                  const selected = formData.categories.includes(c);
                  return (
                    <div key={c} className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCategory(c)}
                        className="accent-orange-500"
                      />
                      <span className="text-sm flex-1 select-none">{c}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const newName = prompt('Nieuwe categorienaam', c);
                          if (!newName || newName.trim() === c) return;
                          try {
                            const res = await fetch('/api/recipes/categories', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ oldName: c, newName: newName.trim() })
                            });
                            const data = await res.json();
                            if (!res.ok) { alert(data.error || 'Wijzigen mislukt'); return; }
                            // Update lists
                            setAllCategories(prev => prev.map(n => n === c ? data.category.name : n).sort((a, b) => a.localeCompare(b)));
                            setFormData(prev => ({ ...prev, categories: prev.categories.map(n => n === c ? data.category.name : n) }));
                          } catch {}
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 p-1"
                        title="Bewerken"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M21.731 2.269a2.625 2.625 0 00-3.714 0l-1.157 1.157 3.714 3.714 1.157-1.157a2.625 2.625 0 000-3.714zM19.513 8.199l-3.714-3.714L3.879 16.405a4.5 4.5 0 00-1.112 1.846l-.799 2.796a.75.75 0 00.927.927l2.796-.799a4.5 4.5 0 001.846-1.112L19.513 8.199z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`Categorie '${c}' verwijderen?`)) return;
                          try {
                            const res = await fetch('/api/recipes/categories', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: c })
                            });
                            if (!res.ok) { const d = await res.json().catch(()=>({})); alert(d.error || 'Verwijderen mislukt'); return; }
                            setAllCategories(prev => prev.filter(n => n !== c));
                            setFormData(prev => ({ ...prev, categories: prev.categories.filter(n => n !== c) }));
                          } catch {}
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 p-1"
                        title="Verwijderen"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="border-t my-2"></div>
              <div className="flex items-center gap-2">
          <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNewCategory(); } if (e.key === 'Escape') setCategoryOpen(false); }}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nieuwe categorie..."
                />
                <button
                  type="button"
                  onClick={addNewCategory}
                  className="px-3 py-1 text-white rounded text-sm"
                  style={{ backgroundColor: '#FF8C00' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
                >
                  Toevoegen
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setCategoryOpen(false)}
                  className="px-3 py-1 text-white rounded text-sm"
                  style={{ backgroundColor: '#FF8C00' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
                >
                  Gereed
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Destination Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Opslaan in</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="saveTo"
              value="personal"
              checked={formData.saveTo === "personal"}
              onChange={(e) => setFormData({ ...formData, saveTo: e.target.value as "personal" | "business" | "both" })}
              className="mr-2"
            />
            <span className="text-sm">Persoonlijke database</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="saveTo"
              value="business"
              checked={formData.saveTo === "business"}
              onChange={(e) => setFormData({ ...formData, saveTo: e.target.value as "personal" | "business" | "both" })}
              className="mr-2"
            />
            <span className="text-sm">Bedrijfsdatabase</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="saveTo"
              value="both"
              checked={formData.saveTo === "both"}
              onChange={(e) => setFormData({ ...formData, saveTo: e.target.value as "personal" | "business" | "both" })}
              className="mr-2"
            />
            <span className="text-sm">Beide databases</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Kies waar je recept opgeslagen moet worden
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t.ingredients}</label>
        <div className="space-y-3">
          {formData.ingredients.map((ingredient) => (
            <div key={ingredient.id} className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-md w-full">
              {editingIngredientId === ingredient.id ? (
                <>
                  <input
                    type="number"
                    placeholder="e.g. 250"
                    value={editingDraft?.quantity ?? ""}
                    onChange={(e) => setEditingDraft(prev => ({ ...(prev as any), quantity: e.target.value }))}
                    onKeyDown={(e) => onEditKeyDown(e, ingredient.id)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.1"
                  />
                  <select
                    value={editingDraft?.unit ?? "gram"}
                    onChange={(e) => setEditingDraft(prev => ({ ...(prev as any), unit: e.target.value }))}
                    onKeyDown={(e) => onEditKeyDown(e, ingredient.id)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editingDraft?.name ?? ""}
                    onChange={(e) => setEditingDraft(prev => ({ ...(prev as any), name: autoReplaceText(e.target.value) }))}
                    onBlur={() => commitEditIngredient(ingredient.id)}
                    onKeyDown={(e) => onEditKeyDown(e, ingredient.id)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.ingredientName}
                    autoFocus
                  />
                </>
              ) : (
                <>
              <span className="font-medium">{ingredient.quantity}</span>
              <span className="text-sm text-gray-600">{ingredient.unit}</span>
              <span className="flex-1">{ingredient.name}</span>
                  <button
                    type="button"
                    onClick={() => beginEditIngredient(ingredient.id)}
                    className="text-red-600 hover:text-red-800 inline-flex items-center justify-center align-middle"
                    aria-label="Edit ingredient"
                    title="Bewerken"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M21.731 2.269a2.625 2.625 0 00-3.714 0l-1.157 1.157 3.714 3.714 1.157-1.157a2.625 2.625 0 000-3.714zM19.513 8.199l-3.714-3.714L3.879 16.405a4.5 4.5 0 00-1.112 1.846l-.799 2.796a.75.75 0 00.927.927l2.796-.799a4.5 4.5 0 001.846-1.112L19.513 8.199z" />
                    </svg>
                  </button>
              <button
                type="button"
                onClick={() => removeIngredient(ingredient.id)}
                className="text-red-600 hover:text-red-800"
                    aria-label="Remove ingredient"
                    title="Verwijderen"
              >
                ✕
              </button>
                </>
              )}
            </div>
          ))}
          
          <div className="flex flex-wrap gap-2">
            <input
              type="number"
              placeholder="e.g. 250"
              value={newIngredient.quantity}
              onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              min="0"
              step="0.1"
            />
            <select
              value={newIngredient.unit}
              onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t.ingredientName}
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({ ...newIngredient, name: autoReplaceText(e.target.value) })}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <button
              type="button"
              onClick={addIngredient}
              className="px-3 py-1 text-white rounded text-sm focus:outline-none focus:ring-2"
              style={{ backgroundColor: '#FF8C00' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
            >
              {t.addIngredient}
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Bereidingswijze</label>
        <div className="space-y-3">
          {formData.steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-md w-full transition-all">
              <div className="text-gray-600 whitespace-nowrap w-20 shrink-0">Stap {idx + 1}.</div>
              {editingStepIndex === idx || !step || !step.trim() ? (
                <>
        <textarea
                    id={`step-${idx}`}
                    ref={(node) => { stepTextareasRef.current[idx] = node; }}
                    value={editingStepDraft}
                    onChange={(e) => { setEditingStepDraft(autoReplaceText(e.target.value)); }}
                    onBlur={() => commitEditStep(idx)}
                    onKeyDown={(e) => onStepKeyDown(e, idx)}
                    rows={1}
                    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-40 overflow-auto leading-normal"
                    placeholder={`Omschrijving stap ${idx + 1}`}
                    autoFocus
                  />
                </>
              ) : (
                <>
                  <span className="flex-1 min-w-0 whitespace-pre-wrap break-words leading-normal block">{step}</span>
                  <button
                    type="button"
                    onClick={() => beginEditStep(idx)}
                    className="text-red-600 hover:text-red-800 inline-flex items-center justify-center align-middle"
                    aria-label="Edit step"
                    title="Bewerken"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M21.731 2.269a2.625 2.625 0 00-3.714 0l-1.157 1.157 3.714 3.714 1.157-1.157a2.625 2.625 0 000-3.714zM19.513 8.199l-3.714-3.714L3.879 16.405a4.5 4.5 0 00-1.112 1.846l-.799 2.796a.75.75 0 00.927.927l2.796-.799a4.5 4.5 0 001.846-1.112L19.513 8.199z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="text-red-600 hover:text-red-800"
                    aria-label="Remove step"
                    title="Verwijderen"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addStep}
            className="px-3 py-1 text-white rounded text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: '#FF8C00' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
          >
            Stap toevoegen
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2"
          style={{ backgroundColor: '#FF8C00' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
        >
          {t.saveRecipe}
        </button>
        <button
          type="button"
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {t.cancelRecipe}
        </button>
      </div>
    </form>
  );
}
