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
  const jerseyNumber = String(formData.get("jersey_number") ?? "").trim();
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
      jersey_number: jerseyNumber || null,
      pitch_types: pitchTypes,
    })
    .eq("student_id", studentId);

  if (error) return { error: error.message };

  revalidatePath(`/coach/students/${studentId}`);
  revalidatePath("/coach/students");
  return { success: true };
}

export async function uploadAvatarAction(
  studentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "請選擇一張照片" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "請上傳圖片檔案" };
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const storageKey = `${studentId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(storageKey, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: `上傳失敗:${uploadError.message}` };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_storage_key: storageKey })
    .eq("id", studentId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/coach/students/${studentId}`);
  revalidatePath("/coach/students");
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
