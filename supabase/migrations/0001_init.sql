-- Baseball_tech initial schema
-- Roles: admin (全權), coach (管理自己的學員), student (唯讀自己的資料)
-- Run this in the Supabase SQL Editor after creating a new project.

create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'coach', 'student');

-- 1:1 with auth.users, holds role + basic info for everyone
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Student-specific info
create table student_profiles (
  student_id uuid primary key references profiles(id) on delete cascade,
  coach_id uuid references profiles(id),
  birth_date date,
  dominant_hand text, -- 'left' / 'right'
  notes text,
  updated_at timestamptz not null default now()
);

-- Height/weight history (time series, not a single column, so growth curves work)
create table student_measurements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  measured_at date not null default current_date,
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  recorded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- One row per lesson/training session
create table training_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  coach_id uuid not null references profiles(id),
  session_date date not null default current_date,
  location text,
  menu_notes text,          -- 訓練菜單文字紀錄
  general_notes text,
  -- 投球機制進步分析時間軸用:教練把某次上課標記為代表性檢核點時才會填
  is_checkpoint boolean not null default false,
  checkpoint_phase_label text,      -- e.g. 起始階段/基準期/進步期/轉變期
  mechanics_analysis_notes text,    -- 這個檢核點的文字分析段落
  created_at timestamptz not null default now()
);

-- Pitch-by-pitch metrics, many rows per session.
-- Common fields are real columns for fast querying/charting; extra_metrics is a
-- JSONB escape hatch so new metrics (release point, extension, movement, etc.)
-- can be added later without a schema migration.
create table pitch_metrics (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references training_sessions(id) on delete cascade,
  pitch_number int,
  pitch_type text,               -- 'fastball' / 'curve' / 'slider' / 'changeup' / 'other'
  velocity_kph numeric(5,1),
  spin_rate_rpm numeric(6,1),
  notes text,
  extra_metrics jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

-- Video metadata only — the actual files live on the coach's Synology NAS,
-- not in this database. storage_location is an enum (not a bare text/bool)
-- so a future mixed-storage setup (e.g. a few videos mirrored to the cloud)
-- doesn't require a schema change.
create type video_storage_location as enum ('nas');

create table session_videos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references training_sessions(id) on delete cascade,
  storage_location video_storage_location not null default 'nas',
  storage_path text not null,   -- relative path on the NAS share
  file_name text,
  file_size_bytes bigint,
  content_type text,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);

-- 投球機制進步分析:每個檢核點(training_sessions.is_checkpoint = true)底下
-- 的連續動作截圖。時間點與階段標籤先由 AI 視覺判讀候選畫格給出建議,
-- 教練可以在 UI 上調整/替換 — is_ai_suggested / confirmed_by_coach 用來
-- 標示目前狀態。
create table session_checkpoint_frames (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references training_sessions(id) on delete cascade,
  frame_order int not null,
  video_timestamp_seconds numeric(6,2),
  image_storage_key text not null,   -- Supabase Storage object path
  phase_guess text,                  -- AI 判讀出的階段名稱,如「抬腿/跨步/出手」
  is_ai_suggested boolean not null default true,
  confirmed_by_coach boolean not null default false,
  caption text,
  created_at timestamptz not null default now()
);

create index on student_measurements(student_id);
create index on training_sessions(student_id);
create index on training_sessions(coach_id);
create index on training_sessions(is_checkpoint);
create index on pitch_metrics(session_id);
create index on session_videos(session_id);
create index on session_checkpoint_frames(session_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table student_profiles enable row level security;
alter table student_measurements enable row level security;
alter table training_sessions enable row level security;
alter table pitch_metrics enable row level security;
alter table session_videos enable row level security;
alter table session_checkpoint_frames enable row level security;

-- Helper: current user's role, read from profiles
create function current_role_is(target_role user_role) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = target_role
  );
$$;

-- profiles: admin full access; everyone can read their own row; coach can read their students'
create policy "profiles_admin_all" on profiles for all
  using (current_role_is('admin')) with check (current_role_is('admin'));

