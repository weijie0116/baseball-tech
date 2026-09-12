import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAvatarUrls } from "@/lib/avatar";
import { getCheckpointFramesForSession } from "@/lib/checkpointFrames";
import { positionLabel, dominantHandLabel } from "@/lib/baseball";
import { StudentProfileForm } from "./StudentProfileForm";
import { MeasurementForm } from "./MeasurementForm";
import { AvatarUploadForm } from "./AvatarUploadForm";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { StudentRail } from "./StudentRail";
import { SessionListRow } from "@/components/SessionListRow";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { VelocityTrendChart } from "@/components/charts/VelocityTrendChart";
import { CheckpointFilmstrip } from "@/components/CheckpointFilmstrip";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getPitchStatsBySession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionIds: string[]
): Promise<Map<string, { velocity: number | null; spin: number | null }>> {
  const bySession = new Map<string, { velocity: number | null; spin: number | null }>();
  if (sessionIds.length === 0) return bySession;

  const { data: pitches } = await supabase
    .from("pitch_metrics")
    .select("session_id, velocity_kph, spin_rate_rpm")
    .in("session_id", sessionIds);

  for (const p of pitches ?? []) {
    const current = bySession.get(p.session_id) ?? { velocity: null, spin: null };
    if (p.velocity_kph != null && (current.velocity == null || p.velocity_kph > current.velocity)) {
      current.velocity = p.velocity_kph;
    }
    if (p.spin_rate_rpm != null && (current.spin == null || p.spin_rate_rpm > current.spin)) {
      current.spin = p.spin_rate_rpm;
    }
    bySession.set(p.session_id, current);
  }
  return bySession;
}

