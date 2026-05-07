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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    setCoverFailed(false);
  }, [recipe.id, recipe.image]);

  const showImage = Boolean(recipe.image) && !coverFailed;

  const recipePdfImageUrl = recipe.image ? displayRecipeImageUrl(recipe.image) : null;

  const toDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Kon afbeelding niet uitlezen."));
      reader.readAsDataURL(blob);
    });

  const loadRecipeImageForPdf = async (): Promise<string | null> => {
    if (!recipePdfImageUrl) {
      return null;
    }

    try {
      const response = await fetch(recipePdfImageUrl);
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      return await toDataUrl(blob);
    } catch {
      return null;
    }
  };

  const handlePrintPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      let y = margin;

      const primary = { r: 41, g: 37, b: 36 }; // stone-800
      const accent = { r: 245, g: 158, b: 11 }; // amber-500

      // Header bar
      pdf.setFillColor(primary.r, primary.g, primary.b);
      pdf.rect(0, 0, pageWidth, 26, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Gastro-Elite", margin, 10);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Gegenereerd: ${new Date().toLocaleString("nl-NL")}`, margin, 16);

      y = 34;
      pdf.setTextColor(primary.r, primary.g, primary.b);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      const titleLines = pdf.splitTextToSize(recipe.name, pageWidth - margin * 2);
      pdf.text(titleLines, margin, y);
      y += titleLines.length * 8 + 3;

      // Hero image (or default placeholder)
      const imageHeight = 58;
      const imageWidth = pageWidth - margin * 2;
      const imageTop = y;
      const imageDataUrl = await loadRecipeImageForPdf();
      if (imageDataUrl) {
        pdf.addImage(imageDataUrl, "JPEG", margin, imageTop, imageWidth, imageHeight, "", "MEDIUM");
      } else {
        pdf.setFillColor(245, 245, 244); // stone-100
        pdf.roundedRect(margin, imageTop, imageWidth, imageHeight, 2, 2, "F");
        pdf.setDrawColor(214, 211, 209); // stone-300
        pdf.roundedRect(margin, imageTop, imageWidth, imageHeight, 2, 2, "S");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(87, 83, 78); // stone-600
        pdf.text("Geen receptfoto beschikbaar", pageWidth / 2, imageTop + imageHeight / 2, {
          align: "center",
        });
      }
      y += imageHeight + 8;

      // Recipe meta line
      pdf.setDrawColor(230, 230, 230);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const metaParts = [
        recipe.batchSize ? `${t.batchSizeLabel}: ${recipe.batchSize}` : "",
        recipe.servings ? `${t.servingsLabel}: ${recipe.servings}` : "",
        `${t.ingredientsLabel}: ${recipe.ingredients.length}`,
      ].filter(Boolean);
      pdf.text(metaParts.join("  |  "), margin, y);
      y += 7;

      if (recipe.categories.length > 0) {
        pdf.setTextColor(accent.r, accent.g, accent.b);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        const categoryLines = pdf.splitTextToSize(
          `Categorieen: ${recipe.categories.join(", ")}`,
          pageWidth - margin * 2
        );
        pdf.text(categoryLines, margin, y);
        y += categoryLines.length * 4 + 3;
      }

      pdf.setTextColor(primary.r, primary.g, primary.b);
      pdf.setDrawColor(230, 230, 230);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Ingredients block (single section card with aligned columns)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(t.ingredientsLabel, margin, y);
      y += 6;
      const ingredientRowHeight = 6;
      const ingredientHeaderHeight = 8;
      const ingredientBoxHeight = ingredientHeaderHeight + recipe.ingredients.length * ingredientRowHeight + 4;
      if (y + ingredientBoxHeight > pageHeight - 16) {
        pdf.addPage();
        y = margin;
      }
      const ingredientBoxTop = y - 2;
      const ingredientBoxWidth = pageWidth - margin * 2;
      pdf.setFillColor(250, 250, 249); // stone-50
      pdf.roundedRect(margin, ingredientBoxTop, ingredientBoxWidth, ingredientBoxHeight, 2, 2, "F");
      pdf.setDrawColor(214, 211, 209); // stone-300
      pdf.roundedRect(margin, ingredientBoxTop, ingredientBoxWidth, ingredientBoxHeight, 2, 2, "S");

      const qtyX = margin + 4;
      const unitX = margin + 20;
      const nameX = margin + 34;
      const ingredientNameMaxWidth = pageWidth - margin - 4 - nameX;

      pdf.setTextColor(87, 83, 78); // stone-600
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("Hoev.", qtyX, y + 3);
      pdf.text("Eenh.", unitX, y + 3);
      pdf.text("Ingredient", nameX, y + 3);
      pdf.setDrawColor(231, 229, 228); // stone-200
      pdf.line(margin + 2, y + 5, pageWidth - margin - 2, y + 5);

      y += ingredientHeaderHeight + 3;
      pdf.setTextColor(primary.r, primary.g, primary.b);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      recipe.ingredients.forEach((ingredient) => {
        pdf.text(String(ingredient.quantity), qtyX, y);
        pdf.text(ingredient.unit || "-", unitX, y);
        const ingredientName = pdf.splitTextToSize(
          ingredient.name,
          ingredientNameMaxWidth
        )[0] || ingredient.name;
        pdf.text(ingredientName, nameX, y);
        y += ingredientRowHeight;
      });
      y += 4;

      if (recipe.instructions) {
        y += 2;
        const instructionLines = pdf.splitTextToSize(
          recipe.instructions,
          pageWidth - margin * 2 - 8
        );
        const instructionHeaderHeight = 8;
        const instructionsBoxHeight =
          instructionHeaderHeight + instructionLines.length * 5 + 6;
        if (y + instructionsBoxHeight > pageHeight - 14) {
          pdf.addPage();
          y = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        pdf.text(t.instructionsLabel, margin, y);
        y += 6;
        const instructionsBoxTop = y - 2;
        const instructionsBoxWidth = pageWidth - margin * 2;
        pdf.setFillColor(250, 250, 249); // stone-50
        pdf.roundedRect(
          margin,
          instructionsBoxTop,
          instructionsBoxWidth,
          instructionsBoxHeight,
          2,
          2,
          "F"
        );
        pdf.setDrawColor(214, 211, 209); // stone-300
        pdf.roundedRect(
          margin,
          instructionsBoxTop,
          instructionsBoxWidth,
          instructionsBoxHeight,
          2,
          2,
          "S"
        );
        y += 4;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        instructionLines.forEach((line: string) => {
          pdf.text(line, margin + 4, y);
          y += 5;
        });
      }

      const safeRecipeName =
        recipe.name
          .trim()
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
          .replace(/\s+/g, " ") || "Recept";
      const fileName = `Gastro-Elite ${safeRecipeName}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("PDF kon niet worden gegenereerd.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white border border-stone-200/90 rounded-lg p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col-reverse lg:flex-row lg:items-start gap-4 lg:gap-6">
          <div className="flex-1 space-y-3 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">{recipe.name}</h1>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 text-sm text-stone-600">
              {recipe.batchSize && (
                <div className="px-2.5 py-1 bg-stone-50 border border-stone-200/80 rounded-md">
                  <span className="font-medium">{t.batchSizeLabel}:</span> {recipe.batchSize}
                </div>
              )}
              {recipe.servings && (
                <div className="px-2.5 py-1 bg-stone-50 border border-stone-200/80 rounded-md">
                  <span className="font-medium">{t.servingsLabel}:</span> {recipe.servings}
                </div>
              )}
              <div className="px-2.5 py-1 bg-stone-50 border border-stone-200/80 rounded-md">
                <span className="font-medium">{t.ingredientsLabel}:</span> {recipe.ingredients.length}
              </div>
            </div>
            {recipe.categories.length > 0 && (
              <div className="flex justify-center lg:justify-start flex-wrap gap-2">
                {recipe.categories.map((category) => (
                  <span
                    key={category}
                    className="px-3 py-1 bg-stone-50 text-stone-700 text-xs sm:text-sm rounded-md border border-stone-200/90"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="w-full lg:w-72 xl:w-80">
            <div className="relative aspect-[4/3] bg-stone-100 rounded-lg overflow-hidden border border-stone-200/90 shadow-sm">
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
                <RecipeImagePlaceholder className="absolute inset-0" />
              )}
            </div>
          </div>
        </div>
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
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
        <Link
          href={`/recipes/${recipe.id}/edit`}
          className="px-4 sm:px-6 py-2.5 text-white rounded-md hover:bg-stone-800 inline-block text-center font-medium bg-stone-900 transition-colors w-full sm:w-auto"
        >
          {t.editRecipe}
        </Link>
        <button 
          type="button"
          onClick={handlePrintPdf}
          disabled={isGeneratingPdf}
          className="px-4 sm:px-6 py-2.5 text-stone-800 rounded-md font-medium border border-stone-200 bg-white hover:bg-stone-50 transition-colors w-full sm:w-auto"
        >
          {isGeneratingPdf ? "PDF maken..." : t.printRecipe}
        </button>
        <button type="button" className="px-4 sm:px-6 py-2.5 bg-red-50 text-red-800 rounded-md border border-red-200 hover:bg-red-100 font-medium transition-colors w-full sm:w-auto">
          {t.deleteRecipe}
        </button>
      </div>
    </div>
  );
}
