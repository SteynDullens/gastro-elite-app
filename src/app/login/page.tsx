"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import UnifiedLoginForm from "@/components/UnifiedLoginForm";

export default function LoginPage() {
  const router = useRouter();
  const [showBackArrow, setShowBackArrow] = useState(true); // Always show for testing
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle mount and scroll
  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show arrow if there's history OR if scrolled down
      const hasHistory = window.history.length > 1;
      console.log('Scroll check:', { scrollY, hasHistory, historyLength: window.history.length });
      setShowBackArrow(hasHistory || scrollY > 100);
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Check if mobile and show mobile content
  useEffect(() => {
    if (mounted) {
      const checkMobile = () => {
        const isMobileDevice = window.innerWidth < 768;
        setIsMobile(isMobileDevice);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [mounted]);

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
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Mobile startup content - show on mobile devices
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center p-6">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="/logo.svg" 
            alt="Gastro-Elite Logo" 
            className="w-32 h-32 mx-auto"
          />
        </div>

        {/* Slogan */}
        <div className="text-center mb-12">
          <h2 className="text-lg font-medium text-gray-700 leading-relaxed max-w-sm">
            De slimme cockpit voor recepturen, HACCP en planning
          </h2>
        </div>

        {/* Login Section */}
        <div className="w-full max-w-sm space-y-6">
          {/* Primary Login Button */}
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full py-4 px-6 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
            style={{ backgroundColor: '#ff6b35' }}
          >
            Inloggen
          </button>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Nog geen account?{" "}
              <a
                href="/register"
                className="text-orange-600 hover:text-orange-700 font-medium transition-colors underline"
              >
                Registreren
              </a>
            </p>
          </div>
        </div>

        {/* Bottom Navigation - Disabled State */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-around items-center">
            <div className="flex flex-col items-center space-y-1 opacity-40">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
              <span className="text-xs text-gray-400">Home</span>
            </div>
            <div className="flex flex-col items-center space-y-1 opacity-40">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
              <span className="text-xs text-gray-400">Recepten</span>
            </div>
            <div className="flex flex-col items-center space-y-1 opacity-40">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
              <span className="text-xs text-gray-400">Toevoegen</span>
            </div>
            <div className="flex flex-col items-center space-y-1 opacity-40">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
              <span className="text-xs text-gray-400">Account</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop content only
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
      <div className="w-full max-w-md">
        {/* Mobile Logo - Only visible on mobile */}
        <div className="text-center mb-6 sm:hidden">
          <Image 
            src="/logo.svg" 
            alt="Gastro-Elite Logo" 
            width={64}
            height={64}
            className="mx-auto mb-4"
            priority
          />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Inloggen</h1>
          <p className="text-gray-600 text-sm sm:text-base">Welkom terug bij Gastro-Elite</p>
        </div>
        
        <div className="bg-white border border-orange-300 rounded-xl shadow-lg max-w-md mx-auto relative">
          {/* Sticky Back Arrow - Above the form */}
          <button
            onClick={() => window.history.back()}
            className="absolute -top-4 -left-4 z-50 bg-white hover:bg-gray-50 border border-orange-300 rounded-full p-3 shadow-lg transition-all duration-300"
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
                  className="w-full max-w-sm mx-auto px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
                    className="w-full px-4 py-3 pr-12 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
