-- Sellers previously could only deliver a digital product as an uploaded file. Add support for
-- named external links (e.g. a Canva/Figma template link, a Google Drive folder) as an
-- alternative or additional deliverable alongside the uploaded file.
--
-- Links are treated like the digital file itself: private to the owner until a buyer has
-- completed a purchase, mirroring the storage RLS added for digital_file_path in
-- 0009/0015_digital_download_requires_completion.

create table public.listing_links (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  label text not null default '',
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.listing_links enable row level security;

create policy "Creators can manage links on their own listings"
  on public.listing_links for all
  using (exists (select 1 from public.listings l where l.id = listing_links.listing_id and l.creator_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_links.listing_id and l.creator_id = auth.uid()));

create policy "Buyers can read links they purchased and completed"
  on public.listing_links for select
  using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.listing_id = listing_links.listing_id
        and o.buyer_id = auth.uid()
        and o.status = 'delivered'
    )
  );

-- A digital listing's deliverable can now be an uploaded file, one or more links, or both --
-- no longer just a file. Links live in a child table inserted after the listing row exists (same
-- two-step pattern as listing_images), so this can no longer be a same-row check constraint;
-- the "at least one deliverable" rule is enforced client-side instead.
alter table public.listings drop constraint listings_digital_requires_file;
