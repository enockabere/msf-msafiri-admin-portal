import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// MSF Color utilities
export const msfColors = {
  red: "var(--color-msf-red)",
  redDark: "var(--color-msf-red-dark)",
  yellow: "var(--color-msf-yellow)",
  orange: "var(--color-msf-orange)",
  blue: "var(--color-msf-blue)",
  green: "var(--color-msf-green)",
  purple: "var(--color-msf-purple)",
} as const;

// Role color mapping
export const roleColors = {
  super_admin: "text-role-super-admin",
  mt_admin: "text-role-mt-admin",
  hr_admin: "text-role-hr-admin",
  event_admin: "text-role-event-admin",
} as const;

export function getRoleColor(role: string) {
  return roleColors[role as keyof typeof roleColors] || "text-foreground";
}
