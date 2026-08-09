"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateSessionState = { error?: string };

export async function createSessionAction(
  studentId: string,
  _prevState: CreateSessionState,
  formData: FormData
): Promise<CreateSessionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  const sessionDate = String(formData.get("session_date") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const menuNotes = String(formData.get("menu_notes") ?? "").trim();
  const generalNotes = String(formData.get("general_notes") ?? "").trim();

  const { data, error } = await supabase
    .from("training_sessions")
    .insert({
      student_id: studentId,
      coach_id: user.id,
      session_date: sessionDate || new Date().toISOString().slice(0, 10),
      location: location || null,
      menu_notes: menuNotes || null,
      general_notes: generalNotes || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "建立失敗" };
  }

  redirect(`/coach/students/${studentId}/sessions/${data.id}`);
}
