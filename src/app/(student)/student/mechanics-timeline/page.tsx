export default function MechanicsTimelinePage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">投球機制進步分析</h1>
      <p className="text-muted-foreground text-sm">
        依時間排列的代表性檢核點:每個檢核點顯示 5 張投球動作連續截圖(AI
        先建議關鍵畫面、教練確認/調整)與文字分析。這個頁面會在 Phase 4 實作,
        目前是骨架佔位。
      </p>
    </div>
  );
}
