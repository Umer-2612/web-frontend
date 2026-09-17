"use client";

import { useEffect, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { api, type AuthUser } from "@/lib/api";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  hiring_manager: "Hiring Manager",
};

const DashboardPage = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AiSpinner />;
  if (!user) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Welcome, {user.full_name}</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {user.email} · {roleLabel[user.role] ?? user.role}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Jobs, candidates, and interviews come next. Use Team in the sidebar to bring on a hiring
        manager.
      </p>
    </div>
  );
};

export default DashboardPage;
