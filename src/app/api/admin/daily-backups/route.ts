import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** List stored daily backups; ?month=YYYY-MM optional filter */
export async function GET(request: NextRequest) {
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

    const month = request.nextUrl.searchParams.get("month"); // YYYY-MM

    const rows = await prisma.dailyBackup.findMany({
      where: month
        ? {
            dateKey: {
              startsWith: month,
            },
          }
        : undefined,
      orderBy: { dateKey: "desc" },
    });

    const totalBytes = rows.reduce((s, r) => s + r.sizeBytes, 0);

    return NextResponse.json({
      backups: rows.map((r) => ({
        id: r.id,
        dateKey: r.dateKey,
        label: r.label,
        blobUrl: r.blobUrl,
        sizeBytes: r.sizeBytes,
        backupType: r.backupType,
        createdAt: r.createdAt.toISOString(),
      })),
      totalBytes,
      count: rows.length,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
