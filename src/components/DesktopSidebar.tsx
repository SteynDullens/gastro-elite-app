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
  
  // Debug logging
  console.log('DesktopSidebar rendering, t:', t, 'user:', user);
  
  const navItems: NavItem[] = [
    {
      href: "/",
      label: t.home || "Home",
      iconPath: "/homepage-icon.png"
    },
    {
      href: "/recipes",
      label: t.recipes || "Recipes",
      iconPath: "/recipes-icon.png"
    },
    {
      href: "/add",
      label: t.add || "Add",
      iconPath: "/add-icon.png"
    },
    {
      href: "/account",
      label: t.account || "Account",
      iconPath: "/account-icon.png"
    }
  ];

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