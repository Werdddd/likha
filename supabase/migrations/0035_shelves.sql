-- "Shelves" -- private boards a buyer curates by saving listings/projects they want to
-- revisit later (Pinterest-style collections), per PROJECT_SPEC.md §6 "Save/collect projects
-- and products into boards/collections." Private to the owner only -- no public board view.

create table public.shelves (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  item_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index shelves_owner_id_idx on public.shelves (owner_id);

alter table public.shelves enable row level security;

create policy "Owners can read their own shelves"
  on public.shelves for select
  using (auth.uid() = owner_id);

create policy "Owners can create their own shelves"
  on public.shelves for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their own shelves"
  on public.shelves for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners can delete their own shelves"
  on public.shelves for delete
  using (auth.uid() = owner_id);

-- item_count is system-maintained (triggers below).
revoke update on public.shelves from authenticated;
grant update (name) on public.shelves to authenticated;

create table public.shelf_listings (
  shelf_id uuid not null references public.shelves (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (shelf_id, listing_id)
);

alter table public.shelf_listings enable row level security;

create policy "Owners can read items on their own shelves"
  on public.shelf_listings for select
  using (exists (select 1 from public.shelves s where s.id = shelf_listings.shelf_id and s.owner_id = auth.uid()));

create policy "Owners can save listings to their own shelves"
  on public.shelf_listings for insert
  with check (exists (select 1 from public.shelves s where s.id = shelf_listings.shelf_id and s.owner_id = auth.uid()));

create policy "Owners can remove listings from their own shelves"
  on public.shelf_listings for delete
  using (exists (select 1 from public.shelves s where s.id = shelf_listings.shelf_id and s.owner_id = auth.uid()));

create table public.shelf_projects (
  shelf_id uuid not null references public.shelves (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (shelf_id, project_id)
);

alter table public.shelf_projects enable row level security;

create policy "Owners can read projects on their own shelves"
  on public.shelf_projects for select
  using (exists (select 1 from public.shelves s where s.id = shelf_projects.shelf_id and s.owner_id = auth.uid()));

create policy "Owners can save projects to their own shelves"
  on public.shelf_projects for insert
  with check (exists (select 1 from public.shelves s where s.id = shelf_projects.shelf_id and s.owner_id = auth.uid()));

create policy "Owners can remove projects from their own shelves"
  on public.shelf_projects for delete
  using (exists (select 1 from public.shelves s where s.id = shelf_projects.shelf_id and s.owner_id = auth.uid()));

create or replace function public.handle_shelf_item_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.shelves set item_count = item_count + 1 where id = new.shelf_id;
  return new;
end;
$$;

create or replace function public.handle_shelf_item_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.shelves set item_count = greatest(item_count - 1, 0) where id = old.shelf_id;
  return old;
end;
$$;

create trigger on_shelf_listing_created
  after insert on public.shelf_listings
  for each row execute function public.handle_shelf_item_insert();

create trigger on_shelf_listing_deleted
  after delete on public.shelf_listings
  for each row execute function public.handle_shelf_item_delete();

create trigger on_shelf_project_created
  after insert on public.shelf_projects
  for each row execute function public.handle_shelf_item_insert();

create trigger on_shelf_project_deleted
  after delete on public.shelf_projects
  for each row execute function public.handle_shelf_item_delete();
