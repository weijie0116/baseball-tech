"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: boolean };

export async function addPitchMetricAction(
  studentId: string,
  sessionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const pitchNumber = String(formData.get("pitch_number") ?? "").trim();
  const pitchType = String(formData.get("pitch_type") ?? "").trim();
  const velocityKph = String(formData.get("velocity_kph") ?? "").trim();
  const spinRateRpm = String(formData.get("spin_rate_rpm") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!velocityKph && !spinRateRpm && !pitchType) {
    return { error: "球種、球速、轉速至少填一項" };
  }

  const { error } = await supabase.from("pitch_metrics").insert({
    session_id: sessionId,
    pitch_number: pitchNumber ? Number(pitchNumber) : null,
    pitch_type: pitchType || null,
    velocity_kph: velocityKph ? Number(velocityKph) : null,
    spin_rate_rpm: spinRateRpm ? Number(spinRateRpm) : null,
    notes: notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/coach/students/${studentId}/sessions/${sessionId}`);
  return { success: true };
}

export async function deletePitchMetricAction(
  studentId: string,
  sessionId: string,
  pitchMetricId: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from("pitch_metrics").delete().eq("id", pitchMetricId);
  if (error) throw new Error(error.message);
  revalidatePath(`/coach/students/${studentId}/sessions/${sessionId}`);
}
