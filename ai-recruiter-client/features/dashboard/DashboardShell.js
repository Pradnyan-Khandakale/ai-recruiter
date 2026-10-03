"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BriefcaseBusiness, GitBranch, LayoutDashboard, LogOut, UserCircle2, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const loadProfile = useAuthStore((state) => state.loadProfile);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white p-4 md:flex">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-emerald-700 text-white">
              <BriefcaseBusiness size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">AI Recruitment</p>
              <p className="text-xs text-slate-500">Recruiter Console</p>
            </div>
          </div>

          {user && (
            <div className="mb-6 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <UserCircle2 className="text-emerald-700" size={20} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{user.name || "Recruiter"}</p>
                  <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-800 uppercase">{user.role || "recruiter"}</Badge>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50",
                    active && "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white p-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-emerald-700 text-white">
            <BriefcaseBusiness size={16} />
          </div>
          <span className="text-sm font-bold text-slate-950">AI Recruiter</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </Button>
      </header>

      <main className="min-h-screen p-4 md:ml-64 md:p-8">{children}</main>
    </div>
  );
}
