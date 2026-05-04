/**
 * URL voor <Image> / <img>. Private Vercel Blob-URLs vereisen server-side auth;
 * die levert `/api/recipes/serve-image` (ingelogde sessie). Publieke blob- en
 * lokale paden blijven ongewijzigd.
 */
export function displayRecipeImageUrl(storedUrl: string): string {
  if (!storedUrl) return storedUrl;
  if (storedUrl.startsWith("blob:") || storedUrl.startsWith("/")) {
    return storedUrl;
  }
  try {
    const u = new URL(storedUrl);
    if (u.hostname.endsWith(".private.blob.vercel-storage.com")) {
      return `/api/recipes/serve-image?url=${encodeURIComponent(storedUrl)}`;
    }
  } catch {
    return storedUrl;
  }
  return storedUrl;
}
