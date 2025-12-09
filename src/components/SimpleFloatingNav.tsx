"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Special handling for Account button when not logged in
    if (href === "/account" && !user) {
      e.preventDefault();
      router.push("/login");
      return;
    }
    
    handleProtectedNavigation(href);
  };
  
  // Check if this is a protected route that should be disabled when not logged in
  const isProtectedRoute = href === "/recipes" || href === "/add";
  const isDisabled = isProtectedRoute && !user;
  
  return (
    <Link
      href={href}
      className={`simple-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
      title={label}
      onClick={handleClick}
      style={isDisabled ? { pointerEvents: 'none', opacity: 0.5 } : {}}
    >
      <div className="w-full h-full flex items-center justify-center">
        <Image
          src={iconPath}
          alt={`${label} icon`}
          width={24}
          height={24}
          className="nav-icon-img"
          style={{ 
            width: '24px', 
            height: '24px',
            objectFit: 'contain'
          }}
        />
      </div>
    </Link>
  );
}


export default function SimpleFloatingNav() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showModal, handleCloseModal, handleLogin } = useAuthGuard();
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const navItems: NavItem[] = [
    { href: "/", iconPath: "/homepage-icon.png", label: t.home },
    { href: "/recipes", iconPath: "/recipes-icon.png", label: t.recipes },
    { href: "/add", iconPath: "/add-icon.png", label: t.add },
    { href: "/account", iconPath: "/account-icon.png", label: t.account },
  ];

  // Mobile scroll behavior - fade out sidebar on any downward movement
  useEffect(() => {
    if (!user) {
      setIsScrollingUp(false);
      return;
    }

    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      
      const currentScrollY = window.scrollY;
      
      // Only apply on mobile screens
      if (window.innerWidth <= 1023) {
        if (currentScrollY > lastScrollY) {
          // Any downward scroll - hide sidebar immediately
          setIsScrollingUp(true);
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show sidebar
          setIsScrollingUp(false);
        } else if (currentScrollY === 0) {
          // At top - always show sidebar
          setIsScrollingUp(false);
        }
      } else {
        // On desktop, always show sidebar
        setIsScrollingUp(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      // Initial check
      handleScroll();

      // Add event listeners with proper options for mobile
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });
      
      // Add touch event listeners for better mobile responsiveness
      window.addEventListener('touchstart', handleScroll, { passive: true });
      window.addEventListener('touchmove', handleScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
        window.removeEventListener('touchstart', handleScroll);
        window.removeEventListener('touchmove', handleScroll);
      };
    }
  }, [lastScrollY, user]);

  if (!user) {
    return null;
  }


  return (
    <>
      {/* Auth Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCloseModal}
          />
          <div className="relative z-10 max-w-sm mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="bubble bubble-warning transform transition-all duration-300">
              <div className="bubble-content text-center">
                <div className="bubble-icon mx-auto">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
                <div className="bubble-title">Toegang Beperkt</div>
                <div className="bubble-description">
                  U moet ingelogd zijn om deze sectie te gebruiken.
                </div>
                <div className="flex gap-3 justify-center mt-6">
                  <button
                    onClick={handleLogin}
                    className="px-6 py-3 bg-white/20 border border-white/30 rounded-xl font-medium text-white hover:bg-white/30 transition-all duration-200"
                  >
                    {t.login}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-medium text-white hover:bg-white/20 transition-all duration-200"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile/Tablet Navigation - Hidden on desktop */}
      <div className={`simple-floating-nav sm:hidden ${isScrollingUp ? 'fade-out' : ''}`}>
        {navItems.map((item) => (
          <SimpleNavItem
            key={item.href}
            href={item.href}
            iconPath={item.iconPath}
            label={item.label}
          />
        ))}
      </div>

    </>
  );
}
