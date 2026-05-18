import { list, put, BlobStoreNotFoundError, BlobStoreSuspendedError } from "@vercel/blob";
import { collectBlobTokenCandidates } from "@/lib/vercel-blob-token";

function errName(err: unknown): string | undefined {
  return err instanceof Error ? err.name : undefined;
}

function isBlobStoreNotFound(err: unknown): boolean {
  return (
    err instanceof BlobStoreNotFoundError ||
    (err instanceof Error && err.name === "BlobStoreNotFoundError")
  );
}

function isBlobStoreSuspended(err: unknown): boolean {
  return (
    err instanceof BlobStoreSuspendedError ||
    (err instanceof Error && err.name === "BlobStoreSuspendedError")
  );
}

export type BlobUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/** Upload image bytes to Vercel Blob (private). */
export async function uploadImageToBlob(
  pathnamePrefix: string,
  buffer: Buffer,
  contentType: string,
  extension: string
): Promise<BlobUploadResult> {
  const candidates = collectBlobTokenCandidates();
  if (candidates.length === 0) {
    return { ok: false, error: "Blob-opslag niet geconfigureerd (BLOB_READ_WRITE_TOKEN)." };
  }

  const filename = `${pathnamePrefix}/${Date.now()}.${extension}`;
  let lastRetryable: unknown;

  for (const { key, value } of candidates) {
    try {
      await list({ token: value, limit: 1 });
    } catch (listErr) {
      if (
        (isBlobStoreNotFound(listErr) || isBlobStoreSuspended(listErr)) &&
        candidates.length > 1
      ) {
        lastRetryable = listErr;
        continue;
      }
      return {
        ok: false,
        error: listErr instanceof Error ? listErr.message : "Blob test mislukt",
      };
    }

    try {
      const blob = await put(filename, buffer, {
        access: "private",
        addRandomSuffix: true,
        contentType,
        token: value,
      });
      void key;
      return { ok: true, url: blob.url };
    } catch (err) {
      if (
        (isBlobStoreNotFound(err) || isBlobStoreSuspended(err)) &&
        candidates.length > 1
      ) {
        lastRetryable = err;
        continue;
      }
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Upload mislukt",
      };
    }
  }

  return {
    ok: false,
    error:
      lastRetryable instanceof Error
        ? lastRetryable.message
        : "Blob-upload mislukt",
  };
}

/** Upload PDF/document bytes to Vercel Blob (private). */
export async function uploadPdfToBlob(
  pathnamePrefix: string,
  buffer: Buffer,
  filename: string
): Promise<BlobUploadResult> {
  const ext = filename.endsWith(".pdf") ? "pdf" : "pdf";
  return uploadImageToBlob(pathnamePrefix, buffer, "application/pdf", ext);
}

export function extensionFromMime(mime: string, filename?: string): string {
  const t = (mime || "").toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("gif")) return "gif";
  if (t.includes("heic")) return "heic";
  if (filename) {
    const m = filename.match(/\.([a-z0-9]+)$/i);
    if (m) return m[1].toLowerCase();
  }
  return "jpg";
}
