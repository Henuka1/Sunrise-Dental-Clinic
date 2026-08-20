import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return `LKR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(time: string): string {
  if (!time) return "-";
  const parts = time.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12.toString().padStart(2, "0")}:${m} ${period}`;
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMaxDatePlus90(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().split("T")[0];
}

export function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const any = err as Record<string, unknown>;
    const response = any.response as Record<string, unknown> | undefined;
    if (response) {
      const data = response.data as Record<string, unknown> | undefined;
      if (data && typeof data.message === "string") return data.message;
      if (response.status === 401) return "Session expired. Please log in again.";
      if (response.status === 404) return "Resource not found.";
      if (response.status === 500) return "Server error. Please try again later.";
      if (response.status === 0) return "Connection failed. Please check your network.";
    }
  }
  if (err && typeof err === "object" && "message" in err) {
    return (err as Record<string, unknown>).message as string;
  }
  return "An unexpected error occurred.";
}
