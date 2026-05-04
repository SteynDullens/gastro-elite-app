import { NextRequest, NextResponse } from "next/server";
import {
  list,
  BlobStoreNotFoundError,
  BlobStoreSuspendedError,
} from "@vercel/blob";
import { verifyToken } from "@/lib/auth";
import { collectBlobTokenCandidates } from "@/lib/vercel-blob-token";

export const runtime = "nodejs";

/**
 * Alleen voor admins. Test of elke gedetecteerde Blob token (`vercel_blob_rw_…` in process.env)
 * bij een bestaande store hoort (lichtgewicht `list`, geen uploads).
 * Geen tokenwaarden in de response.
 */
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

    const candidates = collectBlobTokenCandidates();
    const rawPrimary = process.env.BLOB_READ_WRITE_TOKEN;

    const rows: {
      envKey: string;
      listOk: boolean;
      error?: string;
    }[] = [];

    for (const { key, value } of candidates) {
      try {
        await list({ token: value, limit: 1 });
        rows.push({ envKey: key, listOk: true });
      } catch (e) {
        const name =
          e instanceof Error ? e.constructor.name : "UnknownError";
        const msg = e instanceof Error ? e.message : String(e);
        if (e instanceof BlobStoreNotFoundError) {
          rows.push({ envKey: key, listOk: false, error: "BlobStoreNotFoundError" });
        } else if (e instanceof BlobStoreSuspendedError) {
          rows.push({ envKey: key, listOk: false, error: "BlobStoreSuspendedError" });
        } else {
          rows.push({ envKey: key, listOk: false, error: `${name}: ${msg}` });
        }
      }
    }

    const firstWorkingKey = rows.find((r) => r.listOk)?.envKey ?? null;

    return NextResponse.json({
      success: true,
      vercel: process.env.VERCEL === "1",
      primaryKeySet: Boolean(rawPrimary && String(rawPrimary).trim()),
      primaryKeyLength: rawPrimary ? String(rawPrimary).trim().length : 0,
      candidateCount: candidates.length,
      candidates: rows,
      firstWorkingKey,
      hint:
        firstWorkingKey && firstWorkingKey !== "BLOB_READ_WRITE_TOKEN"
          ? "Upload gebruikt een token uit een andere env-key. Zet in Vercel alleen BLOB_READ_WRITE_TOKEN op dezelfde waarde en verwijder dubbele/oude blob-variabelen."
          : !firstWorkingKey && candidates.length > 0
            ? "Geen enkele token reageert op list(): store ontbreekt, verkeerd team, of token ingetrokken. Genereer under Storage → Blob een nieuw Read/Write-token en redeploy."
            : undefined,
    });
  } catch (error) {
    console.error("blob-status error:", error);
    return NextResponse.json(
      { error: "Kon blob-status niet ophalen" },
      { status: 500 }
    );
  }
}
