import { createClient } from "@/lib/supabase/server";
import { getAvatarUrls } from "@/lib/avatar";
import { StudentCard } from "@/components/StudentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateStudentForm } from "./CreateStudentForm";

export default async function CoachStudentsPage({
  searchParams,
}: PageProps<"/coach/students">) {
  const { q: qParam } = await searchParams;
  const q = typeof qParam === "string" ? qParam.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: studentProfiles } = await supabase
    .from("student_profiles")
    .select("student_id, school, team, position, jersey_number")
    .eq("coach_id", user!.id);

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

  const filteredQuery = q.toLowerCase();
  const students = (studentProfiles ?? [])
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
      };
    })
    .filter((s) => !filteredQuery || s.full_name.toLowerCase().includes(filteredQuery))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "zh-Hant"));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">我的學員</h1>
        <p className="text-muted-foreground text-sm">點卡片查看/編輯詳細資料。</p>
      </div>

      <CreateStudentForm />

      <form className="flex gap-2">
        <Input name="q" placeholder="搜尋學員姓名..." defaultValue={q} className="max-w-xs" />
        <Button type="submit" variant="outline" size="sm">
          搜尋
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {students.map((s) => (
          <StudentCard key={s.id} student={s} href={`/coach/students/${s.id}`} />
        ))}
      </div>

      {students.length === 0 && (
        <p className="text-muted-foreground text-center">
          {q ? `找不到符合「${q}」的學員。` : "目前還沒有指派給你的學員,請管理者指派。"}
        </p>
      )}
    </div>
  );
}
