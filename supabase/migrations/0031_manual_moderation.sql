-- Pause the automatic Layer 1 AI-detection gating from 0030 (allow all new posts to
-- publish immediately again) and replace it with manual admin moderation instead:
-- admins can hide or permanently remove any project/listing, always with a note that's
-- delivered to the owner as a notification. Regular users can delete their own projects
-- (listings already had this via 0018). moderation_status/moderation_reason stick
-- around unchanged as columns -- they're just driven by admin action now instead of the
-- on-device metadata check, so re-enabling Layer 1 later is a client-side change only.

-- Un-stick anything left mid-review from testing the paused flow.
update public.projects set moderation_status = 'clean' where moderation_status = 'pending_review';
update public.listings set moderation_status = 'clean' where moderation_status = 'pending_review';

-- Notification creation now happens directly inside the admin RPCs below (one insert
-- per explicit admin action, carrying the action + note together) instead of a generic
-- trigger diffing status changes -- simpler once there's no separate "auto-flagged vs.
-- admin-decided" distinction to reconstruct after the fact.
drop trigger if exists on_project_insert_moderation_notify on public.projects;
drop trigger if exists on_project_moderation_update_notify on public.projects;
drop trigger if exists on_listing_insert_moderation_notify on public.listings;
drop trigger if exists on_listing_moderation_update_notify on public.listings;
drop function if exists public.handle_project_moderation_notification();
drop function if exists public.handle_listing_moderation_notification();

-- The client never writes moderation_status/moderation_reason itself now (the on-device
-- check that used to do this is paused) -- simplify the guard trigger from 0030 to
-- block ANY plain-client change to either column outright; only the admin RPCs below
-- (via the transaction-local flag) can move them.
create or replace function public.guard_moderation_status_write()
returns trigger
language plpgsql
as $$
begin
  if new.moderation_status = old.moderation_status
     and new.moderation_reason is not distinct from old.moderation_reason then
    return new;
  end if;

  if coalesce(current_setting('likha.allow_moderation_transition', true), '') = 'true' then
    return new;
  end if;

  raise exception 'moderation_status/moderation_reason can only be changed by an admin.';
end;
$$;
-- guard_project_moderation_status / guard_listing_moderation_status (0030) already
-- point at this function and don't need to be recreated.

drop policy "Creators can insert their own projects" on public.projects;
create policy "Creators can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = creator_id and moderation_status = 'clean');

drop policy "Creators can insert their own listings" on public.listings;
create policy "Creators can insert their own listings"
  on public.listings for insert
  with check (auth.uid() = creator_id and moderation_status = 'clean');

-- A free-text admin note, and a title snapshot for the case where the underlying post
-- is gone by the time the recipient reads the notification (see the FK change below).
alter table public.notifications add column note text;
alter table public.notifications add column content_title text;

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (
  kind in (
    'appreciation', 'follow', 'comment',
    'job_offer', 'job_offer_accepted', 'job_offer_rejected', 'job_offer_withdrawn',
    'job_order_milestone_paid', 'job_order_milestone_released',
    'job_order_update', 'job_order_revision', 'job_order_delivered', 'job_order_cancelled',
    'content_flagged', 'content_approved', 'content_rejected',
    'content_hidden', 'content_restored', 'content_removed'
  )
);

-- A "your post was removed" notification is inserted right before the post itself is
-- deleted -- if project_id/listing_id still cascaded, that delete would immediately
-- take the notification down with it. Switch both to set-null so the notification (and
-- its content_title snapshot) survives; harmless for the older notification kinds too
-- (appreciation/comment notifications about a since-deleted project now just lose the
-- deep link instead of disappearing outright).
alter table public.notifications drop constraint notifications_project_id_fkey;
alter table public.notifications add constraint notifications_project_id_fkey
  foreign key (project_id) references public.projects (id) on delete set null;

alter table public.notifications drop constraint notifications_listing_id_fkey;
alter table public.notifications add constraint notifications_listing_id_fkey
  foreign key (listing_id) references public.listings (id) on delete set null;

