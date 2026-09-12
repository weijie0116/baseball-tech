import Link from "next/link";
import type { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/currentUser";
import { getAvatarUrls } from "@/lib/avatar";
import { StudentRailList } from "./StudentRailList";
import { CreateStudentForm } from "../CreateStudentForm";

async function getRoster(supabase: Awaited<ReturnType<typeof createClient>>, isAdmin: boolean, coachId: string) {
  const studentProfilesQuery = supabase
    .from("student_profiles")
    .select("student_id, position, jersey_number");
  const { data: studentProfiles } = await (isAdmin
    ? studentProfilesQuery
    : studentProfilesQuery.eq("coach_id", coachId));

  const studentIds = (studentProfiles ?? []).map((s) => s.student_id);
  if (studentIds.length === 0) return [];

  const [{ data: profiles }, { data: sessions }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_storage_key").in("id", studentIds),
    supabase.from("training_sessions").select("id, student_id").in("student_id", studentIds),
  ]);

  const studentIdBySession = new Map((sessions ?? []).map((s) => [s.id, s.student_id]));
  const sessionIds = (sessions ?? []).map((s) => s.id);
  const fastestBySession = new Map<string, number>();
  if (sessionIds.length) {
    const { data: pitches } = await supabase
      .from("pitch_metrics")
      .select("session_id, velocity_kph")
      .in("session_id", sessionIds)
      .not("velocity_kph", "is", null);
    for (const p of pitches ?? []) {
      const studentId = studentIdBySession.get(p.session_id);
      if (!studentId || p.velocity_kph == null) continue;
      const current = fastestBySession.get(studentId);
      if (current == null || p.velocity_kph > current) fastestBySession.set(studentId, p.velocity_kph);
    }
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const avatarUrls = await getAvatarUrls(supabase, (profiles ?? []).map((p) => p.avatar_storage_key));

  return (studentProfiles ?? [])
    .map((sp) => {
      const profile = profileById.get(sp.student_id);
      return {
        id: sp.student_id,
        full_name: profile?.full_name ?? "(未命名)",
        avatar_url: profile?.avatar_storage_key ? avatarUrls[profile.avatar_storage_key] ?? null : null,
        position: sp.position,
        jersey_number: sp.jersey_number,
        fastest_velocity_kph: fastestBySession.get(sp.student_id) ?? null,
      };
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "zh-Hant"));
}

export async function StudentRail({ activeStudentId }: { activeStudentId: string }) {
  const { supabase, user, profile: callerProfile } = await getCurrentUserProfile();
  const isAdmin = callerProfile?.role === "admin";

  const roster = await getRoster(supabase, isAdmin, user!.id);

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-3 lg:flex">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{isAdmin ? "所有學員" : "我的學員"}</span>
        <span className="text-xs text-muted-foreground">{roster.length} 位</span>
      </div>
      <StudentRailList roster={roster} activeStudentId={activeStudentId} />
      {isAdmin ? (
        <Link
          href="/coach/students"
          className="rounded-lg border border-dashed p-2.5 text-center text-xs text-primary hover:bg-muted"
        >
          查看完整清單 →
        </Link>
      ) : (
        <CreateStudentForm />
      )}
    </aside>
  );
}
