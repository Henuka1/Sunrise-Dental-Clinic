import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Stethoscope, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NAV_LINKS, CLINIC_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">{CLINIC_INFO.name}</p>
            <p className="text-xs text-slate-500">Management System</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 md:flex">
            <UserIcon className="h-4 w-4 text-slate-400" />
            <div className="text-right">
              <p className="text-xs font-medium text-slate-900">{user?.fullName}</p>
              <p className="text-[10px] text-slate-500">{user?.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="space-y-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-100"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
