import { createClient } from "@/lib/supabase/server";
import { todayISODate, getMonthInfo } from "@/lib/date";
import { DateNav } from "@/components/schedule/DateNav";
import { MonthCalendar } from "@/components/schedule/MonthCalendar";
import { ScheduleTable, type ScheduleRow } from "@/components/schedule/ScheduleTable";

export default async function CoachSchedulePage({
  searchParams,
}: PageProps<"/coach/schedule">) {
  const { date: dateParam } = await searchParams;
  const date = typeof dateParam === "string" ? dateParam : todayISODate();
  const monthInfo = getMonthInfo(date);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: monthBookings }, { data: dayBookings }] = await Promise.all([
    supabase
      .from("lesson_bookings")
      .select("scheduled_date")
      .eq("coach_id", user!.id)
      .eq("status", "confirmed")
      .gte("scheduled_date", monthInfo.monthStartISO)
      .lte("scheduled_date", monthInfo.monthEndISO),
    supabase
      .from("lesson_bookings")
      .select("id, scheduled_time, student_id, status, source")
      .eq("coach_id", user!.id)
      .eq("scheduled_date", date)
      .order("scheduled_time", { ascending: true }),
  ]);

  const countsByDate: Record<string, number> = {};
  for (const b of monthBookings ?? []) {
    countsByDate[b.scheduled_date] = (countsByDate[b.scheduled_date] ?? 0) + 1;
  }

  const studentIds = [...new Set((dayBookings ?? []).map((b) => b.student_id))];
  const { data: students } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  const rows: ScheduleRow[] = (dayBookings ?? []).map((b) => ({
    id: b.id,
    student_id: b.student_id,
    scheduled_time: b.scheduled_time,
    student_name: nameById.get(b.student_id) ?? "(未知學員)",
    status: b.status,
    source: b.source,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">課表</h1>
        <p className="text-muted-foreground text-sm">
          可以用 LINE 傳「預約 學員姓名 教練姓名 日期 時間」(例如「預約 梁維傑 王教練 8/15 14:00」)登記,取消則把「預約」換成「取消」。
        </p>
      </div>
      <MonthCalendar basePath="/coach/schedule" date={date} countsByDate={countsByDate} />
      <DateNav basePath="/coach/schedule" date={date} />
      <ScheduleTable rows={rows} studentLinkBase="/coach/students" />
    </div>
  );
}
