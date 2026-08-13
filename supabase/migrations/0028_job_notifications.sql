-- Job post / job order activity never raised a notification (the 0011 notifications table only
-- knew about 'appreciation' | 'follow' | 'comment', each hung off project_id). Add job_post_id /
-- job_order_id as their own nullable FKs -- job events don't have a project to anchor to -- and a
-- trigger per action, mirroring the handle_*_notification() pattern from 0011.

alter table public.notifications add column job_post_id uuid references public.job_posts (id) on delete cascade;
alter table public.notifications add column job_order_id uuid references public.job_orders (id) on delete cascade;

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (
  kind in (
    'appreciation', 'follow', 'comment',
    'job_offer', 'job_offer_accepted', 'job_offer_rejected', 'job_offer_withdrawn',
    'job_order_milestone_paid', 'job_order_milestone_released',
    'job_order_update', 'job_order_revision', 'job_order_delivered', 'job_order_cancelled'
  )
);

-- New offer submitted -> notify the post's buyer.
create or replace function public.handle_job_offer_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
begin
  select buyer_id into v_buyer from public.job_posts where id = new.job_post_id;
  if v_buyer is not null and v_buyer <> new.creator_id then
    insert into public.notifications (recipient_id, actor_id, kind, job_post_id)
    values (v_buyer, new.creator_id, 'job_offer', new.job_post_id);
  end if;
  return new;
end;
$$;

create trigger on_job_offer_notify
  after insert on public.job_offers
  for each row execute function public.handle_job_offer_notification();

-- Offer accepted / rejected / withdrawn -> notify the creator who made it. Fires for both the
-- buyer's explicit accept/reject and the mass "not_selected" side effect inside accept_job_offer().
create or replace function public.handle_job_offer_status_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
begin
  if new.status = old.status then
    return new;
  end if;

  select buyer_id into v_buyer from public.job_posts where id = new.job_post_id;
  if v_buyer is null then
    return new;
  end if;

  if new.status = 'accepted' then
    insert into public.notifications (recipient_id, actor_id, kind, job_post_id)
    values (new.creator_id, v_buyer, 'job_offer_accepted', new.job_post_id);
  elsif new.status = 'not_selected' and old.status = 'pending' then
    insert into public.notifications (recipient_id, actor_id, kind, job_post_id)
    values (new.creator_id, v_buyer, 'job_offer_rejected', new.job_post_id);
  elsif new.status = 'withdrawn' then
    insert into public.notifications (recipient_id, actor_id, kind, job_post_id)
    values (v_buyer, new.creator_id, 'job_offer_withdrawn', new.job_post_id);
  end if;
  return new;
end;
$$;

create trigger on_job_offer_status_notify
  after update of status on public.job_offers
  for each row execute function public.handle_job_offer_status_notification();

-- Milestone payment submitted -> notify the creator; released -> notify the buyer.
create or replace function public.handle_job_order_milestone_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.job_orders;
begin
  if new.status = old.status then
    return new;
  end if;

  select * into v_order from public.job_orders where id = new.job_order_id;
  if v_order is null then
    return new;
  end if;

  if new.status = 'paid' then
    insert into public.notifications (recipient_id, actor_id, kind, job_order_id)
    values (v_order.creator_id, v_order.buyer_id, 'job_order_milestone_paid', v_order.id);
  elsif new.status = 'released' then
    insert into public.notifications (recipient_id, actor_id, kind, job_order_id)
    values (v_order.buyer_id, v_order.creator_id, 'job_order_milestone_released', v_order.id);
  end if;
  return new;
end;
$$;

create trigger on_job_order_milestone_notify
  after update of status on public.job_order_milestones
  for each row execute function public.handle_job_order_milestone_notification();

-- Progress update posted -> notify the buyer.
create or replace function public.handle_job_order_update_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
begin
  select buyer_id into v_buyer from public.job_orders where id = new.job_order_id;
  if v_buyer is not null and v_buyer <> new.creator_id then
    insert into public.notifications (recipient_id, actor_id, kind, job_order_id)
    values (v_buyer, new.creator_id, 'job_order_update', new.job_order_id);
  end if;
  return new;
end;
$$;

create trigger on_job_order_update_notify
  after insert on public.job_order_updates
  for each row execute function public.handle_job_order_update_notification();

-- Status changes: delivered -> notify buyer, revision -> notify creator, cancelled -> notify
-- whichever side didn't do the cancelling (auth.uid() inside the trigger still reflects the
-- calling user even though cancel_job_order() runs as security definer).
create or replace function public.handle_job_order_status_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'delivered' then
    insert into public.notifications (recipient_id, actor_id, kind, job_order_id)
    values (new.buyer_id, new.creator_id, 'job_order_delivered', new.id);
  elsif new.status = 'revision' then
    insert into public.notifications (recipient_id, actor_id, kind, job_order_id)
    values (new.creator_id, new.buyer_id, 'job_order_revision', new.id);
  elsif new.status = 'cancelled' and auth.uid() is not null then
    insert into public.notifications (recipient_id, actor_id, kind, job_order_id)
    values (
      case when auth.uid() = new.buyer_id then new.creator_id else new.buyer_id end,
      auth.uid(),
      'job_order_cancelled',
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger on_job_order_status_notify
  after update of status on public.job_orders
  for each row execute function public.handle_job_order_status_notification();
