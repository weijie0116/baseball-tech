import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { replyMessage } from "@/lib/line";
import type { UserRole } from "@/types/database.types";

// LINE Messaging API webhook. This can only do what a stateless HTTP
// request allows: verify + log what came in and send a quick reply. Video
// analysis needs Claude Code running locally with NAS access and visual
// judgment, so video messages are recorded as pending requests here and
// processed later — see the pitching-mechanics-analysis skill's "Scanning
// for new uploads" section, extended to also check line_video_requests.
//
// Flow: coach sends the student's name as a text message first (matched
// against profiles.full_name), which is remembered in line_pending_context
// for a short window; the video message that follows gets tied to that
// student.

const CONTEXT_TTL_MINUTES = 30;

function isValidSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", process.env.LINE_CHANNEL_SECRET!)
    .update(rawBody)
    .digest("base64");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { type: string; userId?: string };
  message?: { id: string; type: string; text?: string };
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as { events: LineEvent[] };
  const admin = createAdminClient();

  for (const event of body.events ?? []) {
    try {
      await handleEvent(admin, event);
    } catch (err) {
      // One bad event shouldn't fail the whole webhook delivery (LINE will
      // retry on non-2xx responses, which could double-process others).
      console.error("line-webhook event error", err);
    }
  }

  return NextResponse.json({ ok: true });
}

