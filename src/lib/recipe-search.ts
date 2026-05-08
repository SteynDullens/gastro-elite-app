/**
 * Client-side recipe search: naam, ingrediënten, instructies, categorieën.
 * Ondersteunt kleine typfouten via Levenshtein met lengte-afhankelijke drempel.
 */

/** Lowercase, trim, accenten naar ASCII-achtige vorm voor betere matches */
export function normalizeForSearch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[n];
}

/** Hoeveel substituties/inserts mogen er nog bij een token van deze lengte */
export function maxEditDistanceForToken(tokenLen: number): number {
  if (tokenLen <= 1) return 0;
  if (tokenLen <= 4) return 1;
  if (tokenLen <= 10) return 2;
  return Math.min(3, Math.floor(tokenLen * 0.28));
}

/** Woorden uit tekst (letters/cijfers, unicode) */
function extractWords(text: string): string[] {
  const normalized = normalizeForSearch(text);
  const parts = normalized.match(/[\p{L}\p{N}]+/gu);
  return parts ?? [];
}

export interface RecipeSearchShape {
  name?: string | null;
  ingredients?: Array<{ name?: string | null } | string | null> | null;
  instructions?: string | null;
  categories?: Array<string | { name?: string | null } | null> | null;
}

function ingredientNames(ingredients: RecipeSearchShape["ingredients"]): string[] {
  if (!Array.isArray(ingredients)) return [];
  const out: string[] = [];
  for (const ing of ingredients) {
    if (ing == null) continue;
    if (typeof ing === "string") {
      if (ing.trim()) out.push(ing);
      continue;
    }
    const n = ing?.name;
    if (typeof n === "string" && n.trim()) out.push(n);
  }
  return out;
}

function categoryNames(categories: RecipeSearchShape["categories"]): string[] {
  if (!Array.isArray(categories)) return [];
  return categories
    .map((c) => (typeof c === "string" ? c : c?.name ?? ""))
    .filter(Boolean) as string[];
}

function tokenMatchesHaystack(token: string, haystackNorm: string, words: string[]): boolean {
  if (!token) return true;

  // Alleen op volledige tekst bij langere tokens (voorkomt dat "ui" overal matcht)
  if (token.length >= 4 && haystackNorm.includes(token)) return true;

  if (token.length === 1) {
    return words.some((w) => w.includes(token));
  }

  const maxDist = maxEditDistanceForToken(token.length);

  for (const word of words) {
    if (!word) continue;
    if (word.includes(token)) return true;
    if (word.length < Math.max(1, token.length - maxDist - 1)) continue;
    if (Math.abs(word.length - token.length) > maxDist) continue;
    if (levenshtein(token, word) <= maxDist) return true;
  }

  for (const word of words) {
    if (word.length < token.length) continue;
    for (let i = 0; i <= word.length - token.length; i++) {
      const slice = word.slice(i, i + token.length);
      if (Math.abs(slice.length - token.length) > maxDist) continue;
      if (levenshtein(token, slice) <= maxDist) return true;
    }
  }

  return false;
}

/**
 * True als de zoekquery matcht op receptnaam, ingrediëntnamen, instructies of categorieën.
 * Meerdere woorden in de query: alle tokens moeten ergens matchen (AND).
 */
export function recipeMatchesSearchQuery(recipe: RecipeSearchShape, rawQuery: string): boolean {
  const q = rawQuery.trim();
  if (!q) return true;

  const name = recipe.name ?? "";
  const ingNames = ingredientNames(recipe.ingredients);
  const instr = recipe.instructions ?? "";
  const cats = categoryNames(recipe.categories);

  const haystackPieces = [name, ...ingNames, instr, ...cats].filter(Boolean);
  const haystackNorm = normalizeForSearch(haystackPieces.join(" \n "));
  const words = extractWords(haystackPieces.join(" "));

  const queryNorm = normalizeForSearch(q);
  if (haystackNorm.includes(queryNorm)) return true;

  const tokens = queryNorm.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  return tokens.every((token) => tokenMatchesHaystack(token, haystackNorm, words));
}
