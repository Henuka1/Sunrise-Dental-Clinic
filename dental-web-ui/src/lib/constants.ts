export const API_BASE_URL = "http://localhost:8080/dental-web/api";

export const STORAGE_KEYS = {
  TOKEN: "dental_auth_token",
  USER: "dental_user",
} as const;

export const CLINIC_INFO = {
  name: "Sunrise Dental Clinic",
  address: "No. 45, Galle Road, Colombo 03, Sri Lanka",
  phone: "+94 11 234 5678",
  email: "info@sunrisedental.lk",
};

export const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  NO_SHOW: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PENDING: "bg-orange-100 text-orange-700 border-orange-200",
  PAID: "bg-green-100 text-green-700 border-green-200",
  PARTIAL: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

export const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/patients/new", label: "Register Patient" },
  { to: "/appointments/new", label: "New Appointment" },
  { to: "/appointments", label: "Appointments" },
  { to: "/search", label: "Search" },
  { to: "/billing", label: "Billing" },
  { to: "/reports", label: "Reports" },
  { to: "/help", label: "Help" },
] as const;
