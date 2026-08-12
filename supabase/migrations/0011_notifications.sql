-- Phase 5: notifications, auto-created by triggers on the actions that should raise them.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('appreciation', 'follow', 'comment')),
  project_id uuid references public.projects (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Recipients can view their own notifications"
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy "Recipients can update their own notifications"
  on public.notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Only the `read` flag is user-writable; everything else is set once by the triggers below.
revoke update on public.notifications from authenticated;
grant update (read) on public.notifications to authenticated;

-- No insert policy: notifications are only ever created by the SECURITY DEFINER triggers
-- below, never directly by a client.

create or replace function public.handle_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, actor_id, kind)
  values (new.followee_id, new.follower_id, 'follow');
  return new;
end;
$$;

create trigger on_follow_notify
  after insert on public.follows
  for each row execute function public.handle_follow_notification();

create or replace function public.handle_appreciation_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select creator_id into v_owner from public.projects where id = new.project_id;
  if v_owner is not null and v_owner <> new.creator_id then
    insert into public.notifications (recipient_id, actor_id, kind, project_id)
    values (v_owner, new.creator_id, 'appreciation', new.project_id);
  end if;
  return new;
end;
$$;

create trigger on_appreciation_notify
  after insert on public.appreciations
  for each row execute function public.handle_appreciation_notification();

create or replace function public.handle_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select creator_id into v_owner from public.projects where id = new.project_id;
  if v_owner is not null and v_owner <> new.creator_id then
    insert into public.notifications (recipient_id, actor_id, kind, project_id)
    values (v_owner, new.creator_id, 'comment', new.project_id);
  end if;
  return new;
end;
$$;

create trigger on_comment_notify
  after insert on public.comments
  for each row execute function public.handle_comment_notification();
