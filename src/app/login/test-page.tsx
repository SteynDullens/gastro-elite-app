"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TestLoginPage() {
  const router = useRouter();
  const [showBackArrow, setShowBackArrow] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    console.log('Test page mounted');
  }, []);

  const handleBackClick = () => {
    console.log('Back clicked');
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Test Back Arrow */}
        <button
          onClick={handleBackClick}
          className="fixed top-4 left-4 z-50 bg-red-500 text-white p-3 rounded-full shadow-lg"
          title="Test Back Arrow"
        >
          ← Back
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Login Page</h1>
          <p className="text-gray-600">This is a test page to check if the back arrow works</p>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Form</h2>
          <p className="text-gray-600">This is a test form to see if the back arrow appears above it.</p>
        </div>
      </div>
    </div>
  );
}
