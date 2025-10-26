"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UnifiedLoginForm from "@/components/UnifiedLoginForm";

export default function LoginPage() {
  const router = useRouter();
  const [showBackArrow, setShowBackArrow] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Handle mount and scroll
  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show arrow if there's history OR if scrolled down
      const hasHistory = window.history.length > 1;
      setShowBackArrow(hasHistory || scrollY > 100);
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle back navigation
  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };
  
  // Show loading state while mounting
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Inloggen</h1>
            <p className="text-gray-600 text-sm sm:text-base">Welkom terug bij Gastro-Elite</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl shadow-lg max-w-md mx-auto">
            <div className="p-4 sm:p-6">
              <div className="text-center">
                <div className="text-gray-500">Laden...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Sticky Back Arrow */}
        <button
          onClick={handleBackClick}
          className={`fixed top-4 left-4 z-50 bg-white hover:bg-gray-50 border border-gray-300 rounded-full p-3 shadow-lg transition-all duration-300 ${
            showBackArrow ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
          title="Terug"
        >
          <svg 
            className="w-5 h-5 text-gray-700" 
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
        
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Inloggen</h1>
          <p className="text-gray-600 text-sm sm:text-base">Welkom terug bij Gastro-Elite</p>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-xl shadow-lg max-w-md mx-auto">
          <div className="p-4 sm:p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold mb-2">Inloggen</h2>
              <p className="text-gray-600 text-sm">
                Log in om uw accountinformatie en instellingen te bekijken.
              </p>
            </div>

            <form className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full max-w-sm mx-auto px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Voer uw e-mailadres in"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Wachtwoord
                </label>
                <div className="relative max-w-sm mx-auto">
                  <input
                    type="password"
                    id="password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Voer uw wachtwoord in"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="w-full max-w-sm py-3 px-6 text-white rounded-xl font-medium transition-all duration-200"
                  style={{ backgroundColor: '#ff6b35' }}
                >
                  Inloggen
                </button>
              </div>
            </form>

            <div className="mt-6 text-center pt-4 border-t border-gray-100">
              <p className="text-gray-600 text-sm">
                Nog geen account?{" "}
                <a 
                  href="/register" 
                  className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  Registreren
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
