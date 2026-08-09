# 資料庫 Schema 說明

完整 SQL 在 `supabase/migrations/0001_init.sql`。這份文件是給人看的白話版。

## 資料表

| 表 | 用途 |
|---|---|
| `profiles` | 所有使用者(管理者/教練/學員)的基本資料 + 角色,對應 Supabase Auth 的帳號 |
| `student_profiles` | 學員專屬資料(生日、慣用手、目前教練) |
| `student_measurements` | 身高體重歷史紀錄(每次量測一筆,不是單一欄位,才能畫成長曲線) |
| `training_sessions` | 每次上課一筆,含訓練菜單文字。有標記「檢核點」用的欄位,支援機制進步分析時間軸 |
| `pitch_metrics` | 一次上課的多筆投球數據(球速、轉速、球種) |
| `session_videos` | 投球影片的 metadata(實際檔案在 NAS,這裡只存路徑) |
| `session_checkpoint_frames` | 機制進步分析時間軸用的連續動作截圖(每個檢核點約 5 張) |

## 兩個「保留擴充空間」的設計

1. **`pitch_metrics.extra_metrics`**(JSONB):球速、轉速是常用欄位,獨立成正式欄位方便查詢畫圖。但教練未來可能想記錄更多指標(出手點、伸展幅度、水平/垂直位移等),這些直接放進 `extra_metrics` 這個 JSON 欄位就好,不用每次都改資料庫結構、不用寫 migration。

2. **`session_videos.storage_location`**(enum,目前只有 `'nas'`):現在影片都在 NAS,但如果之後想混用雲端儲存(例如精選影片額外放一份在雲端方便遠端看),這個欄位已經預留了擴充空間,不用改表結構。

## 機制進步分析怎麼運作(Phase 4 才會實作)

1. 教練把某次上課標記為「檢核點」(`training_sessions.is_checkpoint = true`),填一個階段標籤(如「進步期」)跟分析文字
2. 針對那次上課的投球影片,用 ffmpeg 密集擷取候選畫格
3. Claude 用圖像判讀,從候選畫格挑出最像「預備/抬腿/跨步/出手/收尾」的 5 張,寫進 `session_checkpoint_frames`,`is_ai_suggested = true`
4. 教練在網頁上看這 5 張截圖,覺得不對可以換成別的時間點 —— 換過的那張改成 `confirmed_by_coach = true`
5. 學員的「投球機制進步分析」頁面把所有檢核點依時間排序,呈現成類似連續翻頁的時間軸

## 權限(Row Level Security)

三種角色透過 Postgres RLS 規則在資料庫層強制(不是只靠前端判斷,更安全):

- **admin**:所有表都能讀寫
- **coach**:只能碰自己帶的學員(`coach_id = auth.uid()`)的資料
- **student**:只能讀(不能寫)自己的資料(`student_id = auth.uid()`)
