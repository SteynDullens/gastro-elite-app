"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import UnifiedLoginForm from "@/components/UnifiedLoginForm";

export default function LoginPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showBackArrow, setShowBackArrow] = useState(false);
  
  // Redirect logged-in users to homepage
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Handle scroll to show/hide back arrow
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowBackArrow(scrollY > 100); // Show arrow after scrolling 100px down
    };

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
  
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t.login}</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="text-center">
            <div className="text-gray-500">{t.loading}</div>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t.login}</h1>
          <p className="text-gray-600 text-sm sm:text-base">Welkom terug bij Gastro-Elite</p>
        </div>
        
        <UnifiedLoginForm />
      </div>
    </div>
  );
}
