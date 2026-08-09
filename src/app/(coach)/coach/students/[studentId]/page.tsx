export default async function CoachStudentDetailPage({
  params,
}: PageProps<"/coach/students/[studentId]">) {
  const { studentId } = await params;

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">學員詳細資料</h1>
      <p className="text-muted-foreground text-sm">
        學員 ID: {studentId} — 身高體重歷史、訓練紀錄列表 — Phase 2/3 實作,目前是骨架佔位。
      </p>
    </div>
  );
}
