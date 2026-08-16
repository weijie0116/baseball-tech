import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME_PATH, pathBelongsToRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/database.types";

// Route guarding at the network boundary: not logged in -> /login,
// logged in but hitting the wrong role's area -> bounced to their own home.
// (Renamed from `middleware.ts` per Next.js 16 - see AGENTS.md.)
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  // /api/* routes (e.g. the LINE webhook) are called by external services,
  // not logged-in browser users — they authenticate themselves (LINE
  // signature check, etc.) rather than going through Supabase auth here.
  const isPublicPath =
    pathname === "/login" ||
    pathname === "/" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/");

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname.startsWith("/") && !isPublicPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("deactivated", "1");
      return NextResponse.redirect(loginUrl);
    }

    const role = profile?.role as UserRole | undefined;
    if (role && !pathBelongsToRole(pathname, role)) {
      return NextResponse.redirect(new URL(ROLE_HOME_PATH[role], request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
