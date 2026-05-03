import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { runDailyBackup } from "@/lib/daily-backup-runner";

export const dynamic = "force-dynamic";

/** Admin-only: run the same job as the daily cron (useful for testing). */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const result = await runDailyBackup(prisma);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      dateKey: result.dateKey,
      label: result.label,
      sizeBytes: result.sizeBytes,
      blobUrl: result.blobUrl,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
