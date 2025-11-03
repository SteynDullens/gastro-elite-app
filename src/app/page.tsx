"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Image from "next/image";
import Bubble from "@/components/Bubble";
import LoginScreen from "@/components/LoginScreen";

interface BusinessApplication {
  id: string;
  name: string;
  kvkNumber: string;
  address: string;
  createdAt: string;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function Home() {
  const { t } = useLanguage();
  const { user, loading, isAdmin } = useAuth();
  const [businessApplications, setBusinessApplications] = useState<BusinessApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  
  // Fetch business applications for admin users
  useEffect(() => {
    if (isAdmin && user) {
      setLoadingApplications(true);
      fetch('/api/business-applications/preview')
        .then(res => res.json())
        .then(data => {
          setBusinessApplications(data);
          setLoadingApplications(false);
        })
        .catch(error => {
          console.error('Error fetching business applications:', error);
          setLoadingApplications(false);
        });
    }
  }, [isAdmin, user]);
  
  if (loading) {
    return (
      <div className="bubble-grid">
        <Bubble variant="light" className="col-span-full text-center">
          <div className="text-gray-500">Loading... (AuthContext loading: {loading.toString()})</div>
        </Bubble>
      </div>
    );
  }
  
  // Show login start screen for guests
  if (!user) {
    return <LoginScreen enableBackButton={false} />;
  }
  
  return (
    <div className="bubble-grid">
      <Bubble variant="light" className="col-span-full">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.svg"
            alt="Gastro-Elite logo"
            width={96}
            height={96}
            priority
          />
        </div>
        <div className="bubble-title">{t.welcome} {user.firstName}!</div>
        <div className="bubble-description">{t.goodLuck}</div>
      </Bubble>

      <Bubble variant="light">
        <div className="bubble-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        <div className="bubble-title">{t.recipes}</div>
        <div className="bubble-description">Beheer uw receptenverzameling</div>
        <Bubble variant="secondary" href="/recipes" className="mt-4">
          <div className="bubble-content py-2 px-4 min-w-[120px] text-center">
            <div className="text-sm font-medium">{t.view} {t.recipes}</div>
          </div>
        </Bubble>
      </Bubble>

      <Bubble variant="light">
        <div className="bubble-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </div>
        <div className="bubble-title">{t.addNewRecipe}</div>
        <div className="bubble-description">Maak nieuwe recepten</div>
        <Bubble variant="secondary" href="/add" className="mt-4">
          <div className="bubble-content py-2 px-4 min-w-[120px] text-center">
            <div className="text-sm font-medium">{t.add}</div>
          </div>
        </Bubble>
      </Bubble>

      {/* Business Applications Preview - Always show for Admin Users */}
      {isAdmin && (
        <Bubble variant="light" className="col-span-full">
          <div className="bubble-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="bubble-title">Bedrijfsaanvragen ter goedkeuring</div>
          <div className="bubble-description">
            {loadingApplications ? (
              <div className="text-gray-500">Laden...</div>
            ) : businessApplications.length > 0 ? (
              `${businessApplications.length} nieuwe aanvraag${businessApplications.length !== 1 ? 'gen' : ''} wacht${businessApplications.length !== 1 ? 'en' : ''} op goedkeuring`
            ) : (
              "Nog geen nieuwe aanvragen"
            )}
          </div>
          
          {businessApplications.length > 0 ? (
            <div className="mt-4 space-y-3">
              {businessApplications.slice(0, 3).map((app) => (
                <div key={app.id} className="bg-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{app.name}</div>
                      <div className="text-sm text-gray-600">
                        {app.owner.firstName} {app.owner.lastName} • {app.owner.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        KvK: {app.kvkNumber} • {new Date(app.createdAt).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        In afwachting
                      </div>
                      <button 
                        onClick={() => window.open(`/admin/business-applications`, '_blank')}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                      >
                        Bekijk aanvraag
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {businessApplications.length > 3 && (
                <div className="text-center text-sm text-gray-500">
                  +{businessApplications.length - 3} meer aanvragen
                </div>
              )}
              
              <Bubble variant="secondary" href="/admin/business-applications" className="mt-4">
                <div className="bubble-content py-2 px-4 min-w-[120px] text-center">
                  <div className="text-sm font-medium">Bekijk alle aanvragen</div>
                </div>
              </Bubble>
            </div>
          ) : (
            <div className="mt-4 text-center text-gray-500">
              <p>Er zijn momenteel geen nieuwe bedrijfsaanvragen om te beoordelen.</p>
            </div>
          )}
        </Bubble>
      )}
    </div>
  );
}
