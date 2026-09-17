import { ThemeSwitcher } from "@/components/theme-switcher";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/jobs": "Jobs",
  "/dashboard/team": "Team",
};

interface DashboardHeaderProps {
  pathname: string;
}

export const DashboardHeader = ({ pathname }: DashboardHeaderProps) => {
  const title = pageTitles[pathname] ?? (pathname.startsWith("/dashboard/jobs/") ? "Job Detail" : "Dashboard");

  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-100">{title}</h1>
      <ThemeSwitcher className="size-9 shrink-0" />
    </header>
  );
};
