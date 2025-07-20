// lib/auth.ts
import jwtDecode from 'jwt-decode';

interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
}

export class AuthManager {
  private static readonly TOKEN_KEY = 'token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = this.getToken();
    if (!token) return false;
    
    return !this.isTokenExpired(token);
  }

  /**
   * Get JWT token from localStorage
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Set JWT token in localStorage
   */
  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Remove JWT token from localStorage
   */
  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const currentTime = Date.now() / 1000;
      
      // Add 5-minute buffer before expiration
      return decoded.exp < (currentTime + 300);
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get user email from token
   */
  static getUserEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.sub;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token needs refresh (expires within 10 minutes)
   */
  static needsRefresh(token: string): boolean {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const currentTime = Date.now() / 1000;
      
      // Refresh if token expires within 10 minutes
      return decoded.exp < (currentTime + 600);
    } catch (error) {
      return true;
    }
  }

  /**
   * Logout user and clear all auth data
   */
  static logout(): void {
    this.removeToken();
    
    // Clear Apollo cache if available
    if (typeof window !== 'undefined' && (window as any).apolloClient) {
      (window as any).apolloClient.clearStore();
    }
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Redirect to login page
   */
  static redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
  }
}
