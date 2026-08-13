-- Phase 6 follow-up: snapshot each order item's product type (digital vs physical) so the
-- fulfillment flow (shipping vs download) survives even if the listing is later edited or
-- deleted, and add a 'rejected' terminal status a creator can use when they can't fulfill.

alter table public.order_items add column product_type text check (product_type in ('digital', 'physical'));

update public.order_items oi
set product_type = l.product_type
from public.listings l
where l.id = oi.listing_id and oi.product_type is null;

-- Any remaining rows (listing already deleted before this migration ran) default to physical,
-- the safer assumption since it keeps the shipping flow rather than silently losing a step.
update public.order_items set product_type = 'physical' where product_type is null;

alter table public.order_items alter column product_type set not null;

alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('processing', 'shipped', 'delivered', 'cancelled', 'rejected'));
