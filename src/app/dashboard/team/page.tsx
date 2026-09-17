"use client";

import { useEffect, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type AuthUser } from "@/lib/api";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  hiring_manager: "Hiring Manager",
};

const TeamPage = () => {
  const [me, setMe] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = () =>
    api
      .listUsers()
      .then(setUsers)
      .catch((err) => setListError(err instanceof ApiError ? err.message : "Failed to load"));

  useEffect(() => {
    api
      .me()
      .then((user) => {
        setMe(user);
        return loadUsers();
      })
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <AiSpinner />;
  if (!me) return null;

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {me.role === "super_admin" ? "Create a hiring manager and their company" : "Add a hiring manager"}
        </h2>

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          {me.role === "super_admin" && (
            <div className="space-y-1 sm:col-span-2">
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
          <div className="space-y-1 sm:col-span-2">
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
        </div>

        <Button type="submit" disabled={submitting} className="mt-4">
          {submitting ? "Creating…" : "Create hiring manager"}
        </Button>
      </form>

      {listError && <p className="text-sm text-red-500">{listError}</p>}
      <div className="max-w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-400">
                  No users yet, create one above.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{user.full_name}</td>
                <td className="px-4 py-3 text-zinc-500">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                    {roleLabel[user.role] ?? user.role}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamPage;
