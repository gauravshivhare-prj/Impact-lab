/**
 * Authentication Context for GhatRakshak.
 *
 * Provides authentication state and methods to all components.
 * Includes development demo mode for local testing without credentials.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService, type User, type AuthState } from '../services/authService';

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<User | null>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  isDemoMode: boolean;
  isAdmin: boolean;
  isOfficer: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USER: User = {
  id: 'demo-user',
  username: 'demo',
  role: 'municipal_officer',
  displayName: 'Demo User (Development)',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => authService.getState());
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    return authService.subscribe(setState);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    return authService.login(username, password);
  }, []);

  const logout = useCallback(async () => {
    setIsDemoMode(false);
    return authService.logout();
  }, []);

  const refreshSession = useCallback(async () => {
    return authService.checkSession();
  }, []);

  const enterDemoMode = useCallback(() => {
    if (import.meta.env.DEV) {
      setIsDemoMode(true);
    }
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
  }, []);

  const effectiveState: AuthState = isDemoMode
    ? {
        isLoading: false,
        isAuthenticated: true,
        user: DEMO_USER,
        error: null,
      }
    : state;

  const value: AuthContextValue = {
    ...effectiveState,
    login,
    logout,
    refreshSession,
    enterDemoMode,
    exitDemoMode,
    isDemoMode,
    isAdmin: effectiveState.user?.role === 'administrator',
    isOfficer: effectiveState.user?.role === 'municipal_officer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(): AuthContextValue & { user: User } {
  const auth = useAuth();
  if (!auth.isAuthenticated || !auth.user) {
    throw new Error('User is not authenticated');
  }
  return auth as AuthContextValue & { user: User };
}
