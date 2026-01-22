"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  const { user, loading, isAdmin, isBusiness } = useAuth();
  const [businessApplications, setBusinessApplications] = useState<BusinessApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  
  // Fetch business applications for admin users
  useEffect(() => {
    if (isAdmin && user) {
      setLoadingApplications(true);
      fetch('/api/business-applications/preview')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
          setBusinessApplications(data);
          } else {
            setBusinessApplications([]);
          }
          setLoadingApplications(false);
        })
        .catch(error => {
          console.error('Error fetching business applications:', error);
          setBusinessApplications([]);
          setLoadingApplications(false);
        });
    }
  }, [isAdmin, user]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 18) return t.goodAfternoon;
    return t.goodEvening;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-500">{t.loading}</div>
        </div>
      </div>
    );
  }
  
  // Show login start screen for guests
  if (!user) {
    return <LoginScreen enableBackButton={false} />;
  }
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
          <Image
            src="/logo.svg"
            alt="Gastro-Elite logo"
              width={64}
              height={64}
            priority
          />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {user.firstName}!
            </h1>
            <p className="text-gray-600 mt-1">
              {isBusiness ? t.manageBusinessRecipes : t.goodLuck}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t.quickActions}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* View Recipes */}
          <Link href="/recipes" className="block">
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-orange-200 transition-all duration-200 h-full">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff6b35">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
              <h3 className="font-medium text-gray-900 text-sm">{t.recipes}</h3>
              <p className="text-xs text-gray-500 mt-1">{t.viewRecipes}</p>
          </div>
          </Link>

          {/* Add Recipe */}
          <Link href="/add" className="block">
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-orange-200 transition-all duration-200 h-full">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#22c55e">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </div>
              <h3 className="font-medium text-gray-900 text-sm">{t.add}</h3>
              <p className="text-xs text-gray-500 mt-1">{t.newRecipe}</p>
            </div>
          </Link>

          {/* Account */}
          <Link href="/account" className="block">
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-orange-200 transition-all duration-200 h-full">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 text-sm">{t.account}</h3>
              <p className="text-xs text-gray-500 mt-1">{t.settings}</p>
            </div>
          </Link>

          {/* Admin Panel - Only for admins */}
          {isAdmin && (
            <Link href="/admin" className="block">
              <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-orange-200 transition-all duration-200 h-full">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#9333ea">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 text-sm">{t.admin}</h3>
                <p className="text-xs text-gray-500 mt-1">{t.managePanel}</p>
              </div>
            </Link>
          )}
          </div>
      </section>

      {/* Business Applications - Admin Only */}
      {isAdmin && (
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#eab308">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
              <div>
                <h2 className="font-semibold text-gray-800">{t.businessApplications}</h2>
                <p className="text-sm text-gray-500">{t.forApproval}</p>
              </div>
            </div>
            {businessApplications.length > 0 && (
              <span className="bg-orange-100 text-orange-600 text-xs font-medium px-2 py-1 rounded-full">
                {businessApplications.length} {t.new}
              </span>
            )}
          </div>
          
          <div className="p-6">
            {loadingApplications ? (
              <div className="text-center py-6 text-gray-500">{t.loading}</div>
            ) : businessApplications.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#22c55e">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">{t.noOpenApplications}</p>
              </div>
            ) : (
              <div className="space-y-3">
              {businessApplications.slice(0, 3).map((app) => (
                  <div key={app.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{app.name}</div>
                      <div className="text-sm text-gray-600">
                        {app.owner.firstName} {app.owner.lastName} • {app.owner.email}
                      </div>
                        <div className="text-xs text-gray-500 mt-1">
                        KvK: {app.kvkNumber} • {new Date(app.createdAt).toLocaleDateString('nl-NL')}
                      </div>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {t.pending}
                      </span>
                  </div>
                </div>
              ))}
              
              {businessApplications.length > 3 && (
                <div className="text-center text-sm text-gray-500">
                    +{businessApplications.length - 3} {t.moreApplications}
                </div>
              )}
              
                <Link 
                  href="/admin?tab=business"
                  className="block text-center py-3 text-sm text-orange-500 hover:text-orange-600 font-medium border-t border-gray-100 mt-4"
                >
                  {t.viewAllApplications} →
                </Link>
            </div>
          )}
          </div>
        </section>
      )}

      {/* Tip Card */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">{t.tipOfTheDay}</h3>
            <p className="text-white/90 text-sm leading-relaxed">
              {t.tipContent}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
