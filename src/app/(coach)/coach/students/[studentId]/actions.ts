"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: boolean };

export async function updateStudentProfileAction(
  studentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const birthDate = String(formData.get("birth_date") ?? "").trim();
  const dominantHandRaw = String(formData.get("dominant_hand") ?? "").trim();
  const dominantHand = dominantHandRaw === "left" || dominantHandRaw === "right" ? dominantHandRaw : null;
  const notes = String(formData.get("notes") ?? "").trim();
  const school = String(formData.get("school") ?? "").trim();
  const team = String(formData.get("team") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const pitchTypes = formData.getAll("pitch_types").map(String);

  const { error } = await supabase
    .from("student_profiles")
    .update({
      birth_date: birthDate || null,
      dominant_hand: dominantHand,
      notes: notes || null,
      school: school || null,
      team: team || null,
      position: position || null,
      pitch_types: pitchTypes,
    })
    .eq("student_id", studentId);

  if (error) return { error: error.message };

  revalidatePath(`/coach/students/${studentId}`);
  return { success: true };
}

export async function addMeasurementAction(
  studentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const heightCm = String(formData.get("height_cm") ?? "").trim();
  const weightKg = String(formData.get("weight_kg") ?? "").trim();
  const measuredAt = String(formData.get("measured_at") ?? "").trim();

  if (!heightCm && !weightKg) {
    return { error: "身高、體重至少填一項" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("student_measurements").insert({
    student_id: studentId,
    measured_at: measuredAt || new Date().toISOString().slice(0, 10),
    height_cm: heightCm ? Number(heightCm) : null,
    weight_kg: weightKg ? Number(weightKg) : null,
    recorded_by: user?.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/coach/students/${studentId}`);
  return { success: true };
}
