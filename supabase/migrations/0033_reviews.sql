-- Reviews tied to completed orders, per PROJECT_SPEC.md §5 -- displayed on both the order and
-- the public listing. Scoped to order_item/listing, not the whole order, since a single order
-- can span multiple sellers (see 0008/MARKETPLACE_STATUS.md §3).

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.order_items (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now()
);

create index reviews_listing_id_idx on public.reviews (listing_id);
create index reviews_creator_id_idx on public.reviews (creator_id);

alter table public.reviews enable row level security;

create policy "Reviews are publicly readable"
  on public.reviews for select
  using (true);

-- Cross-validates listing_id/creator_id/buyer_id against the real purchase so a client can't
-- spoof who or what it's reviewing, or review an order that isn't actually delivered.
create policy "Buyers can review delivered items they bought"
  on public.reviews for insert
  with check (
    auth.uid() = buyer_id
    and exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      join public.listings l on l.id = oi.listing_id
      where oi.id = order_item_id
        and oi.listing_id = listing_id
        and l.creator_id = creator_id
        and o.buyer_id = auth.uid()
        and o.status = 'delivered'
    )
  );

create policy "Buyers can edit their own reviews"
  on public.reviews for update
  using (auth.uid() = buyer_id)
  with check (auth.uid() = buyer_id);

create policy "Buyers can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = buyer_id);

-- order_item_id/listing_id/creator_id/buyer_id are set once at insert time and never editable.
revoke update on public.reviews from authenticated;
grant update (rating, body) on public.reviews to authenticated;

alter table public.listings add column rating_avg numeric(2, 1) not null default 0;
alter table public.listings add column rating_count integer not null default 0;

-- listings previously had no column-level update restriction at all (RLS row check only), so
-- without this a seller could update their own listing row and set rating_avg/rating_count
-- directly. Lock it down the same way projects/notifications already are.
revoke update on public.listings from authenticated;
grant update (
  title, description, price, category, tags, stock,
  digital_file_path, digital_file_name, cover_url, project_id, is_active
) on public.listings to authenticated;

create or replace function public.handle_review_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_id uuid;
begin
  v_listing_id := case when tg_op = 'DELETE' then old.listing_id else new.listing_id end;

  update public.listings
  set
    rating_avg = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where listing_id = v_listing_id), 0),
    rating_count = (select count(*) from public.reviews where listing_id = v_listing_id)
  where id = v_listing_id;

  return coalesce(new, old);
end;
$$;

create trigger on_review_created
  after insert on public.reviews
  for each row execute function public.handle_review_change();

create trigger on_review_updated
  after update on public.reviews
  for each row execute function public.handle_review_change();

create trigger on_review_deleted
  after delete on public.reviews
  for each row execute function public.handle_review_change();

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (
  kind in (
    'appreciation', 'follow', 'comment',
    'job_offer', 'job_offer_accepted', 'job_offer_rejected', 'job_offer_withdrawn',
    'job_order_milestone_paid', 'job_order_milestone_released',
    'job_order_update', 'job_order_revision', 'job_order_delivered', 'job_order_cancelled',
    'content_flagged', 'content_approved', 'content_rejected',
    'content_hidden', 'content_restored', 'content_removed',
    'review'
  )
);

create or replace function public.handle_review_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, actor_id, kind, listing_id)
  values (new.creator_id, new.buyer_id, 'review', new.listing_id);
  return new;
end;
$$;

create trigger on_review_notify
  after insert on public.reviews
  for each row execute function public.handle_review_notification();
