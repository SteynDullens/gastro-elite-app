"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface LoginScreenProps {
  enableBackButton?: boolean;
}

export default function LoginScreen({ enableBackButton = true }: LoginScreenProps) {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [showBackArrow, setShowBackArrow] = useState(enableBackButton);
  const [mounted, setMounted] = useState(false);
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [showFormFields, setShowFormFields] = useState(false); // Hidden initially
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    // Trigger logo animation after mount
    const logoTimer = setTimeout(() => setLogoAnimated(true), 100);

    if (!enableBackButton) {
      setShowBackArrow(false);
      return () => clearTimeout(logoTimer);
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const hasHistory = window.history.length > 1;
      setShowBackArrow(hasHistory || scrollY > 100);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(logoTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enableBackButton]);

  useEffect(() => {
    if (showFormFields && emailInputRef.current) {
      // Small delay to let animation start
      setTimeout(() => emailInputRef.current?.focus(), 300);
    }
  }, [showFormFields]);

  const handleBackClick = () => {
    if (!enableBackButton) return;

    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleLoginClick = () => {
    setShowFormFields(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        router.push('/');
        return;
      }

      if (result.error === 'BUSINESS_PENDING_APPROVAL') {
        setError(t.businessPendingApproval);
      } else if (result.error === 'BUSINESS_REJECTED') {
        setError(t.businessRejected);
      } else {
        setError(result.error || t.loginFailed);
      }
    } catch (err) {
      setError(t.loginFailed);
    } finally {
      setLoading(false);
    }
  };
  
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
          <div className="text-gray-500">{t.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Back Button - Fixed position */}
      {enableBackButton && showBackArrow && (
            <button
              onClick={handleBackClick}
          className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-50 border border-gray-300 rounded-full p-2 shadow-md transition-all duration-300"
              title="Terug"
            >
              <svg
            className="w-5 h-5 text-gray-600"
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

      {/* Logo Section - With slow entrance animation (1.5s) - 1.5x bigger */}
      <div className="flex-shrink-0 pt-8 pb-4 md:pt-10 md:pb-6">
        <div className="flex justify-center">
              <Image
                src="/logo.svg"
                alt="Gastro-Elite Logo"
            width={420}
            height={420}
                priority
            className={`w-72 h-72 md:w-96 md:h-96 object-contain transition-all ease-out ${
              logoAnimated ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-90 blur-md'
            }`}
            style={{ 
              minWidth: '270px', 
              minHeight: '270px',
              transitionDuration: '1500ms'
            }}
              />
            </div>
        {/* Tagline */}
        <p className="text-center text-gray-600 text-sm md:text-base mt-2 px-6 max-w-sm mx-auto">
          {t.tagline}
        </p>
      </div>

      {/* Login Card - Centered (no animation) */}
      <div className="flex-1 flex items-start md:items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            {/* Show only button initially */}
            {!showFormFields ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-center text-gray-800">
                  {t.welcomeTitle}
                </h2>
                
                {/* Large Login Button */}
                <button
                  onClick={handleLoginClick}
                  className="w-full py-4 px-6 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200"
                  style={{ backgroundColor: '#ff6b35' }}
                >
                  {t.login}
                </button>

                {/* Register Link */}
                <div className="pt-4 border-t border-gray-100 text-center">
                  <p className="text-gray-600 text-sm">
                    {t.noAccount}{" "}
                    <Link
                      href="/register"
                      className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      {t.register}
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              /* Form Fields - Animated appearance */
              <div className="animate-fadeSlideIn">
                <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
                  {t.welcomeTitle}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div className="animate-fadeSlideIn" style={{ animationDelay: '100ms' }}>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        {t.emailAddress}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      ref={emailInputRef}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-base"
                        placeholder="uw@email.nl"
                        required
                        autoComplete="email"
                    />
                  </div>

                    <div className="animate-fadeSlideIn" style={{ animationDelay: '200ms' }}>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        {t.password}
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-base"
                        placeholder={t.yourPassword}
                        required
                        autoComplete="current-password"
                    />
                  </div>

                  {error && (
                      <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center py-3 px-4 rounded-xl animate-fadeSlideIn">
                      {error}
                    </div>
                  )}
              </div>

                  {/* Login Button */}
                  <div className="animate-fadeSlideIn" style={{ animationDelay: '300ms' }}>
                <button
                  type="submit"
                  disabled={loading}
                      className="w-full py-3.5 px-6 text-white rounded-xl font-semibold text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-[0.98]"
                  style={{ backgroundColor: '#ff6b35' }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          {t.processing}
                        </span>
                      ) : t.login}
                </button>
              </div>
            </form>

                {/* Register Link */}
                <div className="mt-6 pt-6 border-t border-gray-100 text-center animate-fadeSlideIn" style={{ animationDelay: '400ms' }}>
              <p className="text-gray-600 text-sm">
                    {t.noAccount}{" "}
                <Link
                  href="/register"
                      className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                >
                      {t.register}
                </Link>
              </p>
            </div>
          </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs mt-6">
            © 2024 Gastro-Elite. {t.allRightsReserved}
          </p>
        </div>
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
