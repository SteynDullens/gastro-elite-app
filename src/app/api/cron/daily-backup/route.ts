import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { runDailyBackup } from "@/lib/daily-backup-runner";

export const dynamic = "force-dynamic";

function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
  }
  if (request.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

/**
 * Vercel Cron: schedule in vercel.json (daily).
 * Set CRON_SECRET in Vercel env for stricter auth (Vercel sends Authorization: Bearer <CRON_SECRET>).
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const result = await runDailyBackup(prisma);
  if (!result.ok) {
    console.error("daily-backup cron:", result.error);
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  console.log("daily-backup cron OK:", result.dateKey, result.sizeBytes, "bytes");
  return NextResponse.json({
    ok: true,
    dateKey: result.dateKey,
    label: result.label,
    sizeBytes: result.sizeBytes,
  });
}
