"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Sidebar } from "@/components/layout/sidebar";
import { AiLoader } from "@/components/ui/ai-loader";
import { api, ApiError, type AuthUser } from "@/lib/api";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setRedirecting(true);
          router.replace("/login");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    setRedirecting(true);
    try {
      await api.logout();
    } finally {
      router.replace("/login");
    }
  };

  if (loading || redirecting) {
    return <AiLoader fullScreen label="Loading workspace" />;
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar userName={user.full_name} userRole={user.role} onLogout={handleLogout} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader pathname={pathname} />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
