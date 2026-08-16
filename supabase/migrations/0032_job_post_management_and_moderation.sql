-- Bring job posts up to parity with projects/listings: owner edit/delete, and admin
-- hide/restore/remove moderation (0030/0031's pattern, applied to job_posts).

alter table public.job_posts add column moderation_status text not null default 'clean'
  check (moderation_status in ('clean', 'pending_review', 'approved', 'rejected'));
alter table public.job_posts add column moderation_reason text;

create trigger guard_job_post_moderation_status
  before update on public.job_posts
  for each row execute function public.guard_moderation_status_write();

drop policy "Job posts are publicly readable" on public.job_posts;
create policy "Clean/approved job posts are publicly readable, owners and admins can read all"
  on public.job_posts for select
  using (
    moderation_status in ('clean', 'approved')
    or auth.uid() = buyer_id
    or public.is_admin(auth.uid())
  );

drop policy "Buyers can create their own job posts" on public.job_posts;
create policy "Buyers can create their own job posts"
  on public.job_posts for insert
  with check (auth.uid() = buyer_id and moderation_status = 'clean');

-- Supersedes the cancel-only policy from 0021: buyers can now edit any content field while
-- the post is still open, and/or cancel it (open -> cancelled). moderation_status/reason stay
-- gated separately by the guard trigger above regardless of what this policy allows.
drop policy "Buyers can cancel their own open job post" on public.job_posts;
create policy "Buyers can edit or cancel their own open job post"
  on public.job_posts for update
  using (auth.uid() = buyer_id and status = 'open')
  with check (auth.uid() = buyer_id and status in ('open', 'cancelled'));

-- Fulfilled posts are excluded: job_orders/job_order_milestones cascade-delete from
-- job_posts, and a fulfilled post always has a real order with payments attached that must
-- not be destroyable by a plain delete.
create policy "Buyers can delete their own non-fulfilled job post"
  on public.job_posts for delete
  using (auth.uid() = buyer_id and status <> 'fulfilled');

-- notifications.job_post_id already exists (0028) but as on delete cascade, which would wipe
-- out the "your post was removed" notification the instant admin_delete_job_post() deletes the
-- post itself. Switch it to set-null, same fix 0031 applied to project_id/listing_id, so the
-- notification (and its content_title snapshot) survives; harmless for the older job_offer/
-- job_offer_accepted/etc. notification kinds too (0028) -- they just lose the deep link instead
-- of disappearing outright once the post is gone.
alter table public.notifications drop constraint notifications_job_post_id_fkey;
alter table public.notifications add constraint notifications_job_post_id_fkey
  foreign key (job_post_id) references public.job_posts (id) on delete set null;

create or replace function public.moderate_job_post(p_job_post_id uuid, p_action text, p_note text default null)
returns public.job_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_post public.job_posts;
  v_new_status text;
  v_kind text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can moderate job posts.';
  end if;
  if p_action not in ('hide', 'restore') then
    raise exception 'Invalid action: %', p_action;
  end if;

  select * into v_job_post from public.job_posts where id = p_job_post_id;
  if v_job_post is null then
    raise exception 'Job post not found.';
  end if;

  v_new_status := case p_action when 'hide' then 'rejected' else 'clean' end;
  v_kind := case p_action when 'hide' then 'content_hidden' else 'content_restored' end;

  perform set_config('likha.allow_moderation_transition', 'true', true);
  update public.job_posts set moderation_status = v_new_status, moderation_reason = p_note
    where id = p_job_post_id
  returning * into v_job_post;

  insert into public.notifications (recipient_id, actor_id, kind, job_post_id, note, content_title)
  values (v_job_post.buyer_id, auth.uid(), v_kind, v_job_post.id, p_note, v_job_post.title);

  return v_job_post;
end;
$$;

grant execute on function public.moderate_job_post to authenticated;

-- Admins hide a fulfilled post instead of hard-deleting it, for the same order-integrity
-- reason the owner-delete policy above excludes fulfilled posts.
create or replace function public.admin_delete_job_post(p_job_post_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_post public.job_posts;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can remove any job post.';
  end if;

  select * into v_job_post from public.job_posts where id = p_job_post_id;
  if v_job_post is null then
    raise exception 'Job post not found.';
  end if;

  if v_job_post.status = 'fulfilled' then
    raise exception 'This job post has an active order and cannot be deleted — hide it instead.';
  end if;

  insert into public.notifications (recipient_id, actor_id, kind, job_post_id, note, content_title)
  values (v_job_post.buyer_id, auth.uid(), 'content_removed', p_job_post_id, p_note, v_job_post.title);

  delete from public.job_posts where id = p_job_post_id;
end;
$$;

grant execute on function public.admin_delete_job_post to authenticated;
