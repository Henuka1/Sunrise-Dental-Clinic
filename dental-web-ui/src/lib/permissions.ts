import type { User } from "@/types";

export type ModuleKey =
  | "dashboard"
  | "patients"
  | "appointments"
    | "billing"
  | "treatments"
  | "reports"
  | "users"
  | "user_access"
  | "help";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  path: string;
  description: string;
}

export const MODULES: ModuleDef[] = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", description: "Landing overview page" },
  { key: "patients", label: "Patients", path: "/patients", description: "Register and view patient history" },
  { key: "appointments", label: "Appointments", path: "/appointments", description: "Schedule and manage appointments" },
  { key: "billing", label: "Billing", path: "/billing", description: "Create and manage bills" },
    { key: "reports", label: "Reports", path: "/reports", description: "Daily, revenue and dentist reports" },
  { key: "treatments", label: "Treatment Manage", path: "/treatments", description: "Manage the treatment catalogue and pricing" },
  { key: "users", label: "User Management", path: "/users", description: "Create, edit and remove user accounts" },
  { key: "user_access", label: "User Access Control", path: "/users/access", description: "Control what each user can access" },
  { key: "help", label: "Help", path: "/help", description: "Help and user guide" },
];

export const ALL_KEYS: ModuleKey[] = MODULES.map((m) => m.key);

/** Maps a route path to the module that gates it. */
export const PATH_MODULE: Record<string, ModuleKey> = {
  "/dashboard": "dashboard",
  "/patients": "patients",
  "/patients/new": "patients",
  "/appointments": "appointments",
  "/appointments/new": "appointments",
  "/search": "appointments",
  "/billing": "billing",
    "/reports": "reports",
  "/treatments": "treatments",
  "/users": "users",
  "/users/access": "user_access",
  "/help": "help",
};

/** Default modules granted to each role when no custom access is stored yet. */
export const DEFAULT_PERMISSIONS: Record<User["role"], ModuleKey[]> = {
  ADMIN: [...ALL_KEYS],
    RECEPTIONIST: ["dashboard", "patients", "appointments", "billing", "treatments", "reports", "help"],
  DENTIST: ["dashboard", "patients", "appointments", "reports", "help"],
};
/** The effective set of modules a given user is allowed to access. */
export function getEffectivePermissions(user: User | null): ModuleKey[] {
  if (!user) return [];
  if (user.role === "ADMIN") return [...ALL_KEYS];
  const stored = user.permissions;
  if (stored && stored.length > 0) {
    const valid = stored.filter((k): k is ModuleKey => ALL_KEYS.includes(k as ModuleKey));
    if (valid.length > 0) return valid;
    return [...DEFAULT_PERMISSIONS[user.role]];
  }
  return [...DEFAULT_PERMISSIONS[user.role]];
}

/** Whether a user may access a module. */
export function hasAccess(user: User | null | undefined, key: ModuleKey): boolean {
  if (!user) return false;
  return getEffectivePermissions(user).includes(key);
}

/** Split a stored CSV permission string into module keys. */
export function parseCsvPermissions(csv?: string | null): ModuleKey[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((k) => k.trim())
    .filter((k): k is ModuleKey => ALL_KEYS.includes(k as ModuleKey));
}