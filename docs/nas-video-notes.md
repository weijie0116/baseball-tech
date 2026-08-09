# 投球影片儲存:NAS、遠端存取、LINE 影片提交

## 決策背景

原本規劃是把投球影片放雲端物件儲存(Cloudflare R2),但使用者已經有自己的 **Synology 群暉 NAS**,影片素材本來就會透過 iCloud 轉傳到 NAS 上,所以決定影片直接放 NAS,不額外花錢存雲端。資料庫(`session_videos` 表)只存檔案的 metadata(分享連結、檔名、密碼),不存檔案本身。

## NAS 資料夾結構(2026-08-10 起)

```
/Volumes/homes/Baseball tech/
└── <學員姓名>/          -- 每位學員一個資料夾,例如「梁維傑」
    └── (投球影片)
```

這是目前(現在)開始使用的結構。舊的共用資料夾 `/Volumes/homes/AJAYGER/Baseball/Pitch/催幫/` 是歷史資料,拿來回填 2025-09 到 2026-08 的機制分析檢核點用,之後新影片都存到 `Baseball tech/<學員姓名>/` 底下,不再往舊資料夾放。

## Phase 5:影片遠端存取(已完成)

**做法:Synology QuickConnect + File Station 分享連結**,不是讓網站直接連 NAS 檔案系統。

1. 在 File Station 對影片檔案產生分享連結(網域是 `gofile.me`),可選擇設定密碼保護
2. 網站的教練頁面貼上這個連結(存進 `session_videos.storage_path`,密碼存 `share_password`)
3. 教練/學員登入後點連結開啟

**已知限制**:HEVC 編碼的 iPhone `.MOV` 檔案在群暉分享頁面**沒有瀏覽器內建預覽**,只會顯示下載按鈕,不是直接播放。這是刻意接受的簡化(比起自己架轉碼/串流服務便宜很多),使用者已確認可以接受。

## LINE 機器人提交影片(已完成)

教練不用再手動去 File Station 產生分享連結,可以直接在 LINE 聊天視窗傳影片:

1. 教練傳學員姓名(文字)給 LINE 官方帳號
2. 接著傳投球影片
3. Webhook(`src/app/api/line-webhook/route.ts`)记录成待處理項目
4. 之後(使用者要求時)Claude 用 `pitching-mechanics-analysis` skill 的腳本把影片抓下來、備份到該學員的 NAS 資料夾、跑機制分析、LINE 推播通知完成

詳細操作流程在 skill 的 `SKILL.md`(`~/.claude/skills/pitching-mechanics-analysis/`),不是這份文件的範圍。

## 跟「投球機制進步分析」的關係

機制分析時間軸用的是**從影片擷取出來的靜態截圖**,檔案很小,直接存在 Supabase Storage(雲端,`checkpoint-frames` bucket),不受 NAS 遠端存取問題影響——截圖上傳後任何地方都看得到。真正受 NAS 存取限制的,只有「完整投球影片本身要在外部播放」這件事,現在用 QuickConnect 分享連結(下載,非串流播放)解決。
