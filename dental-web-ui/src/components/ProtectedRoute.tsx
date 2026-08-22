import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";
import type { UserRole } from "@/lib/constants";

const ROLE_ACCESS: Record<UserRole, string[]> = {
  ADMIN: [
    "/dashboard",
    "/appointments",
    "/appointments/new",
    "/patients",
    "/patients/new",
    "/search",
    "/billing",
    "/reports",
    "/users",
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
    "/reports",
    "/help",
  ],
  DENTIST: ["/dashboard", "/appointments", "/patients", "/search", "/reports", "/help"],
};

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { pathname } = useLocation();

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const role = (user?.role as UserRole) || "ADMIN";
  const allowed = ROLE_ACCESS[role] || ROLE_ACCESS.ADMIN;
  const isAllowed = allowed.some((path) => pathname === path || pathname.startsWith(path + "/"));
  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
