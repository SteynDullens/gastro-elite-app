import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

function isAllowedBlobHost(hostname: string): boolean {
  return (
    hostname === "public.blob.vercel-storage.com" ||
    hostname.endsWith(".public.blob.vercel-storage.com") ||
    hostname.endsWith(".private.blob.vercel-storage.com")
  );
}

export async function GET(request: NextRequest) {
  const jwt = request.cookies.get("auth-token")?.value;
  if (!jwt || !verifyToken(jwt)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const raw = request.nextUrl.searchParams.get("url");
  if (!raw?.trim()) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  let blobUrl: URL;
  try {
    blobUrl = new URL(raw);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (blobUrl.protocol !== "https:" || !isAllowedBlobHost(blobUrl.hostname)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const access = blobUrl.hostname.includes(".private.blob.")
    ? "private"
    : "public";

  try {
    const result = await get(raw, { access });

    if (!result) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (result.statusCode === 304 || !result.stream) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.blob.contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("[serve-image]", e);
    return new NextResponse("Blob ophalen mislukt", { status: 502 });
  }
}
