import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StudentProfileForm } from "./StudentProfileForm";
import { MeasurementForm } from "./MeasurementForm";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getFastestVelocity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
): Promise<number | null> {
  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("id")
    .eq("student_id", studentId);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return null;

  const { data: fastest } = await supabase
    .from("pitch_metrics")
    .select("velocity_kph")
    .in("session_id", sessionIds)
    .not("velocity_kph", "is", null)
    .order("velocity_kph", { ascending: false })
    .limit(1)
    .maybeSingle();

  return fastest?.velocity_kph ?? null;
}

export default async function CoachStudentDetailPage({
  params,
}: PageProps<"/coach/students/[studentId]">) {
  const { studentId } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: studentProfile }, { data: measurements }, fastestVelocity, { data: sessions }] =
    await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", studentId).single(),
      supabase
        .from("student_profiles")
        .select("birth_date, dominant_hand, notes, school, team, position, pitch_types")
        .eq("student_id", studentId)
        .single(),
      supabase
        .from("student_measurements")
        .select("id, measured_at, height_cm, weight_kg")
        .eq("student_id", studentId)
        .order("measured_at", { ascending: false }),
      getFastestVelocity(supabase, studentId),
      supabase
        .from("training_sessions")
        .select("id, session_date, location, menu_notes")
        .eq("student_id", studentId)
        .order("session_date", { ascending: false }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-4">
        <h1 className="text-xl font-semibold">{profile?.full_name ?? "學員"}</h1>
        <span className="text-sm text-muted-foreground">
          最快球速:{fastestVelocity != null ? `${fastestVelocity} km/h` : "尚無投球數據"}
        </span>
      </div>

      <StudentProfileForm studentId={studentId} studentProfile={studentProfile} />

      <MeasurementForm studentId={studentId} />

      <div>
        <h2 className="mb-2 font-medium">身高體重歷史</h2>
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
                <TableCell>{m.measured_at}</TableCell>
                <TableCell>{m.height_cm ?? "-"}</TableCell>
                <TableCell>{m.weight_kg ?? "-"}</TableCell>
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
          <h2 className="font-medium">訓練紀錄</h2>
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
                <TableCell>
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
  );
}
