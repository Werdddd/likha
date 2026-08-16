-- Real push delivery for the in-app notifications added in 0011/0028/0033/0037. Every
-- notification kind already lands as a row in public.notifications regardless of source (trigger
-- or SECURITY DEFINER RPC); this migration adds one more trigger on that table that fans each new
-- row out to the recipient's registered device(s) via the Expo Push API, so no per-event-source
-- changes are needed elsewhere.

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now()
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

-- Token is unique per row, not per (user_id, token): a device that's re-registered under a
-- different account (shared device, or same person's alt account) simply reassigns the existing
-- row via the client's upsert-on-conflict(token), so the old owner stops receiving pushes to it.
create policy "Users can view their own push tokens"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "Users can register their own push tokens"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can reassign or update their own push tokens"
  on public.push_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can remove their own push tokens"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

-- pg_net lets a trigger fire an outbound HTTP call without blocking the transaction (the request
-- is only dispatched after commit); registered in `extensions` per Supabase's convention so it
-- isn't exposed via the data API, but its functions still live under the fixed `net` schema.
create extension if not exists pg_net with schema extensions;

create or replace function public.send_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_name text;
  v_body text;
  v_tokens text[];
begin
  select name into v_actor_name from public.profiles where id = new.actor_id;
  v_actor_name := nullif(v_actor_name, '');
  v_actor_name := coalesce(v_actor_name, 'Someone');

  v_body := case new.kind
    when 'appreciation' then v_actor_name || ' appreciated your project'
    when 'follow' then v_actor_name || ' started following you'
    when 'comment' then v_actor_name || ' commented on your project'
    when 'job_offer' then v_actor_name || ' sent an offer on your job post'
    when 'job_offer_accepted' then v_actor_name || ' accepted your offer'
    when 'job_offer_rejected' then v_actor_name || ' declined your offer'
    when 'job_offer_withdrawn' then v_actor_name || ' withdrew their offer'
    when 'job_order_milestone_paid' then v_actor_name || ' submitted a milestone payment'
    when 'job_order_milestone_released' then v_actor_name || ' released a milestone payment'
    when 'job_order_update' then v_actor_name || ' posted a progress update'
    when 'job_order_revision' then v_actor_name || ' requested a revision'
    when 'job_order_delivered' then v_actor_name || ' marked your job order as delivered'
    when 'job_order_cancelled' then v_actor_name || ' cancelled the job order'
    when 'content_flagged' then 'Your submission is under review'
    when 'content_approved' then 'Your content was approved'
    when 'content_rejected' then 'Your content was rejected'
    when 'content_hidden' then 'Your content was hidden by a moderator'
    when 'content_restored' then 'Your content was restored'
    when 'content_removed' then 'Your content was removed by a moderator'
    when 'review' then v_actor_name || ' left a review on your listing'
    when 'order_placed' then v_actor_name || ' placed an order from your shop'
    when 'order_shipped' then 'Your order has shipped'
    when 'order_delivered' then 'Your order was marked delivered'
    when 'order_rejected' then 'Your order was rejected'
    when 'order_cancelled' then v_actor_name || ' cancelled their order'
    when 'payment_verified' then 'Your payment was verified'
    when 'message' then v_actor_name || ' sent you a message'
    when 'job_post_comment' then v_actor_name || ' commented on your job post'
    else v_actor_name || ' sent you a notification'
  end;

  select array_agg(token) into v_tokens from public.push_tokens where user_id = new.recipient_id;
  if v_tokens is null or array_length(v_tokens, 1) is null then
    return new;
  end if;

  -- One request fans out to every device on this account; Expo accepts an array in `to`.
  -- pg_net always creates its objects in a fixed `net` schema regardless of the `with schema`
  -- clause used to register the extension above.
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'to', to_jsonb(v_tokens),
      'title', 'Likha',
      'body', v_body,
      'sound', 'default',
      'data', jsonb_build_object(
        'kind', new.kind,
        'notificationId', new.id,
        'creatorId', new.actor_id,
        'projectId', new.project_id,
        'jobPostId', new.job_post_id,
        'jobOrderId', new.job_order_id,
        'listingId', new.listing_id,
        'orderId', new.order_id,
        'conversationId', new.conversation_id
      )
    )
  );

  return new;
end;
$$;

create trigger on_notification_push
  after insert on public.notifications
  for each row execute function public.send_push_notification();
