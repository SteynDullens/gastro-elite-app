"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface LoginScreenProps {
  enableBackButton?: boolean;
}

export default function LoginScreen({ enableBackButton = true }: LoginScreenProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [showBackArrow, setShowBackArrow] = useState(enableBackButton);
  const [mounted, setMounted] = useState(false);
  const [showFormFields, setShowFormFields] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);

    if (!enableBackButton) {
      setShowBackArrow(false);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const hasHistory = window.history.length > 1;
      setShowBackArrow(hasHistory || scrollY > 100);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enableBackButton]);

  // Check if mobile and redirect
  useEffect(() => {
    if (mounted) {
      const checkMobile = () => {
        const isMobileDevice = window.innerWidth < 768;
        if (isMobileDevice) {
          // Use window.location for more reliable redirect to mobile page
          window.location.href = '/mobile-redirect';
        }
      };
      
      // Small delay to prevent hydration issues
      const timer = setTimeout(checkMobile, 100);
      window.addEventListener('resize', checkMobile);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkMobile);
      };
    }
  }, [mounted]);

  useEffect(() => {
    if (showFormFields && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [showFormFields]);

  // Handle back navigation
  const handleBackClick = () => {
    if (!enableBackButton) return;

    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!showFormFields) {
      setShowFormFields(true);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        router.push('/');
        return;
      }

      if (result.error === 'BUSINESS_PENDING_APPROVAL') {
        setError("Please wait a little longer — your business registration must be approved by Gastro-Elite. This may take up to 24 hours.");
      } else if (result.error === 'BUSINESS_REJECTED') {
        setError("Your business registration has been rejected. Please contact support for more information.");
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };
  
  // Show loading state while mounting
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
          <div className="text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
      <div className="w-full max-w-md">
        <div className="bg-white border border-orange-300 rounded-xl shadow-lg max-w-md mx-auto relative overflow-hidden">
          {enableBackButton && (
            <button
              onClick={handleBackClick}
              className={`absolute -top-4 -left-4 z-50 bg-white hover:bg-gray-50 border border-orange-300 rounded-full p-3 shadow-lg transition-all duration-300 ${showBackArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              title="Terug"
            >
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          <div className="p-6 sm:p-8 flex flex-col items-center justify-center gap-6">
            <div className="w-full flex justify-center mt-2 mb-8">
              <Image
                src="/logo.svg"
                alt="Gastro-Elite Logo"
                width={112}
                height={112}
                priority
              />
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6">
              <div
                className={`w-full overflow-hidden transition-all duration-300 ease-out ${
                  showFormFields
                    ? "max-h-[420px] opacity-100 translate-y-0"
                    : "max-h-0 opacity-0 -translate-y-4 pointer-events-none"
                }`}
              >
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      E-mail
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      ref={emailInputRef}
                      className="w-full max-w-sm mx-auto px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Voer uw e-mailadres in"
                      required={showFormFields}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Wachtwoord
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full max-w-sm mx-auto px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Voer uw wachtwoord in"
                      required={showFormFields}
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm text-center py-2">
                      {error}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full max-w-sm py-3 px-6 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#ff6b35' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e55a2b')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ff6b35')}
                >
                  {loading ? "Bezig..." : "Inloggen"}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center pt-4 border-t border-gray-100 w-full">
              <p className="text-gray-600 text-sm">
                Nog geen account?{" "}
                <Link
                  href="/register"
                  className="font-medium transition-colors"
                  style={{ color: '#FF6A00' }}
                >
                  Registreren
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

