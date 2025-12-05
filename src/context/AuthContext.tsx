"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyId?: string;
  isBlocked: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  ownedCompany?: {
    id: string;
    name: string;
    address: string;
    kvkNumber: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
  };
  company?: {
    id: string;
    name: string;
    address: string;
    kvkNumber: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isBusiness: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'user' | 'business';
  companyName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

      const refreshUser = async () => {
        try {
          // Add timeout to prevent hanging forever
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setLoading(false); // Ensure loading is set to false after successful login
        return { success: true };
      } else {
        setUser(null);
        setLoading(false);
        return { success: false, error: data.error };
      }
    } catch (error) {
      setUser(null);
      setLoading(false);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      console.log('Registering user with data:', registerData);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registerData),
      });

      console.log('Registration response status:', response.status);
      const data = await response.json();
      console.log('Registration response data:', data);

      if (response.ok) {
        // Check if email verification is required based on server response
        if (data.user && data.user.emailVerified) {
          // User is already verified, auto-login
          setUser(data.user);
        }
        // Otherwise, user needs to verify email first
        return { success: true, message: data.message };
      } else {
        console.error('Registration failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration network error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAdmin: user?.isAdmin || false,
    isBusiness: user?.ownedCompany ? true : false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

