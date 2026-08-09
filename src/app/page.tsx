import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME_PATH } from "@/lib/auth/roles";
import type { UserRole } from "@/types/database.types";

// Root route: send everyone straight to their role's home (or /login).
// Proxy also enforces this per-request, but doing it here too means the
// route works correctly even for direct navigation.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as UserRole | undefined;
  redirect(role ? ROLE_HOME_PATH[role] : "/login");
}
