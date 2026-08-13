-- Sellers shouldn't be able to buy their own listings (fake sales history, gaming the top-listings
-- ranking and stock counts, etc). The app UI already hides the buy actions on a seller's own
-- listing, but that's only a UX nicety — enforce it at the same transactional boundary that
-- already guards stock, so a direct API call can't bypass it.

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

  if exists (
    select 1
    from public.listings l
    where l.id in (select (elem ->> 'listing_id')::uuid from jsonb_array_elements(p_items) elem)
      and l.creator_id = auth.uid()
  ) then
    raise exception 'You can''t purchase your own listing.';
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
