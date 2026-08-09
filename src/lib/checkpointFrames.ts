import type { createClient } from "@/lib/supabase/server";
import type { CheckpointFrameDisplay } from "@/components/CheckpointFilmstrip";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour, plenty for a single page view

export async function getCheckpointFramesForSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string
): Promise<CheckpointFrameDisplay[]> {
  const { data: frames } = await supabase
    .from("session_checkpoint_frames")
    .select("id, image_storage_key, phase_guess, confirmed_by_coach, caption")
    .eq("session_id", sessionId)
    .order("frame_order", { ascending: true });

  if (!frames || frames.length === 0) return [];

  const results = await Promise.all(
    frames.map(async (f) => {
      const { data: signed } = await supabase.storage
        .from("checkpoint-frames")
        .createSignedUrl(f.image_storage_key, SIGNED_URL_TTL_SECONDS);
      return {
        id: f.id,
        url: signed?.signedUrl ?? null,
        phase_guess: f.phase_guess,
        confirmed_by_coach: f.confirmed_by_coach,
        caption: f.caption,
      };
    })
  );

  return results;
}