export default async function CoachStudentDetailPage({
  params,
}: PageProps<"/coach/students/[studentId]">) {
  const { studentId } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: studentProfile }, { data: measurements }, { data: sessions }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, avatar_storage_key").eq("id", studentId).single(),
      supabase
        .from("student_profiles")
        .select("birth_date, dominant_hand, notes, school, team, position, jersey_number, pitch_types")
        .eq("student_id", studentId)
        .single(),
      supabase
        .from("student_measurements")
        .select("id, measured_at, height_cm, weight_kg")
        .eq("student_id", studentId)
        .order("measured_at", { ascending: false }),
      supabase
        .from("training_sessions")
        .select("id, session_date, location, menu_notes")
        .eq("student_id", studentId)
        .order("session_date", { ascending: false }),
    ]);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const [pitchStatsBySession, { data: latestCheckpoint }, avatarUrls] = await Promise.all([
    getPitchStatsBySession(supabase, sessionIds),
    supabase
      .from("training_sessions")
      .select("id, session_date")
      .eq("student_id", studentId)
      .eq("is_checkpoint", true)
      .order("session_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getAvatarUrls(supabase, [profile?.avatar_storage_key ?? null]),
  ]);

  let fastestVelocity: number | null = null;
  let fastestSpinRate: number | null = null;
  for (const stats of pitchStatsBySession.values()) {
    if (stats.velocity != null && (fastestVelocity == null || stats.velocity > fastestVelocity)) {
      fastestVelocity = stats.velocity;
    }
    if (stats.spin != null && (fastestSpinRate == null || stats.spin > fastestSpinRate)) {
      fastestSpinRate = stats.spin;
    }
  }
  const velocityBySession = new Map(
    [...pitchStatsBySession].map(([id, s]) => [id, s.velocity ?? undefined] as const)
  );
  const checkpointFrames = latestCheckpoint
    ? await getCheckpointFramesForSession(supabase, latestCheckpoint.id)
    : [];

  const avatarUrl = profile?.avatar_storage_key ? avatarUrls[profile.avatar_storage_key] ?? null : null;
  const latestMeasurement = measurements?.[0];

  const velocityTrend = (sessions ?? [])
    .slice()
    .reverse()
    .map((s) => {
      const stats = pitchStatsBySession.get(s.id);
      return {
        date: s.session_date,
        max_velocity_kph: stats?.velocity ?? null,
        max_spin_rate_rpm: stats?.spin ?? null,
      };
    })
    .filter((d) => d.max_velocity_kph != null || d.max_spin_rate_rpm != null);

  const growthData = (measurements ?? [])
    .slice()
    .reverse()
    .map((m) => ({ date: m.measured_at, height_cm: m.height_cm, weight_kg: m.weight_kg }));

  return (
    <div className="flex gap-6">
      <StudentRail activeStudentId={studentId} />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-xl font-semibold">{profile?.full_name ?? "學員"}</h1>
          <div className="flex flex-wrap gap-1.5">
            {studentProfile?.position && (
              <Badge variant="outline" className="border-transparent bg-accent text-accent-foreground">
                {positionLabel(studentProfile.position)}
              </Badge>
            )}
            {studentProfile?.dominant_hand && (
              <Badge
                variant="outline"
                className="border-transparent bg-[color-mix(in_oklch,var(--chart-2)_18%,transparent)] text-[color:var(--chart-2)]"
              >
                {dominantHandLabel(studentProfile.dominant_hand)}
              </Badge>
            )}
            {(studentProfile?.school || studentProfile?.team) && (
              <Badge variant="secondary">
                {[studentProfile?.team, studentProfile?.school].filter(Boolean).join(" · ")}
              </Badge>
            )}
          </div>
        </div>
        <Link href={`/coach/students/${studentId}/mechanics-timeline`} className="text-sm underline">
          查看投球機制進步分析 →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="最快球速"
          value={fastestVelocity != null ? String(fastestVelocity) : "-"}
          unit="km/h"
          primary
        />
        <StatCard
          label="最高轉速"
          value={fastestSpinRate != null ? String(fastestSpinRate) : "-"}
          unit="rpm"
        />
        <StatCard
          label="身高 / 體重"
          value={latestMeasurement?.height_cm != null ? String(latestMeasurement.height_cm) : "-"}
          unit={latestMeasurement?.weight_kg != null ? `cm · ${latestMeasurement.weight_kg} kg` : "cm"}
          subtext={latestMeasurement ? `${latestMeasurement.measured_at} 量測` : undefined}
        />
        <StatCard label="累計上課" value={String((sessions ?? []).length)} unit="次" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>球速 / 轉速趨勢</CardTitle>
          </CardHeader>
          <CardContent>
            <VelocityTrendChart data={velocityTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>身高體重成長曲線</CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthChart data={growthData} />
          </CardContent>
        </Card>
      </div>

      {latestCheckpoint && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CardTitle>投球機制關鍵畫面</CardTitle>
              <Badge variant="outline" className="border-transparent bg-accent text-accent-foreground">
                {latestCheckpoint.session_date} 檢核點
              </Badge>
            </div>
            <Link
              href={`/coach/students/${studentId}/mechanics-timeline`}
              className="text-sm font-medium text-primary hover:underline"
            >
              完整時間軸 →
            </Link>
          </CardHeader>
          <CardContent>
            <CheckpointFilmstrip frames={checkpointFrames} />
          </CardContent>
        </Card>
      )}

      <AvatarUploadForm studentId={studentId} avatarUrl={avatarUrl} />

      <StudentProfileForm studentId={studentId} studentProfile={studentProfile} />

      <MeasurementForm studentId={studentId} />

      <div>
        <h2 className="font-heading mb-2 font-medium">身高體重歷史</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>身高 (cm)</TableHead>
              <TableHead>體重 (kg)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(measurements ?? []).map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-numeric tabular-nums">{m.measured_at}</TableCell>
                <TableCell className="font-numeric tabular-nums">{m.height_cm ?? "-"}</TableCell>
                <TableCell className="font-numeric tabular-nums">{m.weight_kg ?? "-"}</TableCell>
              </TableRow>
            ))}
            {(measurements ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground text-center">
                  尚無紀錄
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-heading font-medium">訓練紀錄</h2>
          <Link
            href={`/coach/students/${studentId}/sessions/new`}
            className={buttonVariants({ size: "sm" })}
          >
            新增訓練紀錄
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {(sessions ?? []).map((s) => (
            <SessionListRow
              key={s.id}
              href={`/coach/students/${studentId}/sessions/${s.id}`}
              date={s.session_date}
              menu={s.menu_notes}
              place={s.location}
              veloKph={velocityBySession.get(s.id) ?? null}
            />
          ))}
          {(sessions ?? []).length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">尚無訓練紀錄</p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
