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
        
        <UnifiedLoginForm />
      </div>
    </div>
  );
}
