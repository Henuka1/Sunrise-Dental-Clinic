import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";
import type { UserRole } from "@/lib/constants";
import { PATH_MODULE, hasAccess } from "@/lib/permissions";

const ROLE_ACCESS: Record<UserRole, string[]> = {
    ADMIN: [
    "/dashboard",
    "/appointments",
    "/appointments/new",
    "/patients",
    "/patients/new",
    "/search",
    "/billing",
    "/treatments",
    "/reports",
    "/users",
    "/users/access",
    "/profile",
    "/help",
  ],
    RECEPTIONIST: [
    "/dashboard",
    "/appointments",
    "/appointments/new",
    "/patients",
    "/patients/new",
    "/search",
    "/billing",
    "/treatments",
    "/reports",
    "/users",
    "/users/access",
    "/profile",
    "/help",
  ],
  DENTIST: [
    "/dashboard",
    "/dentist/available",
    "/appointments",
    "/patients",
    "/search",
    "/reports",
    "/users",
    "/users/access",
    "/profile",
    "/help",
  ],
};

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { pathname } = useLocation();

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const role = (user?.role as UserRole) || "ADMIN";
  const allowed = ROLE_ACCESS[role] || ROLE_ACCESS.ADMIN;
  const isRoleAllowed = allowed.some((path) => pathname === path || pathname.startsWith(path + "/"));
  if (!isRoleAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  // Per-user access control: only allow the route if the user is an ADMIN
  // or has been granted the module that gates this route.
  const module = PATH_MODULE[pathname];
  if (module && user && user.role !== "ADMIN" && !hasAccess(user, module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
