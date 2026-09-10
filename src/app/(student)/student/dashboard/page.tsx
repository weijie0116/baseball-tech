import { createClient } from "@/lib/supabase/server";
import { todayISODate, formatDateLabel } from "@/lib/date";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { VelocityTrendChart } from "@/components/charts/VelocityTrendChart";
import { SessionListRow } from "@/components/SessionListRow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = todayISODate();

  const [{ data: profile }, { data: measurements }, { data: sessions }, { data: nextBooking }] =
    await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
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
      supabase
        .from("lesson_bookings")
        .select("scheduled_date, scheduled_time, notes")
        .eq("student_id", user!.id)
        .eq("status", "confirmed")
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true })
        .limit(1)
        .maybeSingle(),
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

  const fastestVelocityBySession = new Map<string, number>();
  for (const [sessionId, rows] of velocityBySession) {
    const velocities = rows.map((r) => r.velocity_kph).filter((v): v is number => v != null);
    if (velocities.length) fastestVelocityBySession.set(sessionId, Math.max(...velocities));
  }

  const allVelocities = (pitches ?? []).map((p) => p.velocity_kph).filter((v): v is number => v != null);
  const allSpins = (pitches ?? []).map((p) => p.spin_rate_rpm).filter((v): v is number => v != null);
  const fastestVelocity = allVelocities.length ? Math.max(...allVelocities) : null;
  const fastestSpinRate = allSpins.length ? Math.max(...allSpins) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-primary-foreground/80">嗨,{profile?.full_name ?? "你好"}</span>
          <h1 className="font-heading text-2xl font-bold">總覽</h1>
          {nextBooking ? (
            <span className="text-sm text-primary-foreground/85">
              下一堂課:{formatDateLabel(nextBooking.scheduled_date)}{" "}
              {nextBooking.scheduled_time.slice(0, 5)}
              {nextBooking.notes ? ` · ${nextBooking.notes}` : ""}
            </span>
          ) : (
            <span className="text-sm text-primary-foreground/85">目前沒有已排定的課程</span>
          )}
        </div>
        <div className="flex gap-6">
          <div>
            <div className="text-xs text-primary-foreground/80">最快球速</div>
            <div className="font-numeric text-3xl font-bold tabular-nums">
              {fastestVelocity ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-xs text-primary-foreground/80">最高轉速</div>
            <div className="font-numeric text-3xl font-bold tabular-nums">
              {fastestSpinRate ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-xs text-primary-foreground/80">累計上課</div>
            <div className="font-numeric text-3xl font-bold tabular-nums">
              {(sessions ?? []).length}
            </div>
          </div>
        </div>
      </div>

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
        <h2 className="font-heading mb-2 font-medium">訓練紀錄</h2>
        <div className="flex flex-col gap-2">
          {(sessions ?? []).map((s) => (
            <SessionListRow
              key={s.id}
              href={`/student/sessions/${s.id}`}
              date={s.session_date}
              menu={s.menu_notes}
              place={s.location}
              veloKph={fastestVelocityBySession.get(s.id) ?? null}
            />
          ))}
          {(sessions ?? []).length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">尚無訓練紀錄</p>
          )}
        </div>
      </div>
    </div>
  );
}
