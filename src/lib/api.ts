/**
 * Typed API client for core-api. Auth is cookie-based (httpOnly Authorization
 * cookie) with a Bearer-token fallback stored in localStorage, for browsers
 * that block third-party/strict cookies. Every request sends credentials:
 * "include" so the cookie goes automatically when it's available.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const AUTH_TOKEN_KEY = "interview_platform_auth_token";

function getStoredAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

function setStoredAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearStoredAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export type UserRole = "super_admin" | "hiring_manager";

export interface AuthUser {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface PublicInvitation {
  email: string;
  role: UserRole;
  company_name: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredAuthToken();
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: init?.cache ?? "no-store",
    credentials: "include",
    headers,
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* no JSON body */
  }

  if (!res.ok) {
    const message =
      (body as { error?: { message?: string } })?.error?.message ??
      (body as { message?: string })?.message ??
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return (body as { data: T }).data;
}

export const api = {
  login: async (email: string, password: string) => {
    const result = await request<{ user: AuthUser; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setStoredAuthToken(result.token);
    return result;
  },
  logout: async () => {
    try {
      return await request<unknown>("/auth/logout", { method: "POST" });
    } finally {
      clearStoredAuthToken();
    }
  },
  me: () => request<AuthUser>("/auth/me"),

  getInvitation: (token: string) => request<PublicInvitation>(`/invitations/${encodeURIComponent(token)}`),
  setPassword: async (token: string, fullName: string, password: string) => {
    const result = await request<{ user: AuthUser; token: string }>("/auth/set-password", {
      method: "POST",
      body: JSON.stringify({ token, full_name: fullName, password }),
    });
    setStoredAuthToken(result.token);
    return result;
  },
};
