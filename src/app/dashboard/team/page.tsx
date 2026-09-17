"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type AuthUser } from "@/lib/api";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  hiring_manager: "Hiring Manager",
};

const TeamPage = () => {
  const router = useRouter();
  const [me, setMe] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = () => api.listUsers().then(setUsers);

  useEffect(() => {
    api
      .me()
      .then((user) => {
        setMe(user);
        return loadUsers();
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createUser({
        full_name: fullName,
        email,
        password,
        ...(me?.role === "super_admin" ? { company_name: companyName } : {}),
      });
      setCompanyName("");
      setFullName("");
      setEmail("");
      setPassword("");
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </main>
    );
  }

  if (!me) return null;

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-muted-foreground text-sm">
          {me.role === "super_admin"
            ? "Create a hiring manager and their company together."
            : "Add a hiring manager to your company."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border p-6 shadow-xs">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {me.role === "super_admin" && (
          <div className="space-y-1">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 chars, 1 letter + 1 number"
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creating…" : "Create hiring manager"}
        </Button>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          {me.role === "super_admin" ? "Every company's users" : "Your company's users"}
        </h2>
        <ul className="divide-y rounded-xl border">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{user.full_name}</p>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
              <span className="text-muted-foreground text-sm">{roleLabel[user.role] ?? user.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
};

export default TeamPage;
