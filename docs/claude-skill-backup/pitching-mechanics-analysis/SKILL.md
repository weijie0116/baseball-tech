---
name: pitching-mechanics-analysis
description: Extract key pitching-motion frames from a NAS video for the Baseball_tech project's "投球機制進步分析" (pitching mechanics progress) timeline — pull candidate stills with ffmpeg, visually pick the ones representing wind-up/leg-lift/stride/release/follow-through, then upload to Supabase Storage and record them against a training session. Use when the coach asks to analyze/擷取 a specific pitching video or session.
---

# Pitching Mechanics Checkpoint Analysis

For the Baseball_tech project (`~/Projects/Baseball_tech`). A "checkpoint" is
a `training_sessions` row the coach has flagged as representative; its
`session_checkpoint_frames` are ~5 still frames laid out as a filmstrip on
the student's `/student/mechanics-timeline` page, alongside a coach-written
analysis paragraph.

**Full videos live on the coach's Synology NAS, not in Supabase** (see
`docs/nas-video-notes.md` in the project). This workflow runs locally where
the NAS is mounted — it is not a website feature, because Vercel can't
reach the NAS and isn't suited to video processing anyway. See
`docs/deployment.md` for how this fits the overall architecture.

**NAS folder layout (current, as of 2026-08-10):** `/Volumes/homes/Baseball tech/<學員姓名>/`
— one folder per student, at the top level of the NAS share (sibling to
`AJAYGER`, `concert`, etc., not nested inside them). Currently only
`/Volumes/homes/Baseball tech/梁維傑/` exists. This replaces the old
`/Volumes/homes/AJAYGER/Baseball/Pitch/催幫/` shared folder as the place
for *new* videos — that old folder still holds the videos used to backfill
the 2025-09 through 2026-08 checkpoints and is fine to reference for
historical clips, but new uploads (including NAS backups of LINE-submitted
videos) go in the per-student folder under `Baseball tech`.

