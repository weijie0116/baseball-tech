-- Re-create the avatars storage policies idempotently. The previous
-- migration (0007) likely partially failed: its SQL was sent to the user
-- twice (once without write policies, once with), and the second run's
-- duplicate "avatars_storage_read" policy would error with "policy already
-- exists" and abort before the insert/update/delete policies got created —
-- matching the observed "new row violates row-level security policy" on
-- upload with no matching INSERT policy in effect.

drop policy if exists "avatars_storage_read" on storage.objects;
drop policy if exists "avatars_storage_write" on storage.objects;
drop policy if exists "avatars_storage_update" on storage.objects;
drop policy if exists "avatars_storage_delete" on storage.objects;

create policy "avatars_storage_read" on storage.objects for select
  using (
    bucket_id = 'avatars' and (
      current_role_is('admin')
      or split_part(storage.objects.name, '.', 1) = auth.uid()::text
      or exists (
        select 1 from student_profiles sp
        where sp.student_id::text = split_part(storage.objects.name, '.', 1)
          and sp.coach_id = auth.uid()
      )
    )
  );

create policy "avatars_storage_write" on storage.objects for insert
  with check (
    bucket_id = 'avatars' and (
      current_role_is('admin')
      or exists (
        select 1 from student_profiles sp
        where sp.student_id::text = split_part(storage.objects.name, '.', 1)
          and sp.coach_id = auth.uid()
      )
    )
  );

create policy "avatars_storage_update" on storage.objects for update
  using (
    bucket_id = 'avatars' and (
      current_role_is('admin')
      or exists (
        select 1 from student_profiles sp
        where sp.student_id::text = split_part(storage.objects.name, '.', 1)
          and sp.coach_id = auth.uid()
      )
    )
  );

create policy "avatars_storage_delete" on storage.objects for delete
  using (
    bucket_id = 'avatars' and (
      current_role_is('admin')
      or exists (
        select 1 from student_profiles sp
        where sp.student_id::text = split_part(storage.objects.name, '.', 1)
          and sp.coach_id = auth.uid()
      )
    )
  );
