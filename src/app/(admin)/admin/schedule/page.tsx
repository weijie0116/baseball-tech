import { createClient } from "@/lib/supabase/server";
import { todayISODate, getMonthInfo } from "@/lib/date";
import { DateNav } from "@/components/schedule/DateNav";
import { MonthCalendar } from "@/components/schedule/MonthCalendar";
import { ScheduleTable, type ScheduleRow } from "@/components/schedule/ScheduleTable";

export default async function AdminSchedulePage({
  searchParams,
}: PageProps<"/admin/schedule">) {
  const { date: dateParam } = await searchParams;
  const date = typeof dateParam === "string" ? dateParam : todayISODate();
  const monthInfo = getMonthInfo(date);

  const supabase = await createClient();

  const [{ data: monthBookings }, { data: dayBookings }] = await Promise.all([
    supabase
      .from("lesson_bookings")
      .select("scheduled_date")
      .eq("status", "confirmed")
      .gte("scheduled_date", monthInfo.monthStartISO)
      .lte("scheduled_date", monthInfo.monthEndISO),
    supabase
      .from("lesson_bookings")
      .select("id, scheduled_time, student_id, coach_id, status, source")
      .eq("scheduled_date", date)
      .order("scheduled_time", { ascending: true }),
  ]);

  const countsByDate: Record<string, number> = {};
  for (const b of monthBookings ?? []) {
    countsByDate[b.scheduled_date] = (countsByDate[b.scheduled_date] ?? 0) + 1;
  }

  const profileIds = [
    ...new Set((dayBookings ?? []).flatMap((b) => [b.student_id, b.coach_id])),
  ];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const rows: ScheduleRow[] = (dayBookings ?? []).map((b) => ({
    id: b.id,
    student_id: b.student_id,
    scheduled_time: b.scheduled_time,
    student_name: nameById.get(b.student_id) ?? "(未知學員)",
    coach_name: nameById.get(b.coach_id) ?? "(未知教練)",
    status: b.status,
    source: b.source,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-heading text-xl font-semibold">全部課表</h1>
        <DateNav basePath="/admin/schedule" date={date} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        <MonthCalendar basePath="/admin/schedule" date={date} countsByDate={countsByDate} />
        <ScheduleTable rows={rows} showCoach />
      </div>
    </div>
  );
}
