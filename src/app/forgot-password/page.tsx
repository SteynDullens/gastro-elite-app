"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Er is een fout opgetreden");
      }
    } catch (err) {
      setError("Er is een fout opgetreden. Probeer het later opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wachtwoord Vergeten</h1>
          <p className="text-gray-600">Vul uw e-mailadres in om uw wachtwoord te resetten</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✉️</div>
              <h2 className="text-xl font-semibold text-green-700 mb-3">E-mail Verzonden!</h2>
              <p className="text-gray-600 mb-6">
                Als er een account bestaat met dit e-mailadres, ontvangt u binnen enkele minuten een e-mail met instructies om uw wachtwoord te resetten.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Controleer ook uw spam/ongewenste mail map.
              </p>
              <Link 
                href="/account" 
                className="inline-block px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                Terug naar Inloggen
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🔑</div>
                <p className="text-gray-600 text-sm">
                  Voer uw e-mailadres in en wij sturen u een link om uw wachtwoord te resetten.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="uw@email.nl"
                    required
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Verzenden..." : "Reset Link Versturen"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link 
                  href="/account" 
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  ← Terug naar Inloggen
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

