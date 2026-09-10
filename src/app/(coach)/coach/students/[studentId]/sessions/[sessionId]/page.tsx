import { createClient } from "@/lib/supabase/server";
import { getCheckpointFramesForSession } from "@/lib/checkpointFrames";
import { PitchMetricForm } from "./PitchMetricForm";
import { DeletePitchButton } from "./DeletePitchButton";
import { CheckpointForm } from "./CheckpointForm";
import { VideoLinkForm } from "./VideoLinkForm";
import { DeleteVideoButton } from "./DeleteVideoButton";
import { pitchTypeLabel, pitchTypeBadgeClassName } from "@/lib/baseball";
import { CheckpointFilmstrip } from "@/components/CheckpointFilmstrip";
import { VideoLinksList } from "@/components/VideoLinksList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
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

  const [{ data: session }, { data: pitches }, { data: videos }] = await Promise.all([
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
    supabase
      .from("session_videos")
      .select("id, storage_path, share_password, file_name")
      .eq("session_id", sessionId)
      .order("uploaded_at", { ascending: true }),
  ]);

  const checkpointFrames = session?.is_checkpoint
    ? await getCheckpointFramesForSession(supabase, sessionId)
    : [];

  const nextPitchNumber = (pitches ?? []).reduce((max, p) => Math.max(max, p.pitch_number ?? 0), 0) + 1;

  const velocities = (pitches ?? [])
    .map((p) => p.velocity_kph)
    .filter((v): v is number => v != null);
  const spinRates = (pitches ?? [])
    .map((p) => p.spin_rate_rpm)
    .filter((v): v is number => v != null);
  const fastestVelocity = velocities.length ? Math.max(...velocities) : null;
  const averageVelocity = velocities.length
    ? Math.round((velocities.reduce((a, b) => a + b, 0) / velocities.length) * 10) / 10
    : null;
  const fastestSpinRate = spinRates.length ? Math.max(...spinRates) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">{session?.session_date} 訓練紀錄</h1>
        {session?.location && <p className="text-muted-foreground text-sm">地點:{session.location}</p>}
      </div>

      {(pitches ?? []).length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="本次最快"
            value={fastestVelocity != null ? String(fastestVelocity) : "-"}
            unit="km/h"
            primary
          />
          <StatCard
            label="平均球速"
            value={averageVelocity != null ? String(averageVelocity) : "-"}
            unit="km/h"
          />
          <StatCard
            label="最高轉速"
            value={fastestSpinRate != null ? String(fastestSpinRate) : "-"}
            unit="rpm"
          />
          <StatCard label="投球數" value={String((pitches ?? []).length)} unit="球" />
        </div>
      )}

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
                  <TableCell className="font-numeric tabular-nums text-muted-foreground">
                    {p.pitch_number ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={pitchTypeBadgeClassName(p.pitch_type)}>
                      {pitchTypeLabel(p.pitch_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-numeric font-bold tabular-nums">
                    {p.velocity_kph ?? "-"}
                  </TableCell>
                  <TableCell className="font-numeric tabular-nums">{p.spin_rate_rpm ?? "-"}</TableCell>
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
          <CardTitle>投球影片</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            影片放在 NAS 上,貼上 Synology QuickConnect 的分享連結(File Station 產生),
            點開會連到下載頁面(部分影片格式無法直接預覽播放,需下載後用手機/電腦的播放器開啟)。
          </p>
          <VideoLinkForm studentId={studentId} sessionId={sessionId} />
          <VideoLinksList
            videos={videos ?? []}
            renderActions={(v) => (
              <DeleteVideoButton studentId={studentId} sessionId={sessionId} videoId={v.id} />
            )}
          />
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
