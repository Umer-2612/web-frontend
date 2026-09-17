"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

export const SidebarNavItem = ({ href, icon, label, collapsed }: SidebarNavItemProps) => {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
        "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
        "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
        active && "bg-indigo-950/40 text-indigo-400",
        collapsed && "justify-center px-2",
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
};
