import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAvatarUrls } from "@/lib/avatar";
import { StudentCard } from "@/components/StudentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateStudentForm } from "./CreateStudentForm";

export default async function CoachStudentsPage({
  searchParams,
}: PageProps<"/coach/students">) {
  const { q: qParam, pos: posParam } = await searchParams;
  const q = typeof qParam === "string" ? qParam.trim() : "";
  const pos = typeof posParam === "string" ? posParam : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  const isAdmin = callerProfile?.role === "admin";

  // Admin browsing this page sees every student (RLS already grants full
  // access); a coach only sees their own assigned students.
  const studentProfilesQuery = supabase
    .from("student_profiles")
    .select("student_id, school, team, position, jersey_number");
  const { data: studentProfiles } = await (isAdmin
    ? studentProfilesQuery
    : studentProfilesQuery.eq("coach_id", user!.id));

  const studentIds = (studentProfiles ?? []).map((s) => s.student_id);
  const { data: profiles } = studentIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_storage_key")
        .in("id", studentIds)
    : { data: [] as { id: string; full_name: string; avatar_storage_key: string | null }[] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const avatarUrls = await getAvatarUrls(
    supabase,
    (profiles ?? []).map((p) => p.avatar_storage_key)
  );

  // Batch-compute each student's fastest recorded velocity for the roster
  // card footer (mirrors the single-student query in the detail page, but
  // done once for the whole list instead of N+1 queries).
  const fastestVelocityByStudent = new Map<string, number>();
  if (studentIds.length) {
    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("id, student_id")
      .in("student_id", studentIds);
    const studentIdBySession = new Map((sessions ?? []).map((s) => [s.id, s.student_id]));
    const sessionIds = (sessions ?? []).map((s) => s.id);
    if (sessionIds.length) {
      const { data: pitches } = await supabase
        .from("pitch_metrics")
        .select("session_id, velocity_kph")
        .in("session_id", sessionIds)
        .not("velocity_kph", "is", null);
      for (const p of pitches ?? []) {
        const studentId = studentIdBySession.get(p.session_id);
        if (!studentId || p.velocity_kph == null) continue;
        const current = fastestVelocityByStudent.get(studentId);
        if (current == null || p.velocity_kph > current) {
          fastestVelocityByStudent.set(studentId, p.velocity_kph);
        }
      }
    }
  }

  const filteredQuery = q.toLowerCase();
  const allStudents = (studentProfiles ?? [])
    .map((sp) => {
      const profile = profileById.get(sp.student_id);
      return {
        id: sp.student_id,
        full_name: profile?.full_name ?? "(未命名)",
        avatar_url: profile?.avatar_storage_key ? avatarUrls[profile.avatar_storage_key] ?? null : null,
        school: sp.school,
        team: sp.team,
        position: sp.position,
        jersey_number: sp.jersey_number,
        fastest_velocity_kph: fastestVelocityByStudent.get(sp.student_id) ?? null,
      };
    })
    .filter((s) => !filteredQuery || s.full_name.toLowerCase().includes(filteredQuery))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "zh-Hant"));

  const pitcherCount = allStudents.filter((s) => s.position === "P").length;
  const fielderCount = allStudents.length - pitcherCount;
  const students = allStudents.filter((s) =>
    pos === "all" ? true : pos === "P" ? s.position === "P" : s.position !== "P"
  );

  const filters = [
    { key: "all", label: "全部", count: allStudents.length },
    { key: "P", label: "投手", count: pitcherCount },
    { key: "F", label: "野手", count: fielderCount },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {isAdmin ? "所有學員" : "我的學員"}
          </h1>
          <p className="text-muted-foreground pt-1 text-sm">點卡片查看或編輯詳細資料。</p>
        </div>
        <div className="flex items-center gap-2">
          <form className="flex gap-2">
            {pos !== "all" && <input type="hidden" name="pos" value={pos} />}
            <Input
              name="q"
              placeholder="搜尋學員姓名…"
              defaultValue={q}
              className="w-[200px]"
            />
            <Button type="submit" variant="outline" size="sm">
              搜尋
            </Button>
          </form>
          {!isAdmin && <CreateStudentForm />}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {filters.map((f) => {
          const isActive = pos === f.key;
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (f.key !== "all") params.set("pos", f.key);
          const href = params.toString()
            ? `/coach/students?${params.toString()}`
            : "/coach/students";
          return (
            <Link
              key={f.key}
              href={href}
              className={cn(
                "rounded-full px-3 py-1.5 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border hover:border-primary"
              )}
            >
              {f.label} {f.count}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {students.map((s) => (
          <StudentCard key={s.id} student={s} href={`/coach/students/${s.id}`} />
        ))}
      </div>

      {students.length === 0 && (
        <p className="text-muted-foreground py-8 text-center">
          {q
            ? `找不到符合「${q}」的學員。`
            : isAdmin
              ? "目前系統裡還沒有任何學員帳號。"
              : "目前還沒有指派給你的學員,請管理者指派。"}
        </p>
      )}
    </div>
  );
}
