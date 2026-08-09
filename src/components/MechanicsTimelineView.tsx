import { createClient } from "@/lib/supabase/server";
import { getCheckpointFramesForSession } from "@/lib/checkpointFrames";
import { CheckpointFilmstrip } from "@/components/CheckpointFilmstrip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export async function MechanicsTimelineView({
  studentId,
  emptyHint,
}: {
  studentId: string;
  emptyHint: string;
}) {
  const supabase = await createClient();

  const { data: checkpointSessions } = await supabase
    .from("training_sessions")
    .select("id, session_date, checkpoint_phase_label, mechanics_analysis_notes")
    .eq("student_id", studentId)
    .eq("is_checkpoint", true)
    .order("session_date", { ascending: true });

  const sessionsWithFrames = await Promise.all(
    (checkpointSessions ?? []).map(async (s) => ({
      ...s,
      frames: await getCheckpointFramesForSession(supabase, s.id),
    }))
  );

  if (sessionsWithFrames.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyHint}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
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
