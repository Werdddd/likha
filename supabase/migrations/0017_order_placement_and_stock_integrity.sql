-- Two related fixes to the order-placement path:
--
-- 1. The stock-decrement trigger from 0008 floored at zero instead of rejecting the purchase,
--    so two buyers racing (or one buyer over-ordering) could oversell a limited-stock listing.
--    It now raises, which aborts the whole insert.
-- 2. placeOrder() previously did two separate client-side inserts (orders, then order_items).
--    If the second insert failed (e.g. the stock check above now rejects it), the order row
--    from the first insert was already committed and orphaned with zero items. Moving order
--    placement into a single security-definer function makes it one transaction: either both
--    the order and its items land, or neither does.
--
-- Also adds a matching restock step: when a creator rejects an order (or it's cancelled) after
-- stock was already decremented, the reserved units go back into inventory.

create or replace function public.handle_order_item_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining integer;
begin
  update public.listings
  set stock = stock - new.quantity
  where id = new.listing_id and stock is not null
  returning stock into v_remaining;

  if v_remaining is not null and v_remaining < 0 then
    raise exception 'Not enough stock left for this item.';
  end if;

  return new;
end;
$$;

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

  return v_order;
end;
$$;

grant execute on function public.place_order to authenticated;

-- Restock reserved units when an order lands in a terminal non-fulfilled state.
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('cancelled', 'rejected') and old.status not in ('cancelled', 'rejected') then
    update public.listings l
    set stock = l.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = new.id
      and oi.listing_id = l.id
      and l.stock is not null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  after update of status on public.orders
  for each row execute function public.handle_order_status_change();
