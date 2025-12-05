"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import Bubble, { BackBubble } from "@/components/Bubble";

function VerifyEmailContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [businessStatus, setBusinessStatus] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Verificatie token ontbreekt');
      setLoading(false);
      return;
    }

    // Verify email
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(true);
          setUser(data.user);
          setIsBusinessAccount(data.isBusinessAccount || false);
          setBusinessStatus(data.businessStatus || null);
        } else {
          setError(data.error || 'Verificatie mislukt');
        }
      } catch (error) {
        setError('Er is een fout opgetreden bij de verificatie');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleHome = () => {
    router.push('/');
  };

  return (
    <div className="bubble-grid max-w-2xl mx-auto">
      <BackBubble showCondition={true} />
      
      <div className="bubble col-span-full text-center">
        <h1 className="text-3xl font-bold mb-6">Email Verificatie</h1>
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Verificeren...</span>
          </div>
        )}

        {success && (
          <div className="space-y-6">
            <div className="text-green-600 text-6xl mb-4">
              ✓
            </div>
            
            <h2 className="text-2xl font-semibold text-green-800 mb-4">
              Email Succesvol Geverifieerd!
            </h2>
            
            {user && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800">
                  Welkom {user.firstName} {user.lastName}!
                </p>
                <p className="text-green-700 text-sm mt-2">
                  Uw email adres is succesvol geverifieerd.
                </p>
              </div>
            )}

            {/* Business account pending approval message */}
            {isBusinessAccount && businessStatus === 'pending' && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-amber-800">Wachten op Goedkeuring</span>
                </div>
                <p className="text-amber-700 text-sm">
                  Uw e-mailadres is geverifieerd. Wacht alstublieft tot uw bedrijfsaccount is goedgekeurd voordat u kunt inloggen.
                </p>
                <p className="text-amber-600 text-xs mt-2">
                  U ontvangt een e-mail zodra uw account is beoordeeld door onze beheerder.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Only show login button for non-business or approved business accounts */}
              {(!isBusinessAccount || businessStatus === 'approved') && (
                <button
                  onClick={handleLogin}
                  className="w-full bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  Inloggen
                </button>
              )}
              
              <button
                onClick={handleHome}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Terug naar Home
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-6">
            <div className="text-red-600 text-6xl mb-4">
              ✗
            </div>
            
            <h2 className="text-2xl font-semibold text-red-800 mb-4">
              Verificatie Mislukt
            </h2>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleLogin}
                className="w-full bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                Opnieuw Proberen
              </button>
              
              <button
                onClick={handleHome}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Terug naar Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="bubble-grid max-w-2xl mx-auto">
        <BackBubble showCondition={true} />
        <div className="bubble col-span-full text-center">
          <h1 className="text-3xl font-bold mb-6">Email Verificatie</h1>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Laden...</span>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

