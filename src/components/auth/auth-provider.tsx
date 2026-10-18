"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AiLoader } from "@/components/ui/ai-loader";
import { api, ApiError, type AuthUser } from "@/lib/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Candidate portal: no account, never gated or redirected. */
const isPublicRoute = (pathname: string) => pathname.startsWith("/interview");
const isGuestOnlyRoute = (pathname: string) => pathname === "/" || pathname === "/login";

/**
 * App-level auth. Runs once when the app mounts (every tab open / full reload),
 * before any route renders, and again on tab focus or when another tab logs
 * in/out. Routes read the result via `useAuth()` instead of fetching `/auth/me`.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const verify = useCallback(async () => {
    try {
      setUser(await api.me());
      setStatus("authenticated");
    } catch (err) {
      // Only a 401/403 means "signed out"; a network blip keeps the current state.
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setUser(null);
        setStatus("unauthenticated");
      } else {
        setStatus((s) => (s === "loading" ? "unauthenticated" : s));
      }
    }
  }, []);

  // On app mount.
  useEffect(() => {
    void verify();
  }, [verify]);

  // Re-verify on tab focus and cross-tab login/logout.
  useEffect(() => {
    const recheck = () => void verify();
    window.addEventListener("focus", recheck);
    window.addEventListener("storage", recheck);
    return () => {
      window.removeEventListener("focus", recheck);
      window.removeEventListener("storage", recheck);
    };
  }, [verify]);

  // Route guard, applied once the session is known.
  useEffect(() => {
    if (status === "loading" || isPublicRoute(pathname)) return;
    if (status === "authenticated" && isGuestOnlyRoute(pathname)) router.replace("/dashboard");
    if (status === "unauthenticated" && !isGuestOnlyRoute(pathname)) router.replace("/login");
  }, [status, pathname, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: u } = await api.login(email, password);
      setUser(u);
      setStatus("authenticated");
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);

  // Nothing but the loader renders until auth is resolved, and while a redirect is pending.
  const blocked =
    !isPublicRoute(pathname) &&
    (status === "loading" ||
      (status === "authenticated" && isGuestOnlyRoute(pathname)) ||
      (status === "unauthenticated" && !isGuestOnlyRoute(pathname)));

  return (
    <AuthContext.Provider value={value}>
      {blocked ? <AiLoader fullScreen label="Checking session" /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
