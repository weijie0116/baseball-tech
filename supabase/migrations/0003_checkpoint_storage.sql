-- Private Storage bucket for pitching-mechanics checkpoint frame images
-- (small stills extracted from video, not the videos themselves — those
-- stay on the coach's NAS, see docs/nas-video-notes.md).
--
-- Writes happen out-of-band via a local script using the service_role key
-- (bypasses RLS), so only a read policy is needed here. Reads are scoped
-- to admin, the session's coach, and the session's student — same shape
-- as every other table's RLS in this project.

insert into storage.buckets (id, name, public)
values ('checkpoint-frames', 'checkpoint-frames', false)
on conflict (id) do nothing;

create policy "checkpoint_frames_storage_read" on storage.objects for select
  using (
    bucket_id = 'checkpoint-frames' and exists (
      select 1
      from session_checkpoint_frames scf
      join training_sessions s on s.id = scf.session_id
      where scf.image_storage_key = storage.objects.name
        and (
          current_role_is('admin')
          or s.coach_id = auth.uid()
          or s.student_id = auth.uid()
        )
    )
  );
