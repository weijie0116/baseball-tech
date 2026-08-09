import { createClient } from "@/lib/supabase/server";
import { getCheckpointFramesForSession } from "@/lib/checkpointFrames";
import { PitchMetricForm } from "./PitchMetricForm";
import { DeletePitchButton } from "./DeletePitchButton";
import { CheckpointForm } from "./CheckpointForm";
import { pitchTypeLabel } from "@/lib/baseball";
import { CheckpointFilmstrip } from "@/components/CheckpointFilmstrip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CoachSessionDetailPage({
  params,
}: PageProps<"/coach/students/[studentId]/sessions/[sessionId]">) {
  const { studentId, sessionId } = await params;
  const supabase = await createClient();

  const [{ data: session }, { data: pitches }] = await Promise.all([
    supabase
      .from("training_sessions")
      .select(
        "session_date, location, menu_notes, general_notes, is_checkpoint, checkpoint_phase_label, mechanics_analysis_notes"
      )
      .eq("id", sessionId)
      .single(),
    supabase
      .from("pitch_metrics")
      .select("id, pitch_number, pitch_type, velocity_kph, spin_rate_rpm, notes")
      .eq("session_id", sessionId)
      .order("pitch_number", { ascending: true }),
  ]);

  const checkpointFrames = session?.is_checkpoint
    ? await getCheckpointFramesForSession(supabase, sessionId)
    : [];

  const nextPitchNumber = (pitches ?? []).reduce((max, p) => Math.max(max, p.pitch_number ?? 0), 0) + 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{session?.session_date} 訓練紀錄</h1>
        {session?.location && <p className="text-muted-foreground text-sm">地點:{session.location}</p>}
      </div>

      {(session?.menu_notes || session?.general_notes) && (
        <Card>
          <CardHeader>
            <CardTitle>訓練菜單</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 whitespace-pre-wrap text-sm">
            {session?.menu_notes && <p>{session.menu_notes}</p>}
            {session?.general_notes && (
              <p className="text-muted-foreground">備註:{session.general_notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>投球數據</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PitchMetricForm studentId={studentId} sessionId={sessionId} nextPitchNumber={nextPitchNumber} />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>球種</TableHead>
                <TableHead>球速 (km/h)</TableHead>
                <TableHead>轉速 (rpm)</TableHead>
                <TableHead>備註</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pitches ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.pitch_number ?? "-"}</TableCell>
                  <TableCell>{pitchTypeLabel(p.pitch_type)}</TableCell>
                  <TableCell>{p.velocity_kph ?? "-"}</TableCell>
                  <TableCell>{p.spin_rate_rpm ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.notes ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <DeletePitchButton studentId={studentId} sessionId={sessionId} pitchMetricId={p.id} />
                  </TableCell>
                </TableRow>
              ))}
              {(pitches ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground text-center">
                    尚無投球數據
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>投球機制進步分析</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            關鍵畫面截圖由 Claude 從投球影片擷取分析後上傳,這裡只能編輯階段標籤跟分析文字。
            要處理某次上課的影片,直接跟 Claude 說要分析哪一次的哪支影片。
          </p>
          {session?.is_checkpoint && <CheckpointFilmstrip frames={checkpointFrames} />}
          <CheckpointForm
            studentId={studentId}
            sessionId={sessionId}
            isCheckpoint={session?.is_checkpoint ?? false}
            phaseLabel={session?.checkpoint_phase_label ?? null}
            analysisNotes={session?.mechanics_analysis_notes ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