**If a student doesn't have a folder yet, create one automatically** —
`mkdir -p "/Volumes/homes/Baseball tech/<full_name>"` using the exact
`profiles.full_name` for that student (already resolved from the database,
so it's not a guess). This applies to LINE-submitted videos in particular:
don't ask the user first, just create it as part of processing the request.
Only ask if the student can't be resolved to a `profiles` row at all.

## When to use this

The coach/user asks to analyze a specific pitching video, or to add/update
a checkpoint on the mechanics timeline for a named student and session. Also
use this when asked to check for/process new uploads (e.g. "看今天有沒有新
影片", "處理一下待分析的影片", "LINE 上有沒有新影片") — see "Scanning for
new uploads" and "Processing LINE-submitted videos" below.

## Processing LINE-submitted videos

The coach can send a video directly in LINE chat instead of dealing with
NAS paths: they send the student's name as a text message first, then the
video, to the project's LINE Official Account. A webhook
(`src/app/api/line-webhook/route.ts`) matches the name against
`profiles.full_name`, remembers that as context for ~30 minutes, and when
the video arrives records a row in `line_video_requests` with
`status='pending'` — it can't do the actual analysis itself (no NAS access,
no visual judgment inside a stateless HTTP handler).

When asked to check/process these:

1. **List pending requests**: `python3 scripts/list_pending_line_requests.py`
   — prints each request's id, student, LINE message id, and when it came in.

2. **Don't let requests sit too long before downloading** — LINE only
   guarantees message content is retrievable for a limited window after
   it was sent. Process requests promptly once noticed.

3. For each request, **download the video** straight into that student's
   NAS folder, creating the folder first if it doesn't exist yet
   (`mkdir -p "/Volumes/homes/Baseball tech/<full_name>"` — no need to ask,
   see the folder-layout note above):
   ```
   python3 scripts/download_line_video.py <line_message_id> \
     "/Volumes/homes/Baseball tech/<student full_name>/LINE_<date>_<student>.mp4"
   ```

4. Find or create a `training_sessions` row for that student (use today's
   date, or the request's `created_at` date) — same as any other checkpoint.

5. Run the normal **Workflow** below (extract candidates → review → upload)
   using the downloaded file as the source video.

6. **Close out the request**:
   ```
   python3 scripts/finish_line_request.py \
     --request-id <uuid> --session-id <uuid> --status done \
     --push-line-user-id <line_user_id> --push-text "已完成 <學員> 的投球機制分析,可以到網站上看囉!"
   ```
   `--push-line-user-id` comes from the request row (not printed by
   `list_pending_line_requests.py` by default — query `line_video_requests`
   directly for `line_user_id` if you need it for the push). Push is
   optional; omit `--push-line-user-id`/`--push-text` to just mark it done
   silently. On failure, use `--status error --error "<what went wrong>"`
   instead so it doesn't get silently retried forever.

## Scanning for new uploads

Videos land on the NAS via the coach's existing iCloud sync workflow (or
get saved there after a LINE submission), not through any push
notification — nobody tells this skill when a new file shows up. When
asked to check for new videos (for "today" or a given date), scan each
student's folder under `Baseball tech` for files modified in that window
instead of requiring an exact filename:

```
find "/Volumes/homes/Baseball tech" -mindepth 2 -maxdepth 2 -type f \
  \( -iname "*.mov" -o -iname "*.mp4" \) \
  -newermt "<date> 00:00:00" ! -newermt "<date+1> 00:00:00" \
  -exec ls -la {} \;
```

The student's name comes from the immediate parent folder (e.g. a file
under `Baseball tech/梁維傑/` belongs to 梁維傑) — resolve that to a
`profiles.id` by matching `full_name` (case-sensitive exact match should
work now that folders are named after real students; fall back to asking
if a folder name doesn't match any profile). See the project memory
`project-baseball-tech` for known IDs, but always re-verify against
`profiles` since these can change.

The old shared folder `/Volumes/homes/AJAYGER/Baseball/Pitch/催幫/` is
historical only (used to backfill 2025-09 through 2026-08 checkpoints
before the per-student layout existed) — don't scan it for new uploads.

For each new video found:
1. Check `training_sessions` for an existing row matching that student +
   date; if none exists, create one (same shape as the bulk-insert used to
   backfill 2025-09 through 2026-08 checkpoints).
2. Run the extraction/review/upload workflow below on that video.
3. Report back which dates/videos got processed, and flag anything skipped
   (e.g. a clip that turned out not to be the student's own pitching, as
   happened with a pro-game recording found during the initial backfill).

## What you need before starting

- Which student and which `training_sessions` row (session_id) this is for.
  If unclear, look it up: query `training_sessions` by student + date, or
  ask the user which date/session.
- The path to the source video on the NAS (confirm `/Volumes/...` is
  mounted first — same caution as the concert-highlights skill).
- Roughly which portion of the video is the actual pitch delivery worth
  analyzing (a raw take may include walk-up, mound visits, multiple pitches
  back to back). Ask the user for a rough timestamp/range if it's not
  obvious, rather than guessing across the whole file.

## Workflow

1. **Extract candidate frames.** Use `scripts/extract_candidates.sh` to pull
   frames from the video at fine intervals (default every 0.12s) across the
   delivery window:

   ```
   scripts/extract_candidates.sh "<video path>" <start_seconds> <duration_seconds> <output_dir>
   ```

   Keep the window tight (a single pitch delivery is usually 1.5–3s from
   leg lift to follow-through) — extracting across a whole multi-minute
   clip produces too many candidates to review.

2. **Review candidates visually.** Read the extracted frames (they're small
   PNGs, cheap to view in batches) and pick ~5 that best represent the
   classic phases: 預備/準備姿勢 (set position), 抬腿 (leg lift / balance
   point), 跨步 (stride / foot plant), 出手 (release point), 收尾
   (follow-through). This is a judgment call from looking at the images —
   there's no pose-estimation tool here, so say so if asked; it's "AI
   visually reviewed candidates and picked the closest matches," not
   biomechanical measurement.

3. **Order and label your picks.** Note each chosen frame's file, its
   timestamp, and which phase it represents, in delivery order.

4. **Upload.** Use `scripts/upload_checkpoint.py` to push the chosen frames
   to Supabase Storage and record them:

   ```
   python3 scripts/upload_checkpoint.py \
     --session-id <uuid> \
     --frame "<path1>:<timestamp1>:<phase_label1>" \
     --frame "<path2>:<timestamp2>:<phase_label2>" \
     ... (up to ~5)
   ```

   This reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   from `~/Projects/Baseball_tech/.env.local` — no need to pass keys
   manually. It uploads each image to the private `checkpoint-frames`
   bucket, inserts `session_checkpoint_frames` rows (`is_ai_suggested =
   true`, `confirmed_by_coach = false`), and sets the parent
   `training_sessions.is_checkpoint = true` if it wasn't already.

5. **Tell the coach what's next.** The website session detail page
   (`/coach/students/<id>/sessions/<session_id>`) now shows the filmstrip.
   The coach still needs to fill in (or edit) the phase label and analysis
   text there — don't write that analysis text yourself unless the coach
   explicitly asks for a drafted description, and if you do, make clear
   it's an observational description of what the frames show (stride
   length, arm angle, etc.), not real coaching judgment about whether it's
   good or needs work — that's the coach's call.

## Cleanup

Delete the local extracted-candidates directory after uploading — it's
scratch output, not something to keep around.
