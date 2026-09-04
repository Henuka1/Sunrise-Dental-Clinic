import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NAV_LINKS, CLINIC_INFO } from "@/lib/constants";
import { getEffectivePermissions, PATH_MODULE } from "@/lib/permissions";
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

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sidebar.collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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

  const userLinks = NAV_LINKS[user?.role ?? "ADMIN"] || NAV_LINKS.ADMIN;
  const userPermissions = getEffectivePermissions(user);

  const filteredLinks = userLinks.filter((link) => {
    const required = PATH_MODULE[link.to];
    if (!required) return true;
    return userPermissions.includes(required);
  });

  const isCollapsed = collapsed;

  const renderNavContent = (isMobile: boolean) => {
    const showLabels = isMobile || !isCollapsed;

    return (
      <>
        {/* Header / Logo */}
        <div
          className={cn(
            "flex items-center border-b border-slate-200/70 pb-5",
            isCollapsed && !isMobile ? "justify-center" : "gap-3"
          )}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-600/20">
            <Stethoscope className="h-5 w-5" />
          </div>
          {showLabels && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-bold text-slate-900">
                {CLINIC_INFO.name}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                Management System
              </p>
            </div>
          )}
          {isMobile && (
            <button
              onClick={onMobileClose}
              className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          <ul className="space-y-1">
            {filteredLinks.map((link) => {
              const Icon = NAV_ICONS[link.to] || LayoutDashboard;
              return (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end
                    onMouseEnter={() => setHoveredItem(link.to)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                        isCollapsed && !isMobile
                          ? "justify-center px-0 py-3"
                          : "gap-3 px-3 py-3",
                        isActive
                          ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-600/20"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    {showLabels && <span className="truncate">{link.label}</span>}
                    {showLabels && (
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-0 transition-all duration-200 group-hover:opacity-50" />
                    )}
                    {isCollapsed && !isMobile && hoveredItem === link.to && (
                      <div className="absolute left-full z-50 ml-3 hidden items-center lg:flex">
                        <div className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
                          {link.label}
                          <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
                        </div>
                      </div>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-slate-200/70 pt-4">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "mb-3 flex items-center rounded-xl transition-colors",
                isCollapsed && !isMobile ? "justify-center px-0 py-2" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )
            }
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700">
              <UserIcon className="h-4 w-4" />
            </div>
            {showLabels && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-slate-900">
                  {user?.fullName}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {user?.role}
                </p>
              </div>
            )}
          </NavLink>
          <button
            onClick={handleLogout}
            title={isCollapsed && !isMobile ? "Logout" : undefined}
            className={cn(
              "group inline-flex w-full items-center rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600",
              isCollapsed && !isMobile
                ? "justify-center px-0 py-3"
                : "justify-center gap-2 px-3 py-3"
            )}
          >
            <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            {showLabels && "Logout"}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200/70 bg-white/95 backdrop-blur-md transition-all duration-300 ease-in-out lg:flex",
          isCollapsed ? "w-[76px]" : "w-72"
        )}
      >
        <button
          onClick={toggleCollapsed}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute -right-3 top-8 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition-all duration-200 hover:border-teal-300 hover:bg-teal-600 hover:text-white hover:shadow-lg",
            isCollapsed && "-right-3.5"
          )}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
        <div className="flex h-full flex-col overflow-hidden p-5">
          {renderNavContent(false)}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onMobileClose}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 flex h-full w-80 max-w-[85%] flex-col border-r border-slate-200 bg-white shadow-2xl">
            <div className="flex h-full flex-col overflow-hidden p-5">
              {renderNavContent(true)}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}


