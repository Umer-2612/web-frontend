"use client";

import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Sidebar } from "@/components/layout/sidebar";

/** Auth is resolved and enforced by <AuthProvider>; this only renders the shell. */
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar userName={user.full_name} userRole={user.role} onLogout={logout} />
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
