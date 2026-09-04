import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Stethoscope } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CLINIC_INFO } from "@/lib/constants";
import { getEffectivePermissions } from "@/lib/permissions";
import { authService } from "@/lib/services";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";

export default function AppLayout() {
  const { user, logout, updateUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sidebar.collapsed") === "1";
    } catch {
      return false;
    }
  });

  // Real-time User Access Control sync: poll fresh permissions from the DB
  // so admin-side changes apply without re-login. If access to the current
  // page is revoked, kick the user back to an allowed page (or log them out
  // if their account was deactivated).
  const userRef = useRef(user);
  userRef.current = user;
  useEffect(() => {
    let cancelled = false;

    const syncPermissions = async () => {
      const current = userRef.current;
      if (!current) return;
      try {
        const res = await authService.getPermissions();
        if (cancelled) return;
        const fresh: string[] = res?.data?.data?.permissions ?? [];
        const prev = getEffectivePermissions(current);
        if (JSON.stringify([...prev].sort()) !== JSON.stringify([...fresh].sort())) {
          updateUser({ ...current, permissions: fresh });
        }
      } catch (err: any) {
        if (cancelled) return;
        if (err?.response?.status === 401) {
          // Account deactivated or session invalid — force logout.
          logout();
        }
      }
    };

    syncPermissions();
    const interval = setInterval(syncPermissions, 8000);
    window.addEventListener("focus", syncPermissions);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", syncPermissions);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#dffaf5_0%,#f6fbff_35%,#f8fafc_100%)]">
      {/* Sidebar Component (Desktop + Mobile) */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-600/20">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{CLINIC_INFO.name}</p>
              <p className="text-[11px] text-slate-500">Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "mx-auto w-full max-w-7xl px-4 py-8 transition-all duration-300 ease-in-out sm:px-6 lg:pr-8",
          collapsed ? "lg:pl-[104px]" : "lg:pl-80"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
