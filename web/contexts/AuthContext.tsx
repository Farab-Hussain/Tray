'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/utils/api';

interface User {
  uid: string;
  email: string;
  name?: string;
  role?: string;
  profileImage?: string | null;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = React.useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      const userData = response.data as User;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Don't logout on refresh error, keep existing user data
    }
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Optionally refresh user data from backend
          await refreshUser();
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [refreshUser]);

  const login = async (idToken: string) => {
    const response = await authAPI.login(idToken);
    const data = response.data as {
      user?: User;
      token?: string;
      valid?: boolean;
      error?: string;
    };

    if (!data?.user) {
      throw new Error(data?.error || 'Login failed — no user returned from server');
    }

    const userData = data.user;
    setUser(userData);
    // API middleware expects Firebase ID token (refreshed on each session)
    localStorage.setItem('authToken', idToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (data.token) {
      localStorage.setItem('backendJwt', data.token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

