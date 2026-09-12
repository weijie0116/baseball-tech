-- Two hot-path columns that were missing supporting indexes, found while
-- investigating reports of the site feeling slow:
--
-- - student_profiles.coach_id: filtered directly by the roster page, and
--   evaluated in an EXISTS subquery by nearly every coach-scoped RLS policy
--   (profiles, student_measurements, training_sessions, etc.), so it's on
--   the hot path for almost every coach query, not just the roster page.
-- - training_sessions(student_id, session_date): every student/session-list
--   query filters by student_id and orders by session_date; the existing
--   single-column student_id index doesn't cover the sort.

create index on student_profiles(coach_id);
create index on training_sessions(student_id, session_date desc);
