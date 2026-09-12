import { RoleShell } from "@/components/layout/RoleShell";

export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return (
    <RoleShell
      navItems={[
        { href: "/student/dashboard", label: "總覽" },
        { href: "/student/mechanics-timeline", label: "投球機制進步分析" },
      ]}
    >
      {children}
    </RoleShell>
  );
}
