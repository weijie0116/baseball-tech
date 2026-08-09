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

export async function addVideoLinkAction(
  studentId: string,
  sessionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const shareUrl = String(formData.get("storage_path") ?? "").trim();
  const password = String(formData.get("share_password") ?? "").trim();
  const fileName = String(formData.get("file_name") ?? "").trim();

  if (!shareUrl) {
    return { error: "請貼上 NAS 分享連結" };
  }
  if (!/^https?:\/\//.test(shareUrl)) {
    return { error: "看起來不是有效的網址" };
  }

  const { error } = await supabase.from("session_videos").insert({
    session_id: sessionId,
    storage_location: "nas",
    storage_path: shareUrl,
    share_password: password || null,
    file_name: fileName || null,
    uploaded_by: user?.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/coach/students/${studentId}/sessions/${sessionId}`);
  revalidatePath(`/student/sessions/${sessionId}`);
  return { success: true };
}

export async function deleteVideoLinkAction(studentId: string, sessionId: string, videoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("session_videos").delete().eq("id", videoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/coach/students/${studentId}/sessions/${sessionId}`);
  revalidatePath(`/student/sessions/${sessionId}`);
}

export async function setCheckpointAction(
  studentId: string,
  sessionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const isCheckpoint = formData.get("is_checkpoint") === "on";
  const phaseLabel = String(formData.get("checkpoint_phase_label") ?? "").trim();
  const analysisNotes = String(formData.get("mechanics_analysis_notes") ?? "").trim();

  const { error } = await supabase
    .from("training_sessions")
    .update({
      is_checkpoint: isCheckpoint,
      checkpoint_phase_label: phaseLabel || null,
      mechanics_analysis_notes: analysisNotes || null,
    })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  revalidatePath(`/coach/students/${studentId}/sessions/${sessionId}`);
  revalidatePath("/student/mechanics-timeline");
  return { success: true };
}
