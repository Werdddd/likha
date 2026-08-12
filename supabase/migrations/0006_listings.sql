-- Phase 3: marketplace listings (digital + physical products).

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  description text not null default '',
  cover_url text,
  price numeric(10, 2) not null check (price > 0),
  product_type text not null check (product_type in ('digital', 'physical')),
  category text not null,
  tags text[] not null default '{}',
  stock integer check (stock is null or stock >= 0),
  digital_file_path text,
  digital_file_name text,
  created_at timestamptz not null default now(),

  -- Category must belong to the product type's own taxonomy.
  constraint listings_category_matches_type check (
    (product_type = 'digital' and category in (
      'Digital Art', 'Templates', 'Illustrations', 'Stickers', 'Fonts', 'UI Kits', 'Presets'
    ))
    or
    (product_type = 'physical' and category in (
      'Prints', 'Crafts', 'Photography Prints'
    ))
  ),
  -- Digital goods are instant/unlimited (no stock); physical goods may be made-to-order (null stock).
  constraint listings_digital_has_no_stock check (product_type <> 'digital' or stock is null),
  -- A digital listing has nothing to deliver without an attached file.
  constraint listings_digital_requires_file check (product_type <> 'digital' or digital_file_path is not null)
);

alter table public.listings enable row level security;

create policy "Listings are publicly readable"
  on public.listings for select
  using (true);

create policy "Creators can insert their own listings"
  on public.listings for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their own listings"
  on public.listings for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "Creators can delete their own listings"
  on public.listings for delete
  using (auth.uid() = creator_id);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.listing_images enable row level security;

create policy "Listing images are publicly readable"
  on public.listing_images for select
  using (true);

create policy "Creators can manage images on their own listings"
  on public.listing_images for all
  using (exists (select 1 from public.listings l where l.id = listing_images.listing_id and l.creator_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_images.listing_id and l.creator_id = auth.uid()));
