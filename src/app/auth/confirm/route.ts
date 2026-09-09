import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Landing point for links sent by Supabase Auth emails (password recovery,
// invites, etc).
//
// Two verification paths are supported:
// - `token_hash` + `type` (OTP-style, via verifyOtp): works from ANY
//   device/browser, since the token is self-contained. This requires the
//   Supabase Dashboard's "Reset Password" email template to link to
//   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
//   instead of the default `{{ .ConfirmationURL }}`. Required because
//   password-reset emails are routinely opened on a phone's mail app while
//   the request was made on a different computer, and the PKCE `code` path
//   below can't complete in that case (its code_verifier only exists as a
//   cookie on the requesting device).
// - `code` (PKCE, via exchangeCodeForSession): kept as a fallback for any
//   other Supabase-generated link that already uses this flow.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/reset-password";
  const supabase = await createClient();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
