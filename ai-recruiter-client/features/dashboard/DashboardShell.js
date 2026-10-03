"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BriefcaseBusiness, GitBranch, LayoutDashboard, LogOut, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/dashboard/candidates", label: "Candidates", icon: Users },
  { href: "/dashboard/workflows", label: "Workflows", icon: GitBranch },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 }
];

export function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    // TODO: Clear the session through the auth store and redirect to /login.
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white p-4 md:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-emerald-700 text-white">
            <BriefcaseBusiness size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">AI Recruitment Agent</p>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn("flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-700", active && "bg-emerald-50 text-emerald-800")}>
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" className="absolute bottom-4 left-4 right-4 justify-start" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </Button>
      </aside>
      <main className="min-h-screen p-4 md:ml-64 md:p-8">{children}</main>
    </div>
  );
}
