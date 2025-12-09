"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

interface NavItem {
  href: string;
  iconPath: string;
  label: string;
}

interface FloatingNavItemProps extends NavItem {
  disabled?: boolean;
  disabledTitle?: string;
}

function FloatingNavItem({ href, iconPath, label, disabled, disabledTitle }: FloatingNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  if (disabled) {
    return (
      <div
        className="nav-item disabled"
        title={disabledTitle}
        style={{ 
          opacity: 0.4, 
          cursor: 'not-allowed',
          pointerEvents: 'none'
        }}
      >
        <Image
          src={iconPath}
          alt={`${label} icon`}
          width={24}
          height={24}
          className="w-6 h-6"
          style={{ filter: 'grayscale(100%)' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }
  
  return (
    <Link
      href={href}
      className={`nav-item ${isActive ? 'active' : ''}`}
      title={label}
    >
      <Image
        src={iconPath}
        alt={`${label} icon`}
        width={24}
        height={24}
        className="w-6 h-6"
        style={{ 
          filter: isActive 
            ? 'brightness(0) invert(1)'
            : 'none'
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </Link>
  );
}

export default function FloatingNav() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const navItems: NavItem[] = [
    { href: "/", iconPath: "/homepage-icon.png", label: t.home },
    { href: "/recipes", iconPath: "/recipes-icon.png", label: t.recipes },
    { href: "/add", iconPath: "/add-icon.png", label: t.add },
    { href: "/account", iconPath: "/account-icon.png", label: t.account },
  ];

  return (
    <nav className="floating-nav">
      {navItems.map((item) => (
        <FloatingNavItem
          key={item.href}
          href={item.href}
          iconPath={item.iconPath}
          label={item.label}
          disabled={!user}
          disabledTitle={t.loginToAccess}
        />
      ))}
    </nav>
  );
}