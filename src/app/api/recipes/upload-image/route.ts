import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

function extensionFromFile(file: File): string {
  const mime = (file.type || "").toLowerCase();
  if (mime.includes("jpeg") || mime === "image/jpg") return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("svg")) return "svg";
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
  return "image/jpeg";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const extension = extensionFromFile(file);
    const isVercel = process.env.VERCEL === "1";

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const timestamp = Date.now();
      const filename = `recipe-images/recipe_${timestamp}.${extension}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const contentType = file.type?.trim() || contentTypeForExtension(extension);

      const blob = await put(filename, buffer, {
        access: "public",
        addRandomSuffix: true,
        contentType,
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
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