create policy "profiles_self_select" on profiles for select
  using (id = auth.uid());

create policy "profiles_coach_reads_students" on profiles for select
  using (
    current_role_is('coach') and exists (
      select 1 from student_profiles sp where sp.student_id = profiles.id and sp.coach_id = auth.uid()
    )
  );

-- student_profiles: admin all; coach manages own students; student reads own row
create policy "student_profiles_admin_all" on student_profiles for all
  using (current_role_is('admin')) with check (current_role_is('admin'));

create policy "student_profiles_coach_manage" on student_profiles for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy "student_profiles_self_select" on student_profiles for select
  using (student_id = auth.uid());

-- student_measurements: admin all; coach manages their students'; student reads own
create policy "measurements_admin_all" on student_measurements for all
  using (current_role_is('admin')) with check (current_role_is('admin'));

create policy "measurements_coach_manage" on student_measurements for all
  using (exists (
    select 1 from student_profiles sp where sp.student_id = student_measurements.student_id and sp.coach_id = auth.uid()
  ))
  with check (exists (
    select 1 from student_profiles sp where sp.student_id = student_measurements.student_id and sp.coach_id = auth.uid()
  ));

create policy "measurements_self_select" on student_measurements for select
  using (student_id = auth.uid());

-- training_sessions: admin all; coach manages own sessions; student reads own
create policy "sessions_admin_all" on training_sessions for all
  using (current_role_is('admin')) with check (current_role_is('admin'));

create policy "sessions_coach_manage" on training_sessions for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy "sessions_self_select" on training_sessions for select
  using (student_id = auth.uid());

-- pitch_metrics / session_videos / session_checkpoint_frames: scoped via parent session
create policy "pitch_metrics_admin_all" on pitch_metrics for all
  using (current_role_is('admin')) with check (current_role_is('admin'));

create policy "pitch_metrics_coach_manage" on pitch_metrics for all
  using (exists (select 1 from training_sessions s where s.id = pitch_metrics.session_id and s.coach_id = auth.uid()))
  with check (exists (select 1 from training_sessions s where s.id = pitch_metrics.session_id and s.coach_id = auth.uid()));

create policy "pitch_metrics_self_select" on pitch_metrics for select
  using (exists (select 1 from training_sessions s where s.id = pitch_metrics.session_id and s.student_id = auth.uid()));

create policy "session_videos_admin_all" on session_videos for all
  using (current_role_is('admin')) with check (current_role_is('admin'));

create policy "session_videos_coach_manage" on session_videos for all
  using (exists (select 1 from training_sessions s where s.id = session_videos.session_id and s.coach_id = auth.uid()))
  with check (exists (select 1 from training_sessions s where s.id = session_videos.session_id and s.coach_id = auth.uid()));

create policy "session_videos_self_select" on session_videos for select
  using (exists (select 1 from training_sessions s where s.id = session_videos.session_id and s.student_id = auth.uid()));

create policy "checkpoint_frames_admin_all" on session_checkpoint_frames for all
  using (current_role_is('admin')) with check (current_role_is('admin'));

create policy "checkpoint_frames_coach_manage" on session_checkpoint_frames for all
  using (exists (select 1 from training_sessions s where s.id = session_checkpoint_frames.session_id and s.coach_id = auth.uid()))
  with check (exists (select 1 from training_sessions s where s.id = session_checkpoint_frames.session_id and s.coach_id = auth.uid()));

create policy "checkpoint_frames_self_select" on session_checkpoint_frames for select
  using (exists (select 1 from training_sessions s where s.id = session_checkpoint_frames.session_id and s.student_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- First admin account (run manually after creating the auth user in
-- Supabase Studio → Authentication → Users, then replace the UUID below)
-- ---------------------------------------------------------------------------
-- insert into profiles (id, full_name, role) values ('<paste-auth-user-uuid>', '管理者姓名', 'admin');
