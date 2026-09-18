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
export type UserStatus = "pending_verification" | "active" | "inactive";

export interface AuthUser {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface CreateUserInput {
  company_name: string;
  full_name: string;
  email: string;
  password: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface CreateJobInput {
  title: string;
  description: string;
}

export interface Candidate {
  id: string;
  job_id: string;
  full_name: string;
  email: string | null;
  resume_file_name: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function authHeaders(): Headers {
  const headers = new Headers();
  const token = getStoredAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* no JSON body */
  }
  const message =
    (body as { error?: { message?: string } })?.error?.message ??
    (body as { message?: string })?.message ??
    `Request failed (${res.status})`;
  throw new ApiError(res.status, message);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = authHeaders();
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: init?.cache ?? "no-store",
    credentials: "include",
    headers,
  });

  await throwIfNotOk(res);
  const body = (await res.json()) as { data: T };
  return body.data;
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

  listUsers: () => request<AuthUser[]>("/users"),
  createUser: (data: CreateUserInput) =>
    request<AuthUser>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listJobs: () => request<Job[]>("/jobs"),
  createJob: (data: CreateJobInput) =>
    request<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getJob: (id: string) => request<Job>(`/jobs/${id}`),

  listCandidates: (jobId: string) => request<Candidate[]>(`/jobs/${jobId}/candidates`),
  uploadResumes: async (jobId: string, files: File[]): Promise<Candidate[]> => {
    const form = new FormData();
    files.forEach((file) => form.append("resumes", file));

    const res = await fetch(`${API_URL}/jobs/${jobId}/candidates`, {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
      body: form,
    });
    await throwIfNotOk(res);
    const body = (await res.json()) as { data: Candidate[] };
    return body.data;
  },
  listCompanies: () => request<Company[]>("/companies"),
  getCompany: (id: string) => request<Company>(`/companies/${id}`),
  listCompanyUsers: (id: string) => request<AuthUser[]>(`/companies/${id}/users`),

  downloadResume: async (jobId: string, candidateId: string, fileName: string): Promise<void> => {
    const res = await fetch(`${API_URL}/jobs/${jobId}/candidates/${candidateId}/resume`, {
      credentials: "include",
      headers: authHeaders(),
    });
    await throwIfNotOk(res);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },
};
