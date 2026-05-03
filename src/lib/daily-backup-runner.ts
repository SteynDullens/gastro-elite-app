import type { PrismaClient } from "@prisma/client";
import {
  buildAdminBackupPayload,
  formatBackupLabelNl,
  getAmsterdamDateKey,
} from "@/lib/admin-backup-builder";

export type DailyBackupResult =
  | { ok: true; dateKey: string; label: string; blobUrl: string; pathname: string; sizeBytes: number }
  | { ok: false; error: string };

export async function runDailyBackup(prisma: PrismaClient): Promise<DailyBackupResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      error: "BLOB_READ_WRITE_TOKEN ontbreekt: dagelijkse backup kan niet naar Vercel Blob worden geüpload.",
    };
  }

  const dateKey = getAmsterdamDateKey();
  const payload = await buildAdminBackupPayload(prisma, "all");
  const body = JSON.stringify(payload, null, 2);
  const buffer = Buffer.from(body, "utf8");
  const sizeBytes = buffer.length;

  const { put } = await import("@vercel/blob");
  const pathname = `daily-backups/backup-all-${dateKey}.json`;
  const blob = await put(pathname, buffer, {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/json",
  });

  const label = formatBackupLabelNl(dateKey);

  await prisma.dailyBackup.upsert({
    where: { dateKey },
    create: {
      dateKey,
      label,
      blobUrl: blob.url,
      pathname: blob.pathname,
      sizeBytes,
      backupType: "all",
    },
    update: {
      label,
      blobUrl: blob.url,
      pathname: blob.pathname,
      sizeBytes,
      backupType: "all",
    },
  });

  return {
    ok: true,
    dateKey,
    label,
    blobUrl: blob.url,
    pathname: blob.pathname,
    sizeBytes,
  };
}
