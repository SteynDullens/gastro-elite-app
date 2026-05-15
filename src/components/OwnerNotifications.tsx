"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

type AppNotifRow = {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
};

export default function OwnerNotifications() {
  const { user, isBusiness } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<AppNotifRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const showBell = Boolean(user && isBusiness && user.ownedCompany);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
    } catch (e) {
      console.error("Owner notifications fetch:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showBell) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [showBell, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });
      await fetchNotifications();
    } catch (e) {
      console.error("Mark notification read:", e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ markAllRead: true }),
      });
      await fetchNotifications();
    } catch (e) {
      console.error("Mark all read:", e);
    }
  };

  if (!showBell) {
    return null;
  }

  const topClass = user?.isAdmin ? "top-[5.5rem]" : "top-4";

  return (
    <div className={`fixed ${topClass} right-4 z-50`} ref={popupRef}>
      <button
        type="button"
        onClick={() => setShowPopup(!showPopup)}
        className="relative bg-white rounded-full p-3 shadow-lg ring-2 ring-orange-400/40 hover:shadow-xl transition-all duration-200 hover:scale-105"
        title={t.teamNotificationsTitle}
      >
        <svg
          className="w-6 h-6 text-orange-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showPopup && (
        <div className="absolute top-14 right-0 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-fadeSlideIn">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex justify-between items-start gap-2">
            <div>
              <h3 className="text-white font-semibold text-lg">{t.teamNotificationsTitle}</h3>
              <p className="text-orange-100 text-sm">{t.teamNotificationsSubtitle}</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-white/95 underline underline-offset-2 shrink-0"
              >
                {t.teamNotificationsMarkAllRead}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">{t.loading}</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-gray-600">{t.teamNotificationsEmpty}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`w-full text-left p-4 hover:bg-stone-50 transition-colors ${
                      !n.readAt ? "bg-orange-50/40" : ""
                    }`}
                    onClick={() => {
                      if (!n.readAt) void markRead([n.id]);
                    }}
                  >
                    <div className="flex justify-between gap-2 mb-1">
                      <span className={`font-semibold ${!n.readAt ? "text-stone-900" : "text-stone-600"}`}>
                        {n.title}
                      </span>
                      {!n.readAt && (
                        <span className="shrink-0 h-2 w-2 rounded-full bg-orange-500 mt-1.5" aria-hidden />
                      )}
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{n.body}</p>
                    <p className="text-xs text-stone-400 mt-2">
                      {new Date(n.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-3 bg-gray-50">
            <Link
              href="/company"
              className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
              onClick={() => setShowPopup(false)}
            >
              {t.company} →
            </Link>
          </div>

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
      )}
    </div>
  );
}
