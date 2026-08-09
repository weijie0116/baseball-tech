export default async function NewSessionPage({
  params,
}: PageProps<"/coach/students/[studentId]/sessions/new">) {
  const { studentId } = await params;

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">新增訓練紀錄</h1>
      <p className="text-muted-foreground text-sm">
        學員 ID: {studentId} — 訓練菜單文字 + 球速/轉速多筆記錄表單 — Phase 3 實作,目前是骨架佔位。
      </p>
    </div>
  );
}
