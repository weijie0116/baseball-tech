import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// `supabase.auth.getUser()` makes a real network round trip to revalidate
// the JWT with Supabase Auth (unlike the local-only `getSession()`), so
// calling it separately in a layout and every nested Server Component on
// the same page pays for that round trip multiple times per request.
// `cache()` dedupes this to one call per request across the whole render
// tree. Only use this inside Server Components — Server Actions are
// separate requests and must always re-verify independently.
export const getCurrentUserProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("id, full_name, role, is_active")
        .eq("id", user.id)
        .single()
    : { data: null };

  return { supabase, user, profile };
});
