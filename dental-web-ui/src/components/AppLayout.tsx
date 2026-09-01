import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarPlus,
  UserRoundPlus,
  CalendarCheck2,
  Search,
  ReceiptText,
  BarChart3,
  LifeBuoy,
  Stethoscope,
  History,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  UserRoundCheck,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NAV_LINKS, CLINIC_INFO } from "@/lib/constants";
import { getEffectivePermissions, PATH_MODULE } from "@/lib/permissions";
import { authService } from "@/lib/services";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/patients/new": UserRoundPlus,
  "/patients": History,
  "/appointments/new": CalendarPlus,
  "/dentist/available": CalendarCheck2,
  "/appointments": CalendarCheck2,
  "/search": Search,
  "/billing": ReceiptText,
    "/reports": BarChart3,
  "/treatments": Stethoscope,
  "/users": UserRoundPlus,
  "/users/access": ShieldCheck,
  "/profile": UserRoundCheck,
  "/help": LifeBuoy,
};

export default function AppLayout() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sidebar.collapsed") === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem("sidebar.collapsed", prev ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !prev;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
          navigate("/");
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

  const SidebarNav = ({ mobile = false }: { mobile?: boolean }) => {
    const isCollapsed = collapsed && !mobile;
    return (
      <>
        <div
          className={cn(
            "mb-8 flex items-center px-1",
            isCollapsed ? "justify-center gap-0" : "gap-3 px-3"
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/30",
              isCollapsed ? "h-11 w-11" : "h-12 w-12"
            )}
          >
            <Stethoscope className={isCollapsed ? "h-5 w-5" : "h-6 w-6"} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900">
                {CLINIC_INFO.name}
              </p>
              <p className="text-xs tracking-wide text-slate-500">
                Management System
              </p>
            </div>
          )}
        </div>

        <nav className={cn("space-y-1", isCollapsed && "space-y-1.5")}>
          {(NAV_LINKS[user?.role ?? "ADMIN"] || NAV_LINKS.ADMIN)
            .filter(
              (link) =>
                link.to === "/profile" ||
                user?.role === "ADMIN" ||
                getEffectivePermissions(user).includes(
                  PATH_MODULE[link.to] ?? ("dashboard" as const)
                )
            )
            .map((link) => {
            const Icon = NAV_ICONS[link.to] ?? LayoutDashboard;
            const isItemCollapsed = isCollapsed;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end
                onClick={() => mobile && setMobileOpen(false)}
                title={isItemCollapsed ? link.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center rounded-xl text-sm font-medium transition-all",
                    isItemCollapsed
                      ? "justify-center px-0 py-3"
                      : "gap-3 px-4 py-3",
                    isActive
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/30"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isItemCollapsed && <span className="truncate">{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div
          className={cn(
            "mt-auto rounded-2xl border border-slate-200 bg-white shadow-sm",
            isCollapsed ? "p-2" : "p-4"
          )}
        >
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "mb-4 gap-3"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <UserIcon className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
                <p className="truncate text-xs uppercase tracking-wide text-slate-500">{user?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={cn(
              "inline-flex w-full items-center rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50",
              isCollapsed ? "justify-center px-0 py-2" : "justify-center gap-2 px-3 py-2"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#dffaf5_0%,#f6fbff_35%,#f8fafc_100%)]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200/70 bg-slate-50/85 p-5 backdrop-blur transition-all duration-300 ease-in-out lg:flex",
          collapsed ? "w-[76px]" : "w-72"
        )}
      >
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute -right-3 top-8 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition-colors hover:bg-teal-600 hover:text-white",
            collapsed && "-right-3.5"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
        <SidebarNav />
      </aside>

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{CLINIC_INFO.name}</p>
              <p className="text-[11px] text-slate-500">Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 flex h-full w-80 max-w-[85%] flex-col border-r border-slate-200 bg-slate-50 p-5">
            <SidebarNav mobile />
          </aside>
        </div>
      )}

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
