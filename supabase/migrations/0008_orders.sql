-- Phase 4: orders, order items, and a real (persisted) order status.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  subtotal numeric(10, 2) not null,
  shipping_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  status text not null default 'processing' check (status in ('processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null check (payment_method in ('cod', 'gcash', 'card')),
  -- Shipping address snapshot; null for all-digital orders that never needed one.
  address jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Buyers can view their own orders"
  on public.orders for select
  using (auth.uid() = buyer_id);

create policy "Buyers can place their own orders"
  on public.orders for insert
  with check (auth.uid() = buyer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Kept even if the listing is later deleted; item details are snapshotted below regardless.
  listing_id uuid references public.listings (id) on delete set null,
  title text not null,
  cover_url text,
  price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;

create policy "Buyers can view items in their own orders"
  on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.buyer_id = auth.uid()));

create policy "Buyers can insert items into their own orders"
  on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_items.order_id and o.buyer_id = auth.uid()));

-- Physical/made-to-order stock decrements on purchase; digital and made-to-order listings
-- (stock is null) are untouched, since they're not scarce in the same way.
create or replace function public.handle_order_item_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set stock = greatest(stock - new.quantity, 0)
  where id = new.listing_id and stock is not null;
  return new;
end;
$$;

create trigger on_order_item_created
  after insert on public.order_items
  for each row execute function public.handle_order_item_insert();
