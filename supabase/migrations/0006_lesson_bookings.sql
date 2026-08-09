-- Lesson bookings: a scheduled future lesson slot (student + date + time),
-- separate from training_sessions (which records what actually happened at
-- a lesson, created after the fact). Bookings are currently created via the
-- LINE bot ("預約 <學員> <M/D> <HH:MM>", sent by the coach on the student's
-- behalf) or can be added directly from the website.

create table lesson_bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  coach_id uuid not null references profiles(id),
  scheduled_date date not null,
  scheduled_time time not null,
  duration_minutes int not null default 60,
  status text not null default 'confirmed', -- confirmed | cancelled
  notes text,
  source text not null default 'web', -- web | line
  line_user_id text,
  created_at timestamptz not null default now()
);

create index on lesson_bookings(coach_id, scheduled_date);
create index on lesson_bookings(student_id, scheduled_date);

alter table lesson_bookings enable row level security;

create policy "lesson_bookings_admin_all" on lesson_bookings for all
  using (current_role_is('admin')) with check (current_role_is('admin'));

create policy "lesson_bookings_coach_manage" on lesson_bookings for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy "lesson_bookings_self_select" on lesson_bookings for select
  using (student_id = auth.uid());
