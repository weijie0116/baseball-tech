import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { VelocityTrendChart } from "@/components/charts/VelocityTrendChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: measurements }, { data: sessions }] = await Promise.all([
    supabase
      .from("student_measurements")
      .select("measured_at, height_cm, weight_kg")
      .eq("student_id", user!.id)
      .order("measured_at", { ascending: true }),
    supabase
      .from("training_sessions")
      .select("id, session_date, location, menu_notes")
      .eq("student_id", user!.id)
      .order("session_date", { ascending: false }),
  ]);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: pitches } = sessionIds.length
    ? await supabase
        .from("pitch_metrics")
        .select("session_id, velocity_kph, spin_rate_rpm")
        .in("session_id", sessionIds)
    : { data: [] as { session_id: string; velocity_kph: number | null; spin_rate_rpm: number | null }[] };

  const velocityBySession = new Map<string, { velocity_kph: number | null; spin_rate_rpm: number | null }[]>();
  for (const p of pitches ?? []) {
    const list = velocityBySession.get(p.session_id) ?? [];
    list.push(p);
    velocityBySession.set(p.session_id, list);
  }

  const velocityTrend = (sessions ?? [])
    .slice()
    .reverse()
    .map((s) => {
      const rows = velocityBySession.get(s.id) ?? [];
      const velocities = rows.map((r) => r.velocity_kph).filter((v): v is number => v != null);
      const spins = rows.map((r) => r.spin_rate_rpm).filter((v): v is number => v != null);
      return {
        date: s.session_date,
        max_velocity_kph: velocities.length ? Math.max(...velocities) : null,
        max_spin_rate_rpm: spins.length ? Math.max(...spins) : null,
      };
    })
    .filter((d) => d.max_velocity_kph != null || d.max_spin_rate_rpm != null);

  const growthData = (measurements ?? []).map((m) => ({
    date: m.measured_at,
    height_cm: m.height_cm,
    weight_kg: m.weight_kg,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">總覽</h1>

      <Card>
        <CardHeader>
          <CardTitle>身高體重成長曲線</CardTitle>
        </CardHeader>
        <CardContent>
          <GrowthChart data={growthData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>球速 / 轉速趨勢</CardTitle>
        </CardHeader>
        <CardContent>
          <VelocityTrendChart data={velocityTrend} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 font-medium">訓練紀錄</h2>
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
                  <Link href={`/student/sessions/${s.id}`} className="underline">
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
