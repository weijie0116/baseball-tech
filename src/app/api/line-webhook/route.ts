import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { replyMessage } from "@/lib/line";

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

// "預約 梁維傑 8/15 14:00" — coach books a lesson slot on a student's
// behalf, sent from the same LINE account used for video submission.
const BOOKING_RE = /^預約\s+(\S+)\s+(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/;

async function handleEvent(admin: ReturnType<typeof createAdminClient>, event: LineEvent) {
  if (event.type !== "message" || !event.source?.userId || !event.message) return;

  const lineUserId = event.source.userId;
  const replyToken = event.replyToken;

  if (event.message.type === "text" && event.message.text) {
    const text = event.message.text.trim();
    const bookingMatch = text.match(BOOKING_RE);

    if (bookingMatch) {
      await handleBooking(admin, lineUserId, replyToken, bookingMatch);
      return;
    }

    const { data: students } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("role", "student")
      .ilike("full_name", `%${text}%`);

    if (!students || students.length === 0) {
      if (replyToken) await replyMessage(replyToken, `找不到叫「${text}」的學員,請確認姓名後再傳一次。`);
      return;
    }
    if (students.length > 1) {
      const names = students.map((s) => s.full_name).join("、");
      if (replyToken) await replyMessage(replyToken, `找到多位符合的學員(${names}),請傳更完整的姓名。`);
      return;
    }

    const student = students[0];
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
  const [, nameText, monthStr, dayStr, hourStr, minuteStr] = match;

  const { data: students } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("role", "student")
    .ilike("full_name", `%${nameText}%`);

  if (!students || students.length === 0) {
    if (replyToken) await replyMessage(replyToken, `找不到叫「${nameText}」的學員,請確認姓名後再傳一次。`);
    return;
  }
  if (students.length > 1) {
    const names = students.map((s) => s.full_name).join("、");
    if (replyToken) await replyMessage(replyToken, `找到多位符合的學員(${names}),請傳更完整的姓名。`);
    return;
  }
  const student = students[0];

  const { data: coaches } = await admin.from("profiles").select("id").eq("role", "coach");
  if (!coaches || coaches.length !== 1) {
    if (replyToken) {
      await replyMessage(
        replyToken,
        coaches && coaches.length > 1
          ? "系統裡有多位教練,LINE 預約目前還不支援指定教練,請直接到網站登記。"
          : "系統裡找不到教練帳號,請直接到網站登記預約。"
      );
    }
    return;
  }
  const coachId = coaches[0].id;

  const scheduledDate = resolveBookingDate(Number(monthStr), Number(dayStr));
  const scheduledTime = `${hourStr.padStart(2, "0")}:${minuteStr}`;

  const { error } = await admin.from("lesson_bookings").insert({
    student_id: student.id,
    coach_id: coachId,
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
    await replyMessage(replyToken, `已預約:${student.full_name} ${scheduledDate} ${scheduledTime}`);
  }
}