// "預約 梁維傑 王教練 8/15 14:00" / "取消 梁維傑 王教練 8/15 14:00" —
// student name, then coach name (so the same command works once there's
// more than one coach), then date/time.
const BOOKING_RE = /^預約\s+(\S+)\s+(\S+)\s+(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/;
const CANCEL_RE = /^取消\s+(\S+)\s+(\S+)\s+(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/;
const HELP_RE = /^(說明|指令|help|幫助|\?)$/i;

const HELP_TEXT = `可以用的指令:
・傳學員姓名(例如「梁維傑」)→ 之後傳的影片會歸到這位學員
・傳影片(要先傳過學員姓名)
・預約 學員 教練 M/D HH:MM(例如「預約 梁維傑 王教練 8/15 14:00」)
・取消 學員 教練 M/D HH:MM(例如「取消 梁維傑 王教練 8/15 14:00」)
・傳「說明」隨時看這則訊息`;

const BOOKING_FORMAT_HINT = "格式:預約 學員 教練 M/D HH:MM(例如「預約 梁維傑 王教練 8/15 14:00」)";
const CANCEL_FORMAT_HINT = "格式:取消 學員 教練 M/D HH:MM(例如「取消 梁維傑 王教練 8/15 14:00」)";

type ProfileLookup =
  | { ok: true; profile: { id: string; full_name: string } }
  | { ok: false; replyText: string };

const ROLE_LABEL: Record<UserRole, string> = { admin: "管理者", coach: "教練", student: "學員" };

async function resolveProfileByRole(
  admin: ReturnType<typeof createAdminClient>,
  role: UserRole,
  nameText: string
): Promise<ProfileLookup> {
  const { data: matches } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("role", role)
    .ilike("full_name", `%${nameText}%`);

  const label = ROLE_LABEL[role];
  if (!matches || matches.length === 0) {
    return { ok: false, replyText: `找不到叫「${nameText}」的${label},請確認姓名後再傳一次。` };
  }
  if (matches.length > 1) {
    const names = matches.map((m) => m.full_name).join("、");
    return { ok: false, replyText: `找到多位符合的${label}(${names}),請傳更完整的姓名。` };
  }
  return { ok: true, profile: matches[0] };
}

async function handleEvent(admin: ReturnType<typeof createAdminClient>, event: LineEvent) {
  if (event.type !== "message" || !event.source?.userId || !event.message) return;

  const lineUserId = event.source.userId;
  const replyToken = event.replyToken;

  if (event.message.type === "text" && event.message.text) {
    const text = event.message.text.trim();

    if (HELP_RE.test(text)) {
      if (replyToken) await replyMessage(replyToken, HELP_TEXT);
      return;
    }

    const bookingMatch = text.match(BOOKING_RE);
    if (bookingMatch) {
      await handleBooking(admin, lineUserId, replyToken, bookingMatch);
      return;
    }
    // Looks like an attempted booking command but didn't match the exact
    // format (e.g. missing the coach name, wrong date shape) — say so
    // directly instead of falling through to "student not found", which
    // would be a confusing error for what's actually a format mistake.
    if (text.startsWith("預約")) {
      if (replyToken) await replyMessage(replyToken, BOOKING_FORMAT_HINT);
      return;
    }

    const cancelMatch = text.match(CANCEL_RE);
    if (cancelMatch) {
      await handleCancelBooking(admin, replyToken, cancelMatch);
      return;
    }
    if (text.startsWith("取消")) {
      if (replyToken) await replyMessage(replyToken, CANCEL_FORMAT_HINT);
      return;
    }

    const lookup = await resolveProfileByRole(admin, "student", text);
    if (!lookup.ok) {
      if (replyToken) await replyMessage(replyToken, `${lookup.replyText}\n\n(傳「說明」可以看所有指令格式)`);
      return;
    }
    const student = lookup.profile;
    await admin
      .from("line_pending_context")
      .upsert({ line_user_id: lineUserId, student_id: student.id, updated_at: new Date().toISOString() });

    if (replyToken) {
      await replyMessage(replyToken, `已記錄,接下來傳的影片會歸到「${student.full_name}」名下。`);
    }
    return;
  }

  if (event.message.type === "video") {
    const { data: context } = await admin
      .from("line_pending_context")
      .select("student_id, updated_at")
      .eq("line_user_id", lineUserId)
      .single();

    const isRecent =
      context && Date.now() - new Date(context.updated_at).getTime() < CONTEXT_TTL_MINUTES * 60 * 1000;

    if (!context || !isRecent) {
      if (replyToken) {
        await replyMessage(replyToken, "請先傳學員姓名,再傳影片(例如先傳「梁維傑」)。");
      }
      return;
    }

    const { data: student } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", context.student_id)
      .single();

    await admin.from("line_video_requests").insert({
      line_user_id: lineUserId,
      line_message_id: event.message.id,
      student_id: context.student_id,
      student_name_hint: student?.full_name ?? null,
    });

    if (replyToken) {
      await replyMessage(replyToken, `已收到「${student?.full_name ?? "該學員"}」的影片,會盡快處理分析。`);
    }
  }
}

function resolveBookingDate(month: number, day: number): string {
  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(year, month - 1, day);
  // "8/15" typed in December should mean next year's Aug 15, not one that
  // already passed months ago — roll forward if the date is more than a
  // month in the past.
  const oneMonthMs = 31 * 24 * 60 * 60 * 1000;
  if (candidate.getTime() < now.getTime() - oneMonthMs) {
    year += 1;
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

async function handleBooking(
  admin: ReturnType<typeof createAdminClient>,
  lineUserId: string,
  replyToken: string | undefined,
  match: RegExpMatchArray
) {
  const [, studentName, coachName, monthStr, dayStr, hourStr, minuteStr] = match;

  const studentLookup = await resolveProfileByRole(admin, "student", studentName);
  if (!studentLookup.ok) {
    if (replyToken) await replyMessage(replyToken, studentLookup.replyText);
    return;
  }
  const coachLookup = await resolveProfileByRole(admin, "coach", coachName);
  if (!coachLookup.ok) {
    if (replyToken) await replyMessage(replyToken, coachLookup.replyText);
    return;
  }
  const student = studentLookup.profile;
  const coach = coachLookup.profile;

  const scheduledDate = resolveBookingDate(Number(monthStr), Number(dayStr));
  const scheduledTime = `${hourStr.padStart(2, "0")}:${minuteStr}`;

  const { error } = await admin.from("lesson_bookings").insert({
    student_id: student.id,
    coach_id: coach.id,
    scheduled_date: scheduledDate,
    scheduled_time: scheduledTime,
    source: "line",
    line_user_id: lineUserId,
  });

  if (error) {
    if (replyToken) await replyMessage(replyToken, `預約失敗:${error.message}`);
    return;
  }

  if (replyToken) {
    await replyMessage(
      replyToken,
      `已預約:${student.full_name}(教練:${coach.full_name}) ${scheduledDate} ${scheduledTime}`
    );
  }
}

async function handleCancelBooking(
  admin: ReturnType<typeof createAdminClient>,
  replyToken: string | undefined,
  match: RegExpMatchArray
) {
  const [, studentName, coachName, monthStr, dayStr, hourStr, minuteStr] = match;

  const studentLookup = await resolveProfileByRole(admin, "student", studentName);
  if (!studentLookup.ok) {
    if (replyToken) await replyMessage(replyToken, studentLookup.replyText);
    return;
  }
  const coachLookup = await resolveProfileByRole(admin, "coach", coachName);
  if (!coachLookup.ok) {
    if (replyToken) await replyMessage(replyToken, coachLookup.replyText);
    return;
  }
  const student = studentLookup.profile;
  const coach = coachLookup.profile;

  const scheduledDate = resolveBookingDate(Number(monthStr), Number(dayStr));
  const scheduledTime = `${hourStr.padStart(2, "0")}:${minuteStr}`;

  const { data: updated, error } = await admin
    .from("lesson_bookings")
    .update({ status: "cancelled" })
    .eq("student_id", student.id)
    .eq("coach_id", coach.id)
    .eq("scheduled_date", scheduledDate)
    .eq("scheduled_time", scheduledTime)
    .eq("status", "confirmed")
    .select("id");

  if (error) {
    if (replyToken) await replyMessage(replyToken, `取消失敗:${error.message}`);
    return;
  }

  if (!updated || updated.length === 0) {
    if (replyToken) {
      await replyMessage(
        replyToken,
        `找不到「${student.full_name}(教練:${coach.full_name}) ${scheduledDate} ${scheduledTime}」這筆預約(可能已經取消或時間不符)。`
      );
    }
    return;
  }

  if (replyToken) {
    await replyMessage(
      replyToken,
      `已取消:${student.full_name}(教練:${coach.full_name}) ${scheduledDate} ${scheduledTime}`
    );
  }
}
