"use client";

import React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useAuthGuard } from "@/components/AuthGuard";

interface NavItem {
  href: string;
  iconPath: string;
  label: string;
}

function SimpleNavItem({ href, iconPath, label }: NavItem) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === href;
  const { handleProtectedNavigation } = useAuthGuard();
  const { user } = useAuth();

  const isProtectedRoute = href === "/recipes" || href === "/add";
  const isDisabled = isProtectedRoute && !user;

  const navigate = () => {
    if (isDisabled) return;
    if (href === "/account" && !user) {
      router.push("/login");
      return;
    }
    handleProtectedNavigation(href);
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      disabled={isDisabled}
      onClick={navigate}
      className={`simple-nav-item ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
    >
      <Image
        src={iconPath}
        alt=""
        width={24}
        height={24}
        className="nav-icon-img"
        style={{
          width: "24px",
          height: "24px",
          objectFit: "contain",
        }}
      />
    </button>
  );
}

export default function SimpleFloatingNav() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showModal, handleCloseModal, handleLogin } = useAuthGuard();
  const { isAdmin } = useAuth();

  const navItems: NavItem[] = [
    { href: "/", iconPath: "/homepage-icon.png", label: t.home },
    { href: "/recipes", iconPath: "/recipes-icon.png", label: t.recipes },
    { href: "/add", iconPath: "/add-icon.png", label: t.add },
    { href: "/account", iconPath: "/account-icon.png", label: t.account },
    ...(isAdmin ? [{ href: "/admin", iconPath: "/account-icon.png", label: "Admin" }] : []),
  ];

  if (!user) {
    return null;
  }

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleCloseModal}
            role="presentation"
          />
          <div className="relative z-10 max-w-sm mx-4">
            <div className="bubble bubble-warning">
              <div className="bubble-content text-center">
                <div className="bubble-icon mx-auto" aria-hidden>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                </div>
                <div className="bubble-title">Toegang Beperkt</div>
                <div className="bubble-description">
                  U moet ingelogd zijn om deze sectie te gebruiken.
                </div>
                <div className="flex gap-3 justify-center mt-6">
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="px-6 py-3 bg-white/20 border border-white/30 rounded-xl font-medium text-white"
                  >
                    {t.login}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-medium text-white"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="simple-floating-nav sm:hidden" aria-label="Hoofdnavigatie">
        {navItems.map((item) => (
          <SimpleNavItem
            key={item.href}
            href={item.href}
            iconPath={item.iconPath}
            label={item.label}
          />
        ))}
      </nav>
    </>
  );
}
