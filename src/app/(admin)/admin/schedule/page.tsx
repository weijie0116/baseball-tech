import { createClient } from "@/lib/supabase/server";
import { todayISODate } from "@/lib/date";
import { DateNav } from "@/components/schedule/DateNav";
import { ScheduleTable, type ScheduleRow } from "@/components/schedule/ScheduleTable";

export default async function AdminSchedulePage({
  searchParams,
}: PageProps<"/admin/schedule">) {
  const { date: dateParam } = await searchParams;
  const date = typeof dateParam === "string" ? dateParam : todayISODate();

  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("lesson_bookings")
    .select("id, scheduled_time, student_id, coach_id, status, source")
    .eq("scheduled_date", date)
    .order("scheduled_time", { ascending: true });

  const profileIds = [
    ...new Set((bookings ?? []).flatMap((b) => [b.student_id, b.coach_id])),
  ];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const rows: ScheduleRow[] = (bookings ?? []).map((b) => ({
    id: b.id,
    scheduled_time: b.scheduled_time,
    student_name: nameById.get(b.student_id) ?? "(未知學員)",
    coach_name: nameById.get(b.coach_id) ?? "(未知教練)",
    status: b.status,
    source: b.source,
  }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">全部課表</h1>
      <DateNav basePath="/admin/schedule" date={date} />
      <ScheduleTable rows={rows} showCoach />
    </div>
  );
}
