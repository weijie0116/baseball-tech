import { RoleShell } from "@/components/layout/RoleShell";
import { getCurrentUserProfile } from "@/lib/supabase/currentUser";

export default async function CoachLayout({ children }: LayoutProps<"/coach">) {
  const { profile } = await getCurrentUserProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <RoleShell
      userName={profile?.full_name ?? undefined}
      navItems={
        isAdmin
          ? [
              { href: "/coach/students", label: "所有學員" },
              { href: "/admin/users", label: "← 回管理後台" },
            ]
          : [
              { href: "/coach/schedule", label: "今日課表" },
              { href: "/coach/students", label: "我的學員" },
            ]
      }
    >
      {children}
    </RoleShell>
  );
}
