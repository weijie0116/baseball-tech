"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database.types";

async function assertCallerIsAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("只有管理者能執行這個操作");
}

export type CreateUserState = { error?: string; success?: boolean };

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  await assertCallerIsAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as UserRole;
  const coachId = String(formData.get("coach_id") ?? "").trim();

  if (!email || !password || !fullName || !role) {
    return { error: "請填寫完整資料" };
  }
  if (password.length < 6) {
    return { error: "密碼至少 6 個字元" };
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: `建立帳號失敗:${createError?.message ?? "未知錯誤"}` };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: fullName,
    role,
    is_active: true,
  });

  if (profileError) {
    return { error: `建立基本資料失敗:${profileError.message}` };
  }

  if (role === "student") {
    const { error: studentError } = await admin.from("student_profiles").insert({
      student_id: created.user.id,
      coach_id: coachId || null,
    });
    if (studentError) {
      return { error: `建立學員資料失敗:${studentError.message}` };
    }
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export type ResetPasswordState = { success?: boolean; error?: string };

export async function resetPasswordAction(
  userId: string,
  password: string
): Promise<ResetPasswordState> {
  await assertCallerIsAdmin();
  if (password.length < 6) return { error: "密碼至少 6 個字元" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: `重設密碼失敗:${error.message}` };
  return { success: true };
}

export async function setUserActiveAction(userId: string, isActive: boolean) {
  await assertCallerIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function markNotificationReadAction(notificationId: string) {
  await assertCallerIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}
