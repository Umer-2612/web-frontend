"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type PublicInvitation } from "@/lib/api";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  hiring_manager: "Hiring Manager",
};

const InvitePage = ({ params }: { params: Promise<{ token: string }> }) => {
  const { token } = use(params);
  const router = useRouter();

  const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getInvitation(token)
      .then(setInvitation)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Invalid invitation"))
      .finally(() => setChecking(false));
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await api.setPassword(token, fullName, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border p-6 shadow-xs">
        {checking ? (
          <p className="text-muted-foreground text-sm">Validating invitation…</p>
        ) : loadError || !invitation ? (
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-bold">Invitation problem</h1>
            <p className="text-sm text-red-600">{loadError}</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="w-full space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Set your password</h1>
              <p className="text-muted-foreground text-sm">
                You&apos;re joining <strong>{invitation.company_name}</strong> as{" "}
                {roleLabel[invitation.role] ?? invitation.role}.
              </p>
              <p className="text-muted-foreground text-sm">{invitation.email}</p>
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="space-y-1">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
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

            <div className="space-y-1">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Saving…" : "Set password & continue"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
};

export default InvitePage;
