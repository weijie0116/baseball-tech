"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/layout/SignOutButton";

interface NavItem {
  href: string;
  label: string;
}

export function RoleShell({
  title,
  navItems,
  userName,
  children,
}: {
  title: string;
  navItems: NavItem[];
  userName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-heading font-semibold">{title}</span>
          <nav className="flex gap-1.5 text-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {userName && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{userName}</span>
              <div className="bg-accent size-7 rounded-full" />
            </div>
          )}
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
