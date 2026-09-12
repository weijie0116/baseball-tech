import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "./LoginForm";
import { createAdminClient } from "@/lib/supabase/admin";

// Public/unauthenticated page — no user session, so RLS-scoped reads via
// the normal server client would return nothing. These two counts are
// non-sensitive aggregates (no PII), fetched with the service-role client
// only on the server and never exposed to the browser beyond the numbers
// themselves.
async function getLoginStats() {
  const admin = createAdminClient();
  const [{ count: sessionCount }, { count: studentCount }] = await Promise.all([
    admin.from("training_sessions").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .eq("is_active", true),
  ]);
  return { sessionCount: sessionCount ?? 0, studentCount: studentCount ?? 0 };
}

export default async function LoginPage() {
  const { sessionCount, studentCount } = await getLoginStats();

  return (
    <main className="flex flex-1 items-stretch">
      <div className="bg-background text-foreground relative hidden flex-1 flex-col justify-center gap-10 overflow-hidden p-14 md:flex">
        {/* Watermark tuned for the dark gold palette — invert(1) reads as a
            near-black silhouette on a light background, so this only works
            here because --background is dark. */}
        <Image
          src="/logo-pitcher.png"
          alt=""
          width={460}
          height={460}
          className="pointer-events-none absolute right-0 -bottom-[30px] w-[460px] opacity-[0.07] invert"
        />
        <div className="relative flex items-center gap-3.5">
          <span className="border-primary flex size-[46px] items-center justify-center overflow-hidden rounded-full border-2">
            <Image
              src="/logo-pitcher.png"
              alt=""
              width={34}
              height={34}
              className="size-[34px] object-contain [filter:brightness(0)_invert(76%)_sepia(38%)_saturate(620%)_hue-rotate(2deg)_brightness(96%)]"
            />
          </span>
          <span className="font-numeric text-2xl font-bold tracking-[0.13em]">RELEASE LAB</span>
        </div>
        <div className="relative flex max-w-md flex-col gap-4">
          <h1 className="font-heading text-primary text-4xl leading-tight font-bold text-balance">
            每一球都留下紀錄,進步才看得見。
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            身高體重成長曲線、每次上課的訓練菜單與球速轉速、投球機制的前後比對,教練與學員看的是同一份紀錄。
          </p>
        </div>
        <div className="relative flex gap-9">
          <div>
            <div className="font-numeric text-primary text-2xl font-bold tabular-nums">
              {sessionCount}
            </div>
            <div className="text-muted-foreground text-xs">已紀錄課次</div>
          </div>
          <div>
            <div className="font-numeric text-primary text-2xl font-bold tabular-nums">
              {studentCount}
            </div>
            <div className="text-muted-foreground text-xs">追蹤中學員</div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
