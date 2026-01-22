"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

interface PendingApplication {
  id: string;
  company_name: string;
  ownerFirstName: string;
  ownerEmail: string;
  createdAt: string;
}

export default function AdminNotifications() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && isAdmin) {
      fetchPendingApplications();
      // Refresh every 30 seconds
      const interval = setInterval(fetchPendingApplications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPendingApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/business-applications", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const pending = data.filter((app: any) => app.status === "pending");
        setPendingApplications(pending);
      }
    } catch (error) {
      console.error("Failed to fetch pending applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (companyId: string) => {
    try {
      const response = await fetch("/api/admin/business-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ companyId, status: "approved" }),
      });
      if (response.ok) {
        setPendingApplications((prev) => prev.filter((app) => app.id !== companyId));
      }
    } catch (error) {
      console.error("Failed to approve application:", error);
    }
  };

  const handleReject = async (companyId: string) => {
    const reason = prompt("Reden voor afwijzing:");
    if (!reason) return;
    
    try {
      const response = await fetch("/api/admin/business-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ companyId, status: "rejected", rejectionReason: reason }),
      });
      if (response.ok) {
        setPendingApplications((prev) => prev.filter((app) => app.id !== companyId));
      }
    } catch (error) {
      console.error("Failed to reject application:", error);
    }
  };

  // Don't render if not admin or no user
  if (!user || !isAdmin) {
    return null;
  }

  const pendingCount = pendingApplications.length;

  return (
    <div className="fixed top-4 right-4 z-50" ref={popupRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowPopup(!showPopup)}
        className="relative bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        title={`${pendingCount} nieuwe aanvragen`}
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Badge with count */}
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {/* Popup */}
      {showPopup && (
        <div className="absolute top-14 right-0 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeSlideIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
            <h3 className="text-white font-semibold text-lg">Bedrijfsaanvragen</h3>
            <p className="text-orange-100 text-sm">
              {pendingCount} {pendingCount === 1 ? "aanvraag" : "aanvragen"} wachtend
            </p>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">{t.loading}</div>
            ) : pendingCount === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-gray-600">{t.noNewApplications}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingApplications.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{app.company_name}</h4>
                        <p className="text-sm text-gray-500">
                          {app.ownerFirstName} • {app.ownerEmail}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(app.createdAt).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleApprove(app.id)}
                        className="flex-1 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                      >
                        ✓ Goedkeuren
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        className="flex-1 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                      >
                        ✗ Afwijzen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-3 bg-gray-50">
            <Link
              href="/admin?tab=business"
              className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
              onClick={() => setShowPopup(false)}
            >
              Alle aanvragen bekijken →
            </Link>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
