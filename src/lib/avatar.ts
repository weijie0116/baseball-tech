import type { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getAvatarUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storageKeys: (string | null)[]
): Promise<Record<string, string>> {
  const keys = storageKeys.filter((k): k is string => !!k);
  if (keys.length === 0) return {};

  const results = await Promise.all(
    keys.map(async (key) => {
      const { data } = await supabase.storage.from("avatars").createSignedUrl(key, SIGNED_URL_TTL_SECONDS);
      return [key, data?.signedUrl ?? null] as const;
    })
  );

  const map: Record<string, string> = {};
  for (const [key, url] of results) {
    if (url) map[key] = url;
  }
  return map;
}
