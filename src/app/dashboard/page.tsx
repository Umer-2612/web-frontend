"use client";

import { useEffect, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { api, type AuthUser } from "@/lib/api";

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

  return <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Welcome, {user.full_name}</h2>;
};

export default DashboardPage;
