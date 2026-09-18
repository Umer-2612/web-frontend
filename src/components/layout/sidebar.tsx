"use client";

import { Briefcase, Building2, ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole } from "@/lib/api";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const dashboardItem = { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> };

function navItemsForRole(role: UserRole) {
  if (role === "super_admin") {
    return [dashboardItem, { href: "/dashboard/companies", label: "Companies", icon: <Building2 size={16} /> }];
  }
  return [
    dashboardItem,
    { href: "/dashboard/jobs", label: "Jobs", icon: <Briefcase size={16} /> },
    { href: "/dashboard/team", label: "Team", icon: <Users size={16} /> },
  ];
}

interface SidebarProps {
  userName: string;
  userRole: UserRole;
  onLogout: () => void;
}

export const Sidebar = ({ userName, userRole, onLogout }: SidebarProps) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const navItems = navItemsForRole(userRole);

  // Longest matching href wins, so /dashboard/jobs/[id] highlights "Jobs"
  // instead of both "Dashboard" and "Jobs" matching on the shared prefix.
  const activeHref = navItems
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  };

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-zinc-800 bg-zinc-900 transition-all duration-200",
        collapsed ? "w-14" : "w-52",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-zinc-800 px-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
              <LayoutDashboard size={14} className="text-white" />
            </div>
            <span className="truncate text-sm font-semibold text-zinc-100" title={siteConfig.title}>
              {siteConfig.title}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-7 w-7 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {navItems.map((item) => (
          <SidebarNavItem key={item.href} {...item} collapsed={collapsed} active={item.href === activeHref} />
        ))}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "flex h-auto w-full items-center gap-2 rounded-none border-t border-zinc-800 p-3 hover:bg-zinc-800",
              collapsed && "justify-center",
            )}
            aria-label="Profile menu"
          >
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-zinc-700">
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-300">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-xs font-medium text-zinc-200">{userName}</p>
                <p className="truncate text-[11px] text-zinc-500 capitalize">{userRole.replace("_", " ")}</p>
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="mb-1 w-48 border-zinc-700 bg-zinc-800">
          <DropdownMenuLabel className="pb-2">
            <p className="truncate text-xs font-semibold text-zinc-100">{userName}</p>
            <p className="truncate text-[11px] text-zinc-500 capitalize">{userRole.replace("_", " ")}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-700" />
          <DropdownMenuItem onClick={onLogout} className="gap-2.5 text-xs text-red-400 focus:bg-zinc-700 focus:text-red-300">
            <LogOut size={13} className="shrink-0" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  );
};
