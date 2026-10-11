/**
 * Authentication service for GhatRakshak.
 *
 * Handles login, logout, and session management.
 * Uses HttpOnly cookies managed by the server.
 */

export type UserRole = 'municipal_officer' | 'administrator';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
}

const API_BASE = '/api/v1';

class AuthService {
  private listeners: Set<(state: AuthState) => void> = new Set();
  private state: AuthState = {
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
  };

  constructor() {
    this.checkSession();
  }

  getState(): AuthState {
    return this.state;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private setState(updates: Partial<AuthState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((listener) => listener(this.state));
  }

  async checkSession(): Promise<User | null> {
    this.setState({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const user = data?.data?.user;
        if (user) {
          this.setState({ isLoading: false, isAuthenticated: true, user, error: null });
          return user;
        }
      }

      // 401 or invalid response - not authenticated, but not an error
      this.setState({ isLoading: false, isAuthenticated: false, user: null, error: null });
      return null;
    } catch (err) {
      // Network failure - show login page but note the error
      console.error('Session check failed:', err);
      this.setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: 'Unable to connect to server'
      });
      return null;
    }
  }

  async login(username: string, password: string): Promise<User> {
    this.setState({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || 'Login failed';
        this.setState({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }

      const user = data.data.user;
      this.setState({ isLoading: false, isAuthenticated: true, user, error: null });
      return user;
    } catch (err) {
      if (err instanceof Error && this.state.error) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Login failed';
      this.setState({ isLoading: false, error: message });
      throw new Error(message);
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    }

    this.setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      error: null,
    });
  }

  isAdmin(): boolean {
    return this.state.user?.role === 'administrator';
  }

  isOfficer(): boolean {
    return this.state.user?.role === 'municipal_officer';
  }
}

export const authService = new AuthService();
