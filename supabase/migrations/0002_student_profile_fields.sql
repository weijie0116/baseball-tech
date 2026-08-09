-- Add school/team/position/pitch-types to student_profiles.
-- "最快球速" (fastest pitch velocity) is deliberately NOT a stored column
-- here — it's derived from MAX(pitch_metrics.velocity_kph) once Phase 3
-- (training session data entry) exists, so it can't go stale.

alter table student_profiles
  add column school text,
  add column team text,
  add column position text,
  add column pitch_types text[] not null default '{}';
