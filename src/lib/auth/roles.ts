import type { UserRole } from "@/types/database.types";

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  admin: "/admin/users",
  coach: "/coach/students",
  student: "/student/dashboard",
};

export function pathBelongsToRole(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith("/admin")) return role === "admin";
  // Admin can also browse the coach section (read/manage any student, not
  // just their own) — RLS already grants admin full access to every table
  // the coach pages touch, this just lets them reach the routes.
  if (pathname.startsWith("/coach")) return role === "coach" || role === "admin";
  if (pathname.startsWith("/student")) return role === "student";
  return true;
}
