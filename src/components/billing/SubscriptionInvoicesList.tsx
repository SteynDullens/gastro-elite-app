"use client";

import { useEffect, useState } from "react";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  amountInclVat: string;
  periodLabel: string;
  issuedAt: string;
  downloadUrl: string;
};

export default function SubscriptionInvoicesList() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/billing/invoices", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.invoices) {
          setInvoices(data.invoices);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null;
  if (invoices.length === 0) return null;

  return (
    <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Uw facturen</h2>
      <p className="text-sm text-gray-600 mb-4">
        Bij elke maandelijkse betaling ontvangt u automatisch een PDF-factuur per e-mail.
      </p>
      <ul className="divide-y divide-gray-100">
        {invoices.map((inv) => (
          <li
            key={inv.id}
            className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          >
            <div>
              <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
              <p className="text-sm text-gray-500">
                {inv.periodLabel} · €{inv.amountInclVat}
              </p>
            </div>
            <a
              href={inv.downloadUrl}
              className="inline-flex justify-center px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0"
              style={{ backgroundColor: "#ff6b35" }}
            >
              PDF downloaden
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
