import { RoleShell } from "@/components/layout/RoleShell";

export default function CoachLayout({ children }: LayoutProps<"/coach">) {
  return (
    <RoleShell
      title="教練後台"
      navItems={[{ href: "/coach/students", label: "我的學員" }]}
    >
      {children}
    </RoleShell>
  );
}
