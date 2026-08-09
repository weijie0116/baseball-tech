import { createClient } from "@/lib/supabase/server";
import { MechanicsTimelineView } from "@/components/MechanicsTimelineView";

export default async function CoachMechanicsTimelinePage({
  params,
}: PageProps<"/coach/students/[studentId]/mechanics-timeline">) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", studentId)
    .single();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{profile?.full_name ?? "學員"} — 投球機制進步分析</h1>
        <p className="text-muted-foreground text-sm">依時間排列的代表性檢核點。</p>
      </div>
      <MechanicsTimelineView
        studentId={studentId}
        emptyHint="這位學員還沒有機制分析檢核點。要處理某次上課的影片,直接跟 Claude 說要分析哪一次的哪支影片。"
      />
    </div>
  );
}
