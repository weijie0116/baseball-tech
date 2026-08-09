import { createClient } from "@/lib/supabase/server";
import { todayISODate } from "@/lib/date";
import { DateNav } from "@/components/schedule/DateNav";
import { ScheduleTable, type ScheduleRow } from "@/components/schedule/ScheduleTable";

export default async function CoachSchedulePage({
  searchParams,
}: PageProps<"/coach/schedule">) {
  const { date: dateParam } = await searchParams;
  const date = typeof dateParam === "string" ? dateParam : todayISODate();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from("lesson_bookings")
    .select("id, scheduled_time, student_id, status, source")
    .eq("coach_id", user!.id)
    .eq("scheduled_date", date)
    .order("scheduled_time", { ascending: true });

  const studentIds = [...new Set((bookings ?? []).map((b) => b.student_id))];
  const { data: students } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  const rows: ScheduleRow[] = (bookings ?? []).map((b) => ({
    id: b.id,
    scheduled_time: b.scheduled_time,
    student_name: nameById.get(b.student_id) ?? "(未知學員)",
    status: b.status,
    source: b.source,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">今日課表</h1>
        <p className="text-muted-foreground text-sm">
          可以用 LINE 傳「預約 學員姓名 日期 時間」(例如「預約 梁維傑 8/15 14:00」)登記。
        </p>
      </div>
      <DateNav basePath="/coach/schedule" date={date} />
      <ScheduleTable rows={rows} />
    </div>
  );
}
