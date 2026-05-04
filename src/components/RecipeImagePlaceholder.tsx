"use client";

import Image from "next/image";

type RecipeImagePlaceholderProps = {
  /** Extra classes on the outer frame (e.g. h-full w-full) */
  className?: string;
  /** Smaller logo, no caption — for row list thumbnails */
  compact?: boolean;
};

/**
 * Branded placeholder when a recipe has no image (or load failed).
 * Uses the Gastro-Elite logo from /public/logo.svg.
 */
export default function RecipeImagePlaceholder({
  className = "",
  compact = false,
}: RecipeImagePlaceholderProps) {
  return (
    <div
      className={`flex h-full w-full min-h-0 flex-col items-center justify-center bg-gradient-to-br from-stone-200/90 via-stone-100 to-zinc-200/80 ${className}`}
    >
      <div
        className={
          compact
            ? "relative h-11 w-11 shrink-0 opacity-95"
            : "relative h-24 w-24 sm:h-28 sm:w-28 max-w-[40%] opacity-95"
        }
      >
        <Image
          src="/logo.svg"
          alt="Gastro-Elite"
          fill
          className="object-contain"
          priority={false}
        />
      </div>
      {!compact && (
        <span className="mt-2 text-[9px] uppercase tracking-[0.22em] text-stone-500 font-medium">
          Gastro-Elite
        </span>
      )}
    </div>
  );
}
