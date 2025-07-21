import { AuthManager } from "@/lib/auth";
import { useRouter } from "next/router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/upload", "/profile", "/settings"];

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/"];

  const checkAuth = (): boolean => {
    // Don't check auth during SSR
    if (typeof window === "undefined") {
      return false;
    }

    const authenticated = AuthManager.isAuthenticated();
    const email = AuthManager.getUserEmail();

    setIsAuthenticated(authenticated);
    setUserEmail(email);

    return authenticated;
  };

  const login = (token: string) => {
    AuthManager.setToken(token);
    const email = AuthManager.getUserEmail();

    setIsAuthenticated(true);
    setUserEmail(email);

    // Redirect to dashboard or intended page
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get("redirect") || "/dashboard";
    router.push(redirectTo);
  };

  const logout = () => {
    AuthManager.logout();
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  // Check authentication on mount and route changes
  useEffect(() => {
    const checkAuthAndRedirect = () => {
      // Don't do auth checks during SSR
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const currentPath = router.pathname;
      const isProtectedRoute = protectedRoutes.some((route) =>
        currentPath.startsWith(route)
      );

      const authenticated = checkAuth();

      if (isProtectedRoute && !authenticated) {
        // Redirect to login if trying to access protected route without auth
        AuthManager.redirectToLogin();
      } else if (
        (currentPath === "/login" || currentPath === "/register") &&
        authenticated
      ) {
        // Redirect to dashboard if already authenticated and trying to access login/register
        router.push("/dashboard");
      }

      setIsLoading(false);
    };

    // Run check after router is ready
    if (router.isReady) {
      checkAuthAndRedirect();
    }
  }, [router.isReady, router.pathname]);

  // Set up token expiration checker
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = AuthManager.getToken();
    if (!token) return;

    // Check token expiration every minute
    const interval = setInterval(() => {
      if (!AuthManager.isAuthenticated()) {
        console.log("Token expired, logging out");
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Listen for storage changes (logout from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && !e.newValue) {
        // Token was removed in another tab
        setIsAuthenticated(false);
        setUserEmail(null);
        router.push("/login");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    userEmail,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