-- Admin hide/restore: works on any project regardless of current status (no more
-- "must currently be pending_review" gate from 0030 -- that only made sense for the
-- automatic flow). Always notifies the owner, with the admin's note attached.
-- The signature changed from 0030's (uuid, text) to (uuid, text, text) -- `create or
-- replace` only replaces a function with an identical signature, so the old two-arg
-- version has to be dropped explicitly or it lingers as an overload and makes `grant`
-- ambiguous below.
drop function if exists public.moderate_project(uuid, text);
create or replace function public.moderate_project(p_project_id uuid, p_action text, p_note text default null)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects;
  v_new_status text;
  v_kind text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can moderate projects.';
  end if;
  if p_action not in ('hide', 'restore') then
    raise exception 'Invalid action: %', p_action;
  end if;

  select * into v_project from public.projects where id = p_project_id;
  if v_project is null then
    raise exception 'Project not found.';
  end if;

  v_new_status := case p_action when 'hide' then 'rejected' else 'clean' end;
  v_kind := case p_action when 'hide' then 'content_hidden' else 'content_restored' end;

  perform set_config('likha.allow_moderation_transition', 'true', true);
  update public.projects set moderation_status = v_new_status, moderation_reason = p_note
    where id = p_project_id
  returning * into v_project;

  insert into public.notifications (recipient_id, actor_id, kind, project_id, note, content_title)
  values (v_project.creator_id, auth.uid(), v_kind, v_project.id, p_note, v_project.title);

  return v_project;
end;
$$;

grant execute on function public.moderate_project to authenticated;

drop function if exists public.moderate_listing(uuid, text);
create or replace function public.moderate_listing(p_listing_id uuid, p_action text, p_note text default null)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.listings;
  v_new_status text;
  v_kind text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can moderate listings.';
  end if;
  if p_action not in ('hide', 'restore') then
    raise exception 'Invalid action: %', p_action;
  end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if v_listing is null then
    raise exception 'Listing not found.';
  end if;

  v_new_status := case p_action when 'hide' then 'rejected' else 'clean' end;
  v_kind := case p_action when 'hide' then 'content_hidden' else 'content_restored' end;

  perform set_config('likha.allow_moderation_transition', 'true', true);
  update public.listings set moderation_status = v_new_status, moderation_reason = p_note
    where id = p_listing_id
  returning * into v_listing;

  insert into public.notifications (recipient_id, actor_id, kind, listing_id, note, content_title)
  values (v_listing.creator_id, auth.uid(), v_kind, v_listing.id, p_note, v_listing.title);

  return v_listing;
end;
$$;

grant execute on function public.moderate_listing to authenticated;

-- Admin hard-delete of someone else's post. Self-delete already works for both tables
-- via the plain "Creators can delete their own X" RLS policy (0003/0006) -- these RPCs
-- are only needed for an admin acting on a post they don't own (security definer
-- bypasses RLS, mirrors moderate_project/moderate_listing above).
create or replace function public.admin_delete_project(p_project_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can remove any project.';
  end if;

  select * into v_project from public.projects where id = p_project_id;
  if v_project is null then
    raise exception 'Project not found.';
  end if;

  insert into public.notifications (recipient_id, actor_id, kind, note, content_title)
  values (v_project.creator_id, auth.uid(), 'content_removed', p_note, v_project.title);

  delete from public.projects where id = p_project_id;
end;
$$;

grant execute on function public.admin_delete_project to authenticated;

create or replace function public.admin_delete_listing(p_listing_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.listings;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can remove any listing.';
  end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if v_listing is null then
    raise exception 'Listing not found.';
  end if;

  insert into public.notifications (recipient_id, actor_id, kind, note, content_title)
  values (v_listing.creator_id, auth.uid(), 'content_removed', p_note, v_listing.title);

  delete from public.listings where id = p_listing_id;
end;
$$;

grant execute on function public.admin_delete_listing to authenticated;
