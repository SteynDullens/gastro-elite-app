"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Bubble from './Bubble';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedPaths?: string[];
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay with dimming */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative z-10 max-w-sm mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        <Bubble variant="warning" className="transform transition-all duration-300">
          <div className="bubble-content text-center">
            <div className="bubble-icon mx-auto">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            </div>
            <div className="bubble-title">Access Restricted</div>
            <div className="bubble-description">
              Please sign in to access this section.
            </div>
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={onLogin}
                className="px-6 py-3 bg-white/20 border border-white/30 rounded-xl font-medium text-white hover:bg-white/30 transition-all duration-200"
              >
                Login
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-medium text-white hover:bg-white/20 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </Bubble>
      </div>
    </div>
  );
}

export default function AuthGuard({ children, allowedPaths = ['/', '/login', '/register'] }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleProtectedNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Allow navigation to allowed paths
    if (allowedPaths.includes(href)) {
      router.push(href);
      return;
    }

    // Show modal for protected paths
    if (!user && !loading) {
      setShowModal(true);
    } else {
      router.push(href);
    }
  };

  const handleLogin = () => {
    setShowModal(false);
    router.push('/login');
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <AuthModal 
        isOpen={showModal} 
        onClose={handleCloseModal} 
        onLogin={handleLogin} 
      />
      {children}
    </>
  );
}

// Hook for using the auth guard in components
export function useAuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleProtectedNavigation = (href: string) => {
    // Allow navigation to public paths
    const allowedPaths = ['/', '/login', '/register'];
    if (allowedPaths.includes(href)) {
      router.push(href);
      return;
    }

    // Show modal for protected paths
    if (!user && !loading) {
      setShowModal(true);
    } else {
      router.push(href);
    }
  };

  const handleLogin = () => {
    setShowModal(false);
    router.push('/login');
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return {
    handleProtectedNavigation,
    showModal,
    setShowModal,
    handleLogin,
    handleCloseModal,
  };
}













