"use client";

import React from 'react';
import Link from 'next/link';
import { useAuthGuard } from './AuthGuard';

interface BubbleProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'light';
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function Bubble({
  children,
  className = '',
  variant = 'light',
  onClick,
  href,
  icon,
  title,
  description,
  action,
}: BubbleProps) {
  const bubbleClasses = `bubble bubble-${variant} ${className}`;
  const { handleProtectedNavigation } = useAuthGuard();
  
  const content = (
    <div className={bubbleClasses} onClick={onClick}>
      <div className="bubble-content">
        {icon && <div className="bubble-icon">{icon}</div>}
        {title && <div className="bubble-title">{title}</div>}
        {description && <div className="bubble-description">{description}</div>}
        {children}
        {action && <div className="bubble-action">{action}</div>}
      </div>
    </div>
  );

  if (href) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      handleProtectedNavigation(href);
    };

    return (
      <Link href={href} className="block" onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return content;
}

// Back Button Bubble Component
interface BackBubbleProps {
  href?: string;
  onClick?: () => void;
  className?: string;
  showCondition?: boolean; // New prop to control visibility
}

export function BackBubble({ href, onClick, className = '', showCondition = true }: BackBubbleProps) {
  const { handleProtectedNavigation } = useAuthGuard();
  
  // Don't render if showCondition is false
  if (!showCondition) {
    return null;
  }
  
  const handleClick = (e?: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else if (href) {
      e?.preventDefault();
      handleProtectedNavigation(href);
    }
  };

  const backButton = (
    <div className={`back-bubble ${className}`} onClick={handleClick}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={handleClick}>
        {backButton}
      </Link>
    );
  }

  return backButton;
}

// Smart Back Arrow Component
interface SmartBackArrowProps {
  currentPath: string;
  className?: string;
}

export function SmartBackArrow({ currentPath, className = '' }: SmartBackArrowProps) {
  // Define navigation patterns where back arrow should appear
  const shouldShowBackArrow = () => {
    // Don't show on homepage
    if (currentPath === '/') return false;
    
    // Don't show when navigating to login from homepage
    if (currentPath === '/login') return false;
    
    // Don't show when navigating to register from homepage  
    if (currentPath === '/register') return false;
    
    // Show for recipe detail pages (navigating within recipes tab)
    if (currentPath.startsWith('/recipes/')) return true;
    
    // Show for other pages that are not direct navigation from homepage
    const directFromHomepage = ['/login', '/register'];
    return !directFromHomepage.includes(currentPath);
  };

  if (!shouldShowBackArrow()) {
    return null;
  }

  return (
    <BackBubble 
      href="/" 
      className={`absolute top-4 left-4 z-50 ${className}`} 
    />
  );
}
