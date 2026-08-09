import { RoleShell } from "@/components/layout/RoleShell";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RoleShell
      title="管理者後台"
      navItems={[
        { href: "/admin/schedule", label: "今日課表" },
        { href: "/admin/users", label: "帳號管理" },
      ]}
    >
      {children}
    </RoleShell>
  );
}
