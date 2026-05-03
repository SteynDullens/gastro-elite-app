import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { buildAdminBackupPayload, type AdminBackupType } from "@/lib/admin-backup-builder";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !decodedToken.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "all") as AdminBackupType;
    if (!["all", "recipes", "users", "companies"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    console.log(`📦 Creating backup: ${type}`);

    const backup = await buildAdminBackupPayload(prisma, type);

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${type}-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Backup failed:", error);
    return NextResponse.json(
      { error: "Failed to create backup", message },
      { status: 500 }
    );
  }
}
