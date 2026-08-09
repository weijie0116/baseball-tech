import { createClient } from "@/lib/supabase/server";
import { getCheckpointFramesForSession } from "@/lib/checkpointFrames";
import { CheckpointFilmstrip } from "@/components/CheckpointFilmstrip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MechanicsTimelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: checkpointSessions } = await supabase
    .from("training_sessions")
    .select("id, session_date, checkpoint_phase_label, mechanics_analysis_notes")
    .eq("student_id", user!.id)
    .eq("is_checkpoint", true)
    .order("session_date", { ascending: true });

  const sessionsWithFrames = await Promise.all(
    (checkpointSessions ?? []).map(async (s) => ({
      ...s,
      frames: await getCheckpointFramesForSession(supabase, s.id),
    }))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">投球機制進步分析</h1>
        <p className="text-muted-foreground text-sm">
          {sessionsWithFrames.length > 0
            ? `${sessionsWithFrames.length} 個代表性檢核點`
            : "教練標記代表性上課、擷取關鍵動作畫面後,會顯示在這裡。"}
        </p>
      </div>

      {sessionsWithFrames.map((s) => (
        <Card key={s.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{s.session_date}</CardTitle>
            {s.checkpoint_phase_label && <Badge>{s.checkpoint_phase_label}</Badge>}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <CheckpointFilmstrip frames={s.frames} />
            {s.mechanics_analysis_notes && (
              <p className="whitespace-pre-wrap text-sm">{s.mechanics_analysis_notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
