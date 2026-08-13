-- Sellers previously had no way to take a listing down without deleting it outright (losing
-- order history references) or edit it after publishing. Add a soft on/off switch so a listing
-- can be deactivated ("delisted") and later reactivated ("relisted") without touching orders.
--
-- Public listing reads only return active listings; a signed-in creator can still see (and only
-- they can update/delete) their own listings regardless of active state, for the My Shop
-- management view.

alter table public.listings add column is_active boolean not null default true;

drop policy "Listings are publicly readable" on public.listings;
create policy "Active listings are publicly readable, owners can read all their own"
  on public.listings for select
  using (is_active or auth.uid() = creator_id);
