"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type ConversionInfo = {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  kvkNumber: string;
  vatNumber: string;
  companyPhone: string;
  address: string;
};

export default function BusinessConversionPage() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [info, setInfo] = useState<ConversionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!token) {
        setError("Ongeldige link: token ontbreekt.");
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/auth/business-conversion?token=${encodeURIComponent(token)}`);
      const result = await response.json();
      if (ignore) return;
      if (!response.ok || !result.success) {
        setError(result.error || "Conversiegegevens konden niet geladen worden.");
      } else {
        setInfo(result.data);
      }
      setLoading(false);
    })();
    return () => {
      ignore = true;
    };
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!info) return;
    if (!file) {
      setError("Upload eerst het KvK-document.");
      return;
    }

    setSaving(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append("document", file);
      uploadForm.append("kvkNumber", info.kvkNumber);

      const uploadResponse = await fetch("/api/auth/upload-kvk-document", {
        method: "POST",
        body: uploadForm,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.error || "Upload mislukt");
      }

      const finishResponse = await fetch("/api/auth/business-conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          kvkDocumentPath: uploadResult.documentPath,
          kvkDocumentData: uploadResult.documentData || null,
        }),
      });
      const finishResult = await finishResponse.json();
      if (!finishResponse.ok || !finishResult.success) {
        throw new Error(finishResult.error || "Afronden van conversie mislukt");
      }

      setMessage(finishResult.message || "Conversie succesvol afgerond.");
      setFile(null);
    } catch (err: unknown) {
      const eMsg = err instanceof Error ? err.message : "Onbekende fout";
      setError(eMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="max-w-2xl mx-auto p-6">Conversiegegevens laden...</main>;
  }
  if (error && !info) {
    return <main className="max-w-2xl mx-auto p-6 text-red-600">{error}</main>;
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Bedrijfsomzetting voltooien</h1>
      {info && (
        <div className="mb-6 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-4">
          <p><strong>Naam:</strong> {info.firstName} {info.lastName}</p>
          <p><strong>E-mail:</strong> {info.email}</p>
          <p><strong>Bedrijf:</strong> {info.companyName}</p>
          <p><strong>KvK:</strong> {info.kvkNumber}</p>
          <p><strong>BTW:</strong> {info.vatNumber || "Niet opgegeven"}</p>
          <p><strong>Telefoon:</strong> {info.companyPhone || "Niet opgegeven"}</p>
          <p><strong>Adres:</strong> {info.address || "Niet opgegeven"}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">KvK-document (PDF/JPG/PNG, max 5MB)</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded bg-orange-500 text-white disabled:opacity-60"
        >
          {saving ? "Bezig..." : "Uploaden en aanvraag indienen"}
        </button>
      </form>
    </main>
  );
}
