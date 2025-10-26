"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UnifiedLoginFormProps {
  redirectTo?: string;
  showRegisterLink?: boolean;
}

export default function UnifiedLoginForm({ 
  redirectTo = "/", 
  showRegisterLink = true 
}: UnifiedLoginFormProps) {
  const { t } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        router.push(redirectTo);
      } else {
        if (result.error === 'BUSINESS_PENDING_APPROVAL') {
          setError("Please wait a little longer — your business registration must be approved by Gastro-Elite. This may take up to 24 hours.");
        } else if (result.error === 'BUSINESS_REJECTED') {
          setError("Your business registration has been rejected. Please contact support for more information.");
        } else {
          setError(result.error || "Login failed. Please check your credentials.");
        }
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-md mx-auto">
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-2">Inloggen</h2>
          <p className="text-gray-600 text-sm">
            Log in om uw accountinformatie en instellingen te bekijken.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t.email}
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Voer uw e-mailadres in"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Wachtwoord
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Voer uw wachtwoord in"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#ff6b35' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
          >
            {loading ? "Inloggen..." : t.login}
          </button>
        </form>

        {showRegisterLink && (
          <div className="mt-6 text-center pt-4 border-t border-gray-100">
            <p className="text-gray-600 text-sm">
              Nog geen account?{" "}
              <Link 
                href="/register" 
                className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                Registreren
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
