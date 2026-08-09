-- LINE bot support: coach sends a student's name (text), then sends the
-- pitching video in the same chat. The webhook can't run the actual video
-- analysis itself (that needs Claude Code running locally with NAS access
-- and visual judgment) — it just records what came in so it can be
-- processed next time someone asks Claude to check pending requests.
--
-- Both tables are only ever touched via the service_role key (the Next.js
-- webhook route and the local processing script), never through the
-- anon/authenticated Supabase client, so RLS is enabled with no policies
-- (default-deny for anon/authenticated; service_role bypasses RLS).

create table line_pending_context (
  line_user_id text primary key,
  student_id uuid not null references profiles(id),
  updated_at timestamptz not null default now()
);

create table line_video_requests (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null,
  line_message_id text not null,
  student_id uuid references profiles(id),
  student_name_hint text,
  status text not null default 'pending', -- pending | processing | done | error
  error_message text,
  training_session_id uuid references training_sessions(id),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index on line_video_requests(status);

alter table line_pending_context enable row level security;
alter table line_video_requests enable row level security;
