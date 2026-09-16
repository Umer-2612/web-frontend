"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { api, type AuthUser } from "@/lib/api";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  hiring_manager: "Hiring Manager",
};

const DashboardPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const onLogout = async () => {
    await api.logout();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Welcome, {user.full_name}</h1>
        <p className="text-muted-foreground text-sm">
          {user.email} · {roleLabel[user.role] ?? user.role}
        </p>
      </div>
      <p className="text-muted-foreground text-sm">
        This is the placeholder landing spot after sign-in or invite acceptance. Jobs, candidates, and
        interviews come next.
      </p>
      <Button variant="outline" onClick={onLogout}>
        Log out
      </Button>
    </main>
  );
};

export default DashboardPage;
