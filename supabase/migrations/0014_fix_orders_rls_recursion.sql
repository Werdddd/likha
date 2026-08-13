-- Fix: the creator-visibility policy added on `orders` in 0012 queries `order_items`, and
-- `order_items`' pre-existing buyer policy queries `orders` right back — Postgres detects this
-- as infinite recursion. Move the cross-table check into a security definer function so it
-- bypasses RLS internally (breaking the cycle) instead of a raw correlated subquery.

create or replace function public.order_belongs_to_creator(target_order_id uuid, target_creator_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.order_items oi
    join public.listings l on l.id = oi.listing_id
    where oi.order_id = target_order_id and l.creator_id = target_creator_id
  );
$$;

drop policy "Creators can view orders containing their listings" on public.orders;
create policy "Creators can view orders containing their listings"
  on public.orders for select
  using (public.order_belongs_to_creator(orders.id, auth.uid()));

drop policy "Creators can update status of orders containing their listings" on public.orders;
create policy "Creators can update status of orders containing their listings"
  on public.orders for update
  using (public.order_belongs_to_creator(orders.id, auth.uid()))
  with check (public.order_belongs_to_creator(orders.id, auth.uid()));
