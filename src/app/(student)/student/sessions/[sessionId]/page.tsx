export default async function StudentSessionDetailPage({
  params,
}: PageProps<"/student/sessions/[sessionId]">) {
  const { sessionId } = await params;

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">上課紀錄詳情</h1>
      <p className="text-muted-foreground text-sm">
        課程 ID: {sessionId} — 訓練菜單、投球數據、影片 — Phase 3/5 實作,目前是骨架佔位。
      </p>
    </div>
  );
}
