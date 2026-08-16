-- The Shop order flow (orders/order_items, distinct from job_orders) and direct messaging have
-- never raised a notification, unlike every other marketplace interaction (job orders, reviews,
-- comments). Wire them up the same way: SECURITY DEFINER triggers, no client-side insert path.
-- Also covers job post comments, which fell through the same gap as project comments were fixed
-- in 0011 but job post comments (0021) never got the equivalent.

alter table public.notifications add column order_id uuid references public.orders (id) on delete cascade;
alter table public.notifications add column conversation_id uuid references public.conversations (id) on delete cascade;

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (
  kind in (
    'appreciation', 'follow', 'comment',
    'job_offer', 'job_offer_accepted', 'job_offer_rejected', 'job_offer_withdrawn',
    'job_order_milestone_paid', 'job_order_milestone_released',
    'job_order_update', 'job_order_revision', 'job_order_delivered', 'job_order_cancelled',
    'content_flagged', 'content_approved', 'content_rejected',
    'content_hidden', 'content_restored', 'content_removed',
    'review',
    'order_placed', 'order_shipped', 'order_delivered', 'order_rejected', 'order_cancelled',
    'payment_verified',
    'message',
    'job_post_comment'
  )
);

-- Order placed -> notify each distinct seller with an item in it (an order can span multiple
-- sellers, per 0014's comment). Folded into place_order() itself, same as the rest of that
-- function, rather than a per-order_item trigger, so one seller with several line items in the
-- same order gets a single notification instead of one per item.
create or replace function public.place_order(
  p_subtotal numeric,
  p_shipping_fee numeric,
  p_total numeric,
  p_payment_method text,
  p_payment_proof_path text,
  p_address jsonb,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item jsonb;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to place an order.';
  end if;

  insert into public.orders (buyer_id, subtotal, shipping_fee, total, payment_method, payment_proof_path, address)
  values (auth.uid(), p_subtotal, p_shipping_fee, p_total, p_payment_method, p_payment_proof_path, p_address)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (order_id, listing_id, title, cover_url, price, quantity, product_type)
    values (
      v_order.id,
      (v_item ->> 'listing_id')::uuid,
      v_item ->> 'title',
      v_item ->> 'cover_url',
      (v_item ->> 'price')::numeric,
      (v_item ->> 'quantity')::integer,
      v_item ->> 'product_type'
    );
  end loop;

  insert into public.notifications (recipient_id, actor_id, kind, order_id)
  select distinct l.creator_id, v_order.buyer_id, 'order_placed', v_order.id
  from public.order_items oi
  join public.listings l on l.id = oi.listing_id
  where oi.order_id = v_order.id and l.creator_id <> v_order.buyer_id;

  return v_order;
end;
$$;

-- Status changes: shipped/delivered/rejected are seller actions -> notify the buyer; cancelled
-- is a buyer action (0019's RLS policy is the only path to it) -> notify every distinct seller
-- with an item in the order.
create or replace function public.handle_order_status_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status in ('shipped', 'delivered', 'rejected') then
    insert into public.notifications (recipient_id, actor_id, kind, order_id)
    values (
      new.buyer_id,
      auth.uid(),
      case new.status
        when 'shipped' then 'order_shipped'
        when 'delivered' then 'order_delivered'
        else 'order_rejected'
      end,
      new.id
    );
  elsif new.status = 'cancelled' and auth.uid() is not null then
    insert into public.notifications (recipient_id, actor_id, kind, order_id)
    select distinct l.creator_id, auth.uid(), 'order_cancelled', new.id
    from public.order_items oi
    join public.listings l on l.id = oi.listing_id
    where oi.order_id = new.id and l.creator_id <> auth.uid();
  end if;
  return new;
end;
$$;

create trigger on_order_status_notify
  after update of status on public.orders
  for each row execute function public.handle_order_status_notification();

-- Payment verified -> notify the buyer.
create or replace function public.handle_payment_verified_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_verified and not old.payment_verified then
    insert into public.notifications (recipient_id, actor_id, kind, order_id)
    values (new.buyer_id, auth.uid(), 'payment_verified', new.id);
  end if;
  return new;
end;
$$;

create trigger on_payment_verified_notify
  after update of payment_verified on public.orders
  for each row execute function public.handle_payment_verified_notification();

-- New message -> notify the other conversation participant.
create or replace function public.handle_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
begin
  select case when user_a_id = new.sender_id then user_b_id else user_a_id end
  into v_recipient
  from public.conversations
  where id = new.conversation_id;

  if v_recipient is not null then
    insert into public.notifications (recipient_id, actor_id, kind, conversation_id)
    values (v_recipient, new.sender_id, 'message', new.conversation_id);
  end if;
  return new;
end;
$$;

create trigger on_message_notify
  after insert on public.messages
  for each row execute function public.handle_message_notification();

-- Job post comment -> notify the buyer who posted it (mirrors handle_comment_notification for
-- projects; job post comments never got this in 0021).
create or replace function public.handle_job_post_comment_notification()
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
    values (v_buyer, new.creator_id, 'job_post_comment', new.job_post_id);
  end if;
  return new;
end;
$$;

create trigger on_job_post_comment_notify
  after insert on public.job_post_comments
  for each row execute function public.handle_job_post_comment_notification();
