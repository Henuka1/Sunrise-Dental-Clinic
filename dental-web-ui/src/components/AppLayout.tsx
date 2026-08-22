import { useState } from "react";
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
  User as UserIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NAV_LINKS, CLINIC_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/patients/new": UserRoundPlus,
  "/patients": History,
  "/appointments/new": CalendarPlus,
  "/appointments": CalendarCheck2,
  "/search": Search,
  "/billing": ReceiptText,
  "/reports": BarChart3,
  "/users": UserRoundPlus,
  "/help": LifeBuoy,
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const SidebarNav = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className="mb-8 flex items-center gap-3 px-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
          <Stethoscope className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">{CLINIC_INFO.name}</p>
          <p className="text-xs tracking-wide text-slate-500">Management System</p>
        </div>
      </div>

      <nav className="space-y-1">
        {(NAV_LINKS[user?.role ?? "ADMIN"] || NAV_LINKS.ADMIN).map((link) => {
          const Icon = NAV_ICONS[link.to] ?? LayoutDashboard;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end
              onClick={() => mobile && setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/30"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
            <p className="truncate text-xs uppercase tracking-wide text-slate-500">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#dffaf5_0%,#f6fbff_35%,#f8fafc_100%)]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200/70 bg-slate-50/85 p-5 backdrop-blur lg:flex lg:flex-col">
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

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:pl-80 lg:pr-8">
        <Outlet />
      </main>
    </div>
  );
}
