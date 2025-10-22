"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  iconPath: string;
}

export default function DesktopSidebar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems: NavItem[] = [
    {
      href: "/",
      label: t.home,
      iconPath: "/homepage-icon.png"
    },
    {
      href: "/recipes",
      label: t.recipes,
      iconPath: "/recipes-icon.png"
    },
    {
      href: "/add",
      label: t.add,
      iconPath: "/add-icon.png"
    },
    {
      href: "/account",
      label: t.account,
      iconPath: "/account-icon.png"
    }
  ];

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="desktop-sidebar">
        <div className="sidebar-content">
          <div className="sidebar-logo">
            <img src="/logo.svg" alt="Gastro-Elite Logo" />
          </div>
          <nav className="sidebar-nav">
            <ul className="nav-list">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="nav-item-wrapper">
                  <div className="nav-link">
                    <div className="nav-icon">
                      <div className="w-5 h-5 bg-gray-400 rounded animate-pulse"></div>
                    </div>
                    <span className="nav-label">
                      <div className="w-16 h-4 bg-gray-400 rounded animate-pulse"></div>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </nav>
          <div className="sidebar-footer">
            <p>© 2024 Gastro-Elite</p>
            <p>Professioneel receptenbeheer</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-sidebar">
      <div className="sidebar-content">
        {/* Logo */}
        <div className="sidebar-logo">
          <img src="/logo.svg" alt="Gastro-Elite Logo" />
        </div>
        
        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isDisabled = (item.href === "/recipes" || item.href === "/add") && !user;
              
              return (
                <li key={item.href} className="nav-item-wrapper">
                  <Link
                    href={item.href}
                    className={`nav-link ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                    title={item.label}
                    style={isDisabled ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                  >
                    <div className="nav-icon">
                      <img
                        src={item.iconPath}
                        alt={`${item.label} icon`}
                        className="nav-icon-img"
                        style={{ 
                          filter: isActive 
                            ? 'brightness(0) invert(1)' // White icon for active state
                            : 'none'
                        }}
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Footer */}
        <div className="sidebar-footer">
          <p>© 2024 Gastro-Elite</p>
          <p>Professioneel receptenbeheer</p>
        </div>
      </div>
    </div>
  );
}