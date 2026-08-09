-- Coach can update their own students' `profiles` row (needed for
-- avatar_storage_key, set by uploadAvatarAction) — missed when 0001 set up
-- profiles RLS, which only granted coaches SELECT on their students'
-- profiles, not UPDATE. Matches the coach's existing broad write access to
-- every other student-owned table (student_profiles, measurements,
-- sessions, etc.), so this isn't a new category of privilege.

create policy "profiles_coach_update_students" on profiles for update
  using (
    exists (
      select 1 from student_profiles sp where sp.student_id = profiles.id and sp.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from student_profiles sp where sp.student_id = profiles.id and sp.coach_id = auth.uid()
    )
  );
