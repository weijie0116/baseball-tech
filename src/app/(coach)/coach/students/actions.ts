"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateTempPassword() {
  return randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 10);
}

export type CreateStudentState = { error?: string; success?: { email: string; tempPassword: string } };

export async function createStudentAction(
  _prevState: CreateStudentState,
  formData: FormData
): Promise<CreateStudentState> {
  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller) return { error: "未登入" };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", caller.id)
    .single();
  if (callerProfile?.role !== "coach") {
    return { error: "只有教練能執行這個操作" };
  }

  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !fullName) {
    return { error: "請填寫完整資料" };
  }

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: `建立帳號失敗:${createError?.message ?? "未知錯誤"}` };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: fullName,
    role: "student",
    is_active: true,
  });
  if (profileError) {
    return { error: `建立基本資料失敗:${profileError.message}` };
  }

  const { error: studentError } = await admin.from("student_profiles").insert({
    student_id: created.user.id,
    coach_id: caller.id,
  });
  if (studentError) {
    return { error: `建立學員資料失敗:${studentError.message}` };
  }

  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (admins?.length) {
    await admin.from("notifications").insert(
      admins.map((a) => ({
        recipient_id: a.id,
        type: "student_created",
        title: "教練新增了一位學員",
        body: `${callerProfile.full_name} 新增了學員「${fullName}」`,
        link_path: "/admin/users",
      }))
    );
  }

  revalidatePath("/coach/students");
  return { success: { email, tempPassword } };
}
