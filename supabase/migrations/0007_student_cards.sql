-- Student profile card: photo + jersey number, for a thumbnail-grid view
-- of the coach's student list (cards link through to the existing full
-- detail page).

alter table profiles add column if not exists avatar_storage_key text;
alter table student_profiles add column if not exists jersey_number text;

-- Private bucket for profile photos. Object path convention: "<profile
-- id>.<ext>" — lets the RLS policy match without a join table, unlike
-- checkpoint-frames which needs one (frames don't share an id with their
-- owning row the way an avatar shares the profile's own id).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

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

-- Coach uploads/replaces/removes a photo for one of their own students;
-- admin can do it for anyone.
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
