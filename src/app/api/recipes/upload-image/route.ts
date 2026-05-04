import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import {
  put,
  BlobStoreNotFoundError,
  BlobStoreSuspendedError,
} from "@vercel/blob";

/** Vercel serverless request body is ~4.5MB max; stay under with margin. */
const MAX_BYTES = 4 * 1024 * 1024;

export const runtime = "nodejs";

/** Trim env value; strip wrapping quotes; remove accidental whitespace/newlines (common paste mistakes). */
function getBlobReadWriteToken(): string | undefined {
  const raw = process.env.BLOB_READ_WRITE_TOKEN;
  if (!raw || typeof raw !== "string") return undefined;
  let t = raw.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  t = t.replace(/\s+/g, "");
  return t.length > 0 ? t : undefined;
}

const STORE_NOT_FOUND_HELP =
  "Het Blob-token hoort bij een store die niet (meer) bestaat of bij een ander Vercel-team hoort. " +
  "Los het zo op: (1) Vercel → hetzelfde team als deze app → Storage → Blob. " +
  "(2) Maak een nieuwe Blob-store aan of open een bestaande store die aan dit project hangt. " +
  "(3) Onder de store: nieuw Read/Write-token genereren. " +
  "(4) Project → Settings → Environment Variables → BLOB_READ_WRITE_TOKEN voor Production plakken (alleen de token, geen aanhalingstekens). " +
  "(5) Redeploy. " +
  "Zie: https://vercel.com/docs/storage/vercel-blob";

function looksLikeImageFile(file: File): boolean {
  const t = (file.type || "").toLowerCase().trim();
  if (t.startsWith("image/")) return true;
  /** Sommige mobiele browsers sturen geen MIME-type mee */
  if (!t && file.name) {
    return /\.(jpe?g|png|gif|webp|heic|heif|bmp|svg)$/i.test(file.name);
  }
  return false;
}

function extensionFromFile(file: File): string {
  const mime = (file.type || "").toLowerCase();
  if (mime.includes("jpeg") || mime === "image/jpg") return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("svg")) return "svg";
  if (mime.includes("heic")) return "heic";
  if (mime.includes("heif")) return "heif";
  const n = file.name || "";
  const i = n.lastIndexOf(".");
  if (i >= 0) {
    const ext = n
      .slice(i + 1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (ext.length > 0 && ext.length <= 8) return ext;
  }
  return "jpg";
}

function contentTypeForExtension(ext: string): string {
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
}

function uploadErrorMessage(err: unknown): string {
  if (err instanceof BlobStoreNotFoundError) {
    return STORE_NOT_FOUND_HELP;
  }
  if (err instanceof BlobStoreSuspendedError) {
    return "Deze Blob-store is opgeschort in Vercel. Activeer de store opnieuw of maak een nieuwe store en token.";
  }
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes("token") || lower.includes("401") || lower.includes("unauthorized")) {
    return "Blob-token ongeldig of ontbreekt. Controleer BLOB_READ_WRITE_TOKEN in Vercel (Production).";
  }
  if (lower.includes("not found") || lower.includes("store")) {
    return STORE_NOT_FOUND_HELP;
  }
  if (lower.includes("too large")) {
    return "Bestand te groot voor opslag.";
  }
  return msg.length > 200 ? `${msg.slice(0, 200)}…` : msg;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!looksLikeImageFile(file)) {
      return NextResponse.json(
        { error: "Alleen afbeeldingsbestanden zijn toegestaan." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error: `Bestand te groot (max ${Math.floor(MAX_BYTES / (1024 * 1024))} MB op deze omgeving).`,
        },
        { status: 400 }
      );
    }

    const extension = extensionFromFile(file);
    const isVercel = process.env.VERCEL === "1";
    const blobToken = getBlobReadWriteToken();

    if (blobToken) {
      const timestamp = Date.now();
      const filename = `recipe-images/recipe_${timestamp}.${extension}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const contentType = file.type?.trim() || contentTypeForExtension(extension);

      const blob = await put(filename, buffer, {
        access: "public",
        addRandomSuffix: true,
        contentType,
        token: blobToken,
      });
      return NextResponse.json({ success: true, url: blob.url });
    }

    /** Vercel serverless FS is read-only — local uploads cannot work without Blob. */
    if (isVercel) {
      return NextResponse.json(
        {
          error:
            "Afbeelding upload niet beschikbaar: stel BLOB_READ_WRITE_TOKEN in (Vercel → Storage → Blob) en redeploy.",
        },
        { status: 503 }
      );
    }

    const uploadsDir = join(process.cwd(), "public", "uploads", "recipes");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `recipe_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const url = `/uploads/recipes/${filename}`;
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Recipe image upload error:", error);
    const detail = uploadErrorMessage(error);
    const status =
      error instanceof BlobStoreNotFoundError ||
      error instanceof BlobStoreSuspendedError
        ? 503
        : 500;
    return NextResponse.json({ error: `Upload mislukt: ${detail}` }, { status });
  }
}
