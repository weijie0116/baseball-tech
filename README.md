# Baseball_tech — 投手學員成長歷程追蹤網站

給棒球教練與投手學員用的訓練紀錄追蹤系統:身高體重成長曲線、每次上課的訓練菜單與投球數據(球速/轉速)、投球機制進步分析時間軸。三種角色:管理者、教練、學員。

## 技術棧

Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Supabase(資料庫 + 登入)。投球影片存放在教練自己的 Synology NAS,不走雲端物件儲存。

## 本機開發

```bash
npm install
cp .env.local.example .env.local   # 填入 Supabase 專案的 URL / anon key
npm run dev
```

開發時 `npm run build` 需要 `.env.local` 存在(即使是佔位值)才能通過型別檢查。

## 文件

- [`docs/deployment.md`](docs/deployment.md) — 部署交接步驟(GitHub / Supabase / Vercel 手動設定)
- [`docs/schema.md`](docs/schema.md) — 資料庫 schema 白話說明
- [`docs/nas-video-notes.md`](docs/nas-video-notes.md) — 投球影片走 NAS 儲存的決策與待解問題
- [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — 完整資料庫 schema + 權限規則

## 目前進度

Phase 1(專案骨架 + 資料庫 schema + 登入/角色路由架構)已完成,尚未接上真實的 Supabase 專案。後續階段(帳號管理、訓練紀錄、機制分析時間軸、NAS 影片串接、正式部署)規劃在 `docs/deployment.md` 與對話紀錄中,會逐步實作。
