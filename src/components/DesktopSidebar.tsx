"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

interface NavItem {
  href: string;
  label: string;
  iconPath: string;
}

export default function DesktopSidebar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();
  
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
          <Image src="/logo.svg" alt="Gastro-Elite Logo" width={100} height={100} priority />
        </div>
        
        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isDisabled = !user;
              
              if (isDisabled) {
                return (
                  <li key={item.href} className="nav-item-wrapper">
                    <div
                      className="nav-link disabled"
                      title={t.loginToAccess}
                    >
                      <div className="nav-icon">
                        <Image
                          src={item.iconPath}
                          alt={`${item.label} icon`}
                          width={24}
                          height={24}
                          style={{ filter: 'grayscale(100%)' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="nav-label">{item.label}</span>
                    </div>
                  </li>
                );
              }
              
              return (
                <li key={item.href} className="nav-item-wrapper">
                  <Link
                    href={item.href}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    title={item.label}
                  >
                    <div className="nav-icon">
                      <Image
                        src={item.iconPath}
                        alt={`${item.label} icon`}
                        width={24}
                        height={24}
                        style={{ 
                          filter: isActive ? 'brightness(0) invert(1)' : 'none'
                        }}
                        onError={(e) => {
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
