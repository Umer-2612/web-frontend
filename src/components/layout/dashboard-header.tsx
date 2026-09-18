import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ThemeSwitcher } from "@/components/theme-switcher";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/jobs": "Jobs",
  "/dashboard/team": "Team",
  "/dashboard/companies": "Companies",
};

function detailParent(pathname: string): { title: string; backHref: string } | null {
  if (pathname.startsWith("/dashboard/jobs/")) return { title: "Job Detail", backHref: "/dashboard/jobs" };
  if (pathname.startsWith("/dashboard/companies/")) return { title: "Company Detail", backHref: "/dashboard/companies" };
  return null;
}

interface DashboardHeaderProps {
  pathname: string;
}

export const DashboardHeader = ({ pathname }: DashboardHeaderProps) => {
  const detail = detailParent(pathname);
  const title = pageTitles[pathname] ?? detail?.title ?? "Dashboard";

  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex min-w-0 items-center gap-3">
        {detail && (
          <Link
            href={detail.backHref}
            aria-label="Back"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <ArrowLeft size={16} />
          </Link>
        )}
        <h1 className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-100">{title}</h1>
      </div>
      <ThemeSwitcher className="size-9 shrink-0" />
    </header>
  );
};
