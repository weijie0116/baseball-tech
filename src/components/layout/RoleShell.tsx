import Link from "next/link";
import { SignOutButton } from "@/components/layout/SignOutButton";

interface NavItem {
  href: string;
  label: string;
}

export function RoleShell({
  title,
  navItems,
  children,
}: {
  title: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold">{title}</span>
          <nav className="flex gap-4 text-sm">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
