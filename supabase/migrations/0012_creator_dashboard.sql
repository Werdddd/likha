-- Phase 6: creator dashboard access to orders/order_items that contain their listings.
-- Orders can currently only be seen/updated by the buyer; creators need read access
-- (to fulfill orders) and the ability to advance status for orders containing their items.

create policy "Creators can view order items for their listings"
  on public.order_items for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = order_items.listing_id and l.creator_id = auth.uid()
    )
  );

create policy "Creators can view orders containing their listings"
  on public.orders for select
  using (
    exists (
      select 1 from public.order_items oi
      join public.listings l on l.id = oi.listing_id
      where oi.order_id = orders.id and l.creator_id = auth.uid()
    )
  );

-- Order-level status only (no per-seller fulfillment split yet), so a creator advancing
-- status affects the whole order even if it also contains another seller's items.
create policy "Creators can update status of orders containing their listings"
  on public.orders for update
  using (
    exists (
      select 1 from public.order_items oi
      join public.listings l on l.id = oi.listing_id
      where oi.order_id = orders.id and l.creator_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.order_items oi
      join public.listings l on l.id = oi.listing_id
      where oi.order_id = orders.id and l.creator_id = auth.uid()
    )
  );
