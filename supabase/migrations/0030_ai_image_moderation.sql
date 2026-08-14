-- AI image detection, Layer 1 (free metadata check only -- see lib/ai-detection.ts).
-- Projects/listings whose upload includes an image that declares AI origin (C2PA/IPTC
-- DigitalSourceType, or a known AI-tool signature in EXIF/XMP text) are held out of
-- public view as 'pending_review' instead of publishing immediately, and go through a
-- simple admin approve/reject queue. Everything else keeps today's instant-publish
-- behavior ('clean').

alter table public.profiles add column role text not null default 'user' check (role in ('user', 'admin'));
-- Deliberately not added to the editable-column grant list from 0001 -- users can never
-- set their own role; the only way to become an admin is a manual SQL update.

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

alter table public.projects add column moderation_status text not null default 'clean'
  check (moderation_status in ('clean', 'pending_review', 'approved', 'rejected'));
alter table public.projects add column moderation_reason text;

alter table public.listings add column moderation_status text not null default 'clean'
  check (moderation_status in ('clean', 'pending_review', 'approved', 'rejected'));
alter table public.listings add column moderation_reason text;

-- The creator legitimately writes moderation_status themselves at insert time (from the
-- on-device Layer 1 result, same trust level as title/description) and can *escalate* it
-- on a later edit that swaps in a newly-flagged image -- otherwise Layer 1 is trivially
-- bypassed by editing after a clean publish. What a plain client write must never be
-- able to do is jump straight to 'approved'/'rejected', or quietly clear an existing
-- pending_review/approved/rejected status back to 'clean'. Postgres RLS `with check`
-- can't reference the pre-update value to express that, so it's enforced with a BEFORE
-- UPDATE trigger instead; moderate_project()/moderate_listing() flip a transaction-local
-- flag to make their own (legitimate) transition through it.
create or replace function public.guard_moderation_status_write()
returns trigger
language plpgsql
as $$
begin
  if new.moderation_status = old.moderation_status then
    return new;
  end if;

  if coalesce(current_setting('likha.allow_moderation_transition', true), '') = 'true' then
    return new;
  end if;

  if new.moderation_status in ('approved', 'rejected') then
    raise exception 'moderation_status can only move to approved/rejected via the moderation queue.';
  end if;

  if new.moderation_status = 'clean' and old.moderation_status <> 'clean' then
    raise exception 'moderation_status cannot be cleared back to clean directly.';
  end if;

  return new;
end;
$$;

create trigger guard_project_moderation_status
  before update on public.projects
  for each row execute function public.guard_moderation_status_write();

create trigger guard_listing_moderation_status
  before update on public.listings
  for each row execute function public.guard_moderation_status_write();

revoke update on public.projects from authenticated;
grant update (title, description, cover_url, categories, mediums, region, moderation_status, moderation_reason)
  on public.projects to authenticated;
-- listings never restricted authenticated's update grant to a fixed column list (0006),
-- so moderation_status/moderation_reason are already writable there; the trigger above
-- is what actually gates the values.

drop policy "Projects are publicly readable" on public.projects;
create policy "Clean/approved projects are publicly readable, owners and admins can read all"
  on public.projects for select
  using (
    moderation_status in ('clean', 'approved')
    or auth.uid() = creator_id
    or public.is_admin(auth.uid())
  );

drop policy "Active listings are publicly readable, owners can read all their own" on public.listings;
create policy "Active clean/approved listings are publicly readable, owners and admins can read all"
  on public.listings for select
  using (
    (is_active and moderation_status in ('clean', 'approved'))
    or auth.uid() = creator_id
    or public.is_admin(auth.uid())
  );

-- INSERT has no "old" row for the guard trigger to compare against, so it needs its own
-- value restriction: otherwise a client could simply publish a brand-new project/listing
-- as 'approved' and skip pending_review entirely.
drop policy "Creators can insert their own projects" on public.projects;
create policy "Creators can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = creator_id and moderation_status in ('clean', 'pending_review'));

drop policy "Creators can insert their own listings" on public.listings;
create policy "Creators can insert their own listings"
  on public.listings for insert
  with check (auth.uid() = creator_id and moderation_status in ('clean', 'pending_review'));

