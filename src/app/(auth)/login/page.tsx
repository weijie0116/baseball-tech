import { Suspense } from "react";
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
      <div className="hidden flex-1 flex-col justify-center gap-10 bg-primary p-14 text-primary-foreground md:flex">
        <div className="flex items-center gap-2.5">
          <div className="size-6 rounded-full border-2 border-primary-foreground" />
          <span className="font-heading text-lg font-bold">投手成長歷程</span>
        </div>
        <div className="flex max-w-md flex-col gap-4">
          <h1 className="font-heading text-4xl leading-tight font-bold text-balance">
            每一球都留下紀錄,進步才看得見。
          </h1>
          <p className="text-sm leading-relaxed text-primary-foreground/85">
            身高體重成長曲線、每次上課的訓練菜單與球速轉速、投球機制的前後比對,教練與學員看的是同一份紀錄。
          </p>
        </div>
        <div className="flex gap-9">
          <div>
            <div className="font-numeric text-2xl font-bold tabular-nums">{sessionCount}</div>
            <div className="text-xs text-primary-foreground/80">已紀錄課次</div>
          </div>
          <div>
            <div className="font-numeric text-2xl font-bold tabular-nums">{studentCount}</div>
            <div className="text-xs text-primary-foreground/80">追蹤中學員</div>
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
