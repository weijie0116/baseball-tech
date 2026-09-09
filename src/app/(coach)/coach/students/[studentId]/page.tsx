import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAvatarUrls } from "@/lib/avatar";
import { StudentProfileForm } from "./StudentProfileForm";
import { MeasurementForm } from "./MeasurementForm";
import { AvatarUploadForm } from "./AvatarUploadForm";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { StudentRail } from "./StudentRail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getSessionIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
): Promise<string[]> {
  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("id")
    .eq("student_id", studentId);
  return (sessions ?? []).map((s) => s.id);
}

async function getBestPitchMetric(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionIds: string[],
  column: "velocity_kph" | "spin_rate_rpm"
): Promise<number | null> {
  if (sessionIds.length === 0) return null;

  const { data: best } = await supabase
    .from("pitch_metrics")
    .select(column)
    .in("session_id", sessionIds)
    .not(column, "is", null)
    .order(column, { ascending: false })
    .limit(1)
    .maybeSingle();

  return (best as Record<string, number | null> | null)?.[column] ?? null;
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

  const sessionIds = await getSessionIds(supabase, studentId);
  const [fastestVelocity, fastestSpinRate] = await Promise.all([
    getBestPitchMetric(supabase, sessionIds, "velocity_kph"),
    getBestPitchMetric(supabase, sessionIds, "spin_rate_rpm"),
  ]);

  const avatarUrls = await getAvatarUrls(supabase, [profile?.avatar_storage_key ?? null]);
  const avatarUrl = profile?.avatar_storage_key ? avatarUrls[profile.avatar_storage_key] ?? null : null;
  const latestMeasurement = measurements?.[0];

  return (
    <div className="flex gap-6">
      <StudentRail activeStudentId={studentId} />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="font-heading text-xl font-semibold">{profile?.full_name ?? "學員"}</h1>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>地點</TableHead>
              <TableHead>訓練菜單</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sessions ?? []).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-numeric tabular-nums">
                  <Link href={`/coach/students/${studentId}/sessions/${s.id}`} className="underline">
                    {s.session_date}
                  </Link>
                </TableCell>
                <TableCell>{s.location ?? "-"}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {s.menu_notes ?? "-"}
                </TableCell>
              </TableRow>
            ))}
            {(sessions ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground text-center">
                  尚無訓練紀錄
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      </div>
    </div>
  );
}
