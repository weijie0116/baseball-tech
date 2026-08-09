import type { UserRole } from "@/types/database.types";

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  admin: "/admin/users",
  coach: "/coach/students",
  student: "/student/dashboard",
};

export function pathBelongsToRole(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith("/admin")) return role === "admin";
  if (pathname.startsWith("/coach")) return role === "coach";
  if (pathname.startsWith("/student")) return role === "student";
  return true;
}
