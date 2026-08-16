-- Generic in-app notifications (bell/list, not email/LINE). First use case:
-- tell the admin when a coach creates a new student account, since account
-- creation used to be admin-only.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index on notifications(recipient_id, read_at);

alter table notifications enable row level security;

create policy "notifications_admin_all" on notifications for all
  using (current_role_is('admin')) with check (current_role_is('admin'));

create policy "notifications_recipient_select" on notifications for select
  using (recipient_id = auth.uid());

create policy "notifications_recipient_mark_read" on notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
