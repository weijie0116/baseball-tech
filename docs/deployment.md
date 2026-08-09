# 部署交接文件

這份文件列出「只有你能做」的手動步驟(需要在瀏覽器裡註冊帳號、按按鈕),以及做完之後要帶回來給 Claude 的資訊。程式碼、資料庫 schema、專案骨架都已經準備好,卡在這幾個步驟才能真正連上線。

## 1. GitHub(放程式碼)

1. 到 [github.com](https://github.com) 註冊/登入
2. 建立一個新的 repository(private 或 public 都可以),先不用勾選任何初始化選項(不要加 README/gitignore,因為本機已經有專案了)
3. 記下 repo 網址(例如 `https://github.com/你的帳號/baseball-tech.git`)

**帶回來給我**:repo 網址。之後我會幫你把本機的 `~/Projects/Baseball_tech` 推上去。

## 2. Supabase(資料庫 + 登入系統)

1. 到 [supabase.com](https://supabase.com) 註冊/登入
2. 建立新專案(New Project),地區建議選 **Singapore**(離台灣近,速度較好)
3. 專案建立時要設定一組資料庫密碼 — 記下來,之後很少會用到但要留存
4. 專案建立完成後,進入 **Project Settings → API**,會看到:
   - **Project URL**(長得像 `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** key(一長串文字)
5. 進入左側選單的 **SQL Editor**,貼上 `supabase/migrations/0001_init.sql` 的完整內容,執行(Run)
6. 進入 **Authentication → Users**,手動建立第一個帳號(你自己的 email + 密碼),這會是第一個管理者帳號
7. 回到 **SQL Editor**,執行這行(把 `<uuid>` 換成剛剛建立的使用者 ID,可以在 Authentication → Users 列表裡複製):
   ```sql
   insert into profiles (id, full_name, role) values ('<uuid>', '你的姓名', 'admin');
   ```

**帶回來給我**:Project URL、anon public key(這兩個要填進 `.env.local`,之後部署到 Vercel 也要填一次)。

> service_role key 先不用管,之後如果需要 admin 後端功能(例如用 API 幫使用者建帳號)才會用到,那個金鑰絕對不能外流。

## 3. Vercel(讓網站能在網路上被存取)

1. 到 [vercel.com](https://vercel.com),用 GitHub 帳號登入
2. 點 **Add New → Project**,選擇剛剛建立的 GitHub repo 匯入
3. 在專案設定的 **Environment Variables** 貼上:
   - `NEXT_PUBLIC_SUPABASE_URL` = 上面的 Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 上面的 anon public key
4. 點 Deploy

部署完成後 Vercel 會給一個網址(例如 `https://baseball-tech.vercel.app`),手機/電腦在任何地方都能打開。之後每次程式碼有更新、push 到 GitHub,Vercel 會自動重新部署,不需要手動操作。

**帶回來給我**:Vercel 部署後的網址(方便之後回來測試/串接時使用)。

## 4. 回到 Supabase 設定登入的 Redirect URL

1. Supabase Dashboard → **Authentication → URL Configuration**
2. 把 Vercel 給的網址加進 **Redirect URLs**(例如 `https://baseball-tech.vercel.app/**`)

沒做這步的話,正式網址上的登入可能會出問題(本機開發不受影響)。

---

## 之後維運要注意的事

- **免費專案沉睡**:Supabase 免費方案的專案如果 7 天沒有流量會自動暫停,不會遺失資料,登入 Supabase Dashboard 點一下就能喚醒
- **用量檢查**:偶爾登入 Supabase Dashboard 看一下資料庫/流量用量,確認在免費額度內
- **Vercel Hobby 方案**條款上是給非商業用途,如果教練朋友之後拿這個網站營利,理論上該升級 Pro 方案($20/月),但這超出目前 $10-15/月的預算 — 先用免費方案,之後真的有問題再處理,不用現在煩惱