-- Moderation decisions: the only path that can move moderation_status to
-- approved/rejected (security definer, bypasses the RLS update policies entirely --
-- same mechanism accept_job_offer() relies on in 0021 -- but still has to clear the
-- guard trigger above via the transaction-local flag since triggers fire regardless of
-- privilege level).
create or replace function public.moderate_project(p_project_id uuid, p_decision text)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can moderate projects.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision: %', p_decision;
  end if;

  select * into v_project from public.projects where id = p_project_id;
  if v_project is null then
    raise exception 'Project not found.';
  end if;

  if v_project.moderation_status <> 'pending_review' then
    raise exception 'This project is not pending review.';
  end if;

  perform set_config('likha.allow_moderation_transition', 'true', true);
  update public.projects set moderation_status = p_decision where id = p_project_id
  returning * into v_project;

  return v_project;
end;
$$;

grant execute on function public.moderate_project to authenticated;

create or replace function public.moderate_listing(p_listing_id uuid, p_decision text)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.listings;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can moderate listings.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision: %', p_decision;
  end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if v_listing is null then
    raise exception 'Listing not found.';
  end if;

  if v_listing.moderation_status <> 'pending_review' then
    raise exception 'This listing is not pending review.';
  end if;

  perform set_config('likha.allow_moderation_transition', 'true', true);
  update public.listings set moderation_status = p_decision where id = p_listing_id
  returning * into v_listing;

  return v_listing;
end;
$$;

grant execute on function public.moderate_listing to authenticated;

-- Notifications: add a listing anchor (mirrors how 0028 added job_post_id/job_order_id
-- for events with no project to hang off), and three shared kinds for both content
-- types -- the client branches display text on whether project_id or listing_id is set.
alter table public.notifications add column listing_id uuid references public.listings (id) on delete cascade;

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (
  kind in (
    'appreciation', 'follow', 'comment',
    'job_offer', 'job_offer_accepted', 'job_offer_rejected', 'job_offer_withdrawn',
    'job_order_milestone_paid', 'job_order_milestone_released',
    'job_order_update', 'job_order_revision', 'job_order_delivered', 'job_order_cancelled',
    'content_flagged', 'content_approved', 'content_rejected'
  )
);

-- Fires on insert (flagged at publish time) and on any later moderation_status change
-- (flagged again on edit, or an admin decision). No-ops on updates that don't touch the
-- column. actor_id is the creator themself for the initial flag (no "system" actor
-- concept in this schema) and the acting admin (auth.uid(), same trick as 0028's
-- handle_job_order_status_notification) for approve/reject.
create or replace function public.handle_project_moderation_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and new.moderation_status = old.moderation_status then
    return new;
  end if;

  if new.moderation_status = 'pending_review' then
    insert into public.notifications (recipient_id, actor_id, kind, project_id)
    values (new.creator_id, new.creator_id, 'content_flagged', new.id);
  elsif new.moderation_status = 'approved' then
    insert into public.notifications (recipient_id, actor_id, kind, project_id)
    values (new.creator_id, coalesce(auth.uid(), new.creator_id), 'content_approved', new.id);
  elsif new.moderation_status = 'rejected' then
    insert into public.notifications (recipient_id, actor_id, kind, project_id)
    values (new.creator_id, coalesce(auth.uid(), new.creator_id), 'content_rejected', new.id);
  end if;
  return new;
end;
$$;

create trigger on_project_insert_moderation_notify
  after insert on public.projects
  for each row execute function public.handle_project_moderation_notification();

create trigger on_project_moderation_update_notify
  after update of moderation_status on public.projects
  for each row execute function public.handle_project_moderation_notification();

create or replace function public.handle_listing_moderation_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and new.moderation_status = old.moderation_status then
    return new;
  end if;

  if new.moderation_status = 'pending_review' then
    insert into public.notifications (recipient_id, actor_id, kind, listing_id)
    values (new.creator_id, new.creator_id, 'content_flagged', new.id);
  elsif new.moderation_status = 'approved' then
    insert into public.notifications (recipient_id, actor_id, kind, listing_id)
    values (new.creator_id, coalesce(auth.uid(), new.creator_id), 'content_approved', new.id);
  elsif new.moderation_status = 'rejected' then
    insert into public.notifications (recipient_id, actor_id, kind, listing_id)
    values (new.creator_id, coalesce(auth.uid(), new.creator_id), 'content_rejected', new.id);
  end if;
  return new;
end;
$$;

create trigger on_listing_insert_moderation_notify
  after insert on public.listings
  for each row execute function public.handle_listing_moderation_notification();

create trigger on_listing_moderation_update_notify
  after update of moderation_status on public.listings
  for each row execute function public.handle_listing_moderation_notification();
