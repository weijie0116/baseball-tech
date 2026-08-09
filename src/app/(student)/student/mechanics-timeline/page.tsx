import { createClient } from "@/lib/supabase/server";
import { MechanicsTimelineView } from "@/components/MechanicsTimelineView";

export default async function MechanicsTimelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">投球機制進步分析</h1>
        <p className="text-muted-foreground text-sm">依時間排列的代表性檢核點。</p>
      </div>
      <MechanicsTimelineView
        studentId={user!.id}
        emptyHint="教練標記代表性上課、擷取關鍵動作畫面後,會顯示在這裡。"
      />
    </div>
  );
}
