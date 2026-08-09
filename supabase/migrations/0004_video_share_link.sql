-- Phase 5: attach a NAS video to a session via a Synology QuickConnect
-- File Station share link, rather than solving raw NAS file access.
--
-- The share pages for HEVC-encoded iPhone .MOV files don't offer inline
-- browser preview (Synology only shows a download button for those), so
-- storage_path stores the share URL and the app just links out to it
-- rather than attempting in-app playback. share_password is optional,
-- for links the coach protected with a password in File Station.

alter table session_videos add column if not exists share_password text;

comment on column session_videos.storage_path is
  'For storage_location=nas: the Synology QuickConnect File Station share URL (e.g. https://gofile.me/...)';
