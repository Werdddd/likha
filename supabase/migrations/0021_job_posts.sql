-- Job Posts: buyer posts a need, creators respond with offers, buyer accepts one and it
-- converts into a job order with staged deposit -> balance milestone payments (manual proof
-- of payment, same trust level as Shop orders, but two payments instead of one). Modeled as a
-- fully separate set of tables rather than extending `orders`/`order_items`, since job orders
-- are always single-item/one-to-one (one accepted offer -> one order) and need a milestone
-- concept that the Shop cart/stock pipeline has no use for.

create table public.job_posts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null
    check (category in ('Illustration', 'Graphic Design', 'Photography', 'UI/UX Design', 'Writing', '3D Art', 'Crafts')),
  budget_min numeric(10, 2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(10, 2) check (budget_max is null or budget_max >= 0),
  budget_flexible boolean not null default false,
  deadline date,
  deliverable_type text not null check (deliverable_type in ('digital', 'physical')),
  region text check (region is null or region in ('Manila', 'Cebu', 'Davao', 'Iloilo', 'Baguio', 'Bacolod')),
  status text not null default 'open' check (status in ('open', 'fulfilled', 'cancelled')),
  offer_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),

  constraint job_posts_budget_range check (budget_min is null or budget_max is null or budget_max >= budget_min)
);

alter table public.job_posts enable row level security;

create policy "Job posts are publicly readable"
  on public.job_posts for select
  using (true);

create policy "Buyers can create their own job posts"
  on public.job_posts for insert
  with check (auth.uid() = buyer_id);

-- Acceptance ('fulfilled') is set inside accept_job_offer() below, which runs as security
-- definer and so bypasses this policy; buyers only need direct write access to cancel.
create policy "Buyers can cancel their own open job post"
  on public.job_posts for update
  using (auth.uid() = buyer_id and status = 'open')
  with check (auth.uid() = buyer_id and status = 'cancelled');

create table public.job_post_images (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references public.job_posts (id) on delete cascade,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.job_post_images enable row level security;

create policy "Job post images are publicly readable"
  on public.job_post_images for select
  using (true);

create policy "Buyers can manage images on their own job posts"
  on public.job_post_images for all
  using (exists (select 1 from public.job_posts jp where jp.id = job_post_images.job_post_id and jp.buyer_id = auth.uid()))
  with check (exists (select 1 from public.job_posts jp where jp.id = job_post_images.job_post_id and jp.buyer_id = auth.uid()));

create table public.job_offers (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references public.job_posts (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  price numeric(10, 2) not null check (price > 0),
  turnaround_days integer not null check (turnaround_days > 0),
  pitch text not null,
  portfolio_project_id uuid references public.projects (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'not_selected', 'withdrawn')),
  created_at timestamptz not null default now(),

  unique (job_post_id, creator_id)
);

alter table public.job_offers enable row level security;

-- Sealed-bid: an offer is visible to the creator who made it and to the post's buyer (who can
-- compare all offers on their own post), not to the public. Only the comment thread is public.
create policy "Offer participants can view it"
  on public.job_offers for select
  using (
    auth.uid() = creator_id
    or exists (select 1 from public.job_posts jp where jp.id = job_offers.job_post_id and jp.buyer_id = auth.uid())
  );

create policy "Creators can submit an offer on an open job post"
  on public.job_offers for insert
  with check (
    auth.uid() = creator_id
    and exists (select 1 from public.job_posts jp where jp.id = job_offers.job_post_id and jp.status = 'open')
  );

-- Acceptance/rejection status changes happen only inside accept_job_offer() below.
create policy "Creators can withdraw their own pending offer"
  on public.job_offers for update
  using (auth.uid() = creator_id and status = 'pending')
  with check (auth.uid() = creator_id and status = 'withdrawn');

create or replace function public.handle_job_offer_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.job_posts set offer_count = offer_count + 1 where id = new.job_post_id;
  return new;
end;
$$;

create trigger on_job_offer_created
  after insert on public.job_offers
  for each row execute function public.handle_job_offer_insert();

create table public.job_post_comments (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references public.job_posts (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.job_post_comments enable row level security;

create policy "Job post comments are publicly readable"
  on public.job_post_comments for select
  using (true);

create policy "Users can comment on a job post as themselves"
  on public.job_post_comments for insert
  with check (auth.uid() = creator_id);

create policy "Users can delete their own job post comments"
  on public.job_post_comments for delete
  using (auth.uid() = creator_id);

create or replace function public.handle_job_post_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.job_posts set comment_count = comment_count + 1 where id = new.job_post_id;
  return new;
end;
$$;

create trigger on_job_post_comment_created
  after insert on public.job_post_comments
  for each row execute function public.handle_job_post_comment_insert();

create or replace function public.handle_job_post_comment_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.job_posts set comment_count = greatest(comment_count - 1, 0) where id = old.job_post_id;
  return old;
end;
$$;

create trigger on_job_post_comment_deleted
  after delete on public.job_post_comments
  for each row execute function public.handle_job_post_comment_delete();

-- job_orders stores buyer_id/creator_id directly (unlike orders/order_items, which needed the
-- security-definer helper in 0014 to dodge RLS recursion) so plain equality policies suffice.
create table public.job_orders (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null unique references public.job_posts (id) on delete cascade,
  offer_id uuid not null unique references public.job_offers (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  price numeric(10, 2) not null,
  deliverable_type text not null check (deliverable_type in ('digital', 'physical')),
  address jsonb,
  status text not null default 'deposit_pending'
    check (status in ('deposit_pending', 'in_progress', 'revision', 'delivered', 'completed', 'cancelled')),
  final_file_path text,
  final_file_name text,
  created_at timestamptz not null default now()
);

alter table public.job_orders enable row level security;

-- No insert policy: rows are only created by accept_job_offer(), which runs as security
-- definer and bypasses RLS.
create policy "Participants can view their job order"
  on public.job_orders for select
  using (auth.uid() = buyer_id or auth.uid() = creator_id);

create policy "Creators can advance their job order"
  on public.job_orders for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Buyers only need write access here to set the shipping address on a physical job order
-- (same trust level as the rest of this manual-payment stub: ownership-scoped, not column-scoped).
create policy "Buyers can update their job order"
  on public.job_orders for update
  using (auth.uid() = buyer_id)
  with check (auth.uid() = buyer_id);

create table public.job_order_milestones (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references public.job_orders (id) on delete cascade,
  kind text not null check (kind in ('deposit', 'final')),
  amount numeric(10, 2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'released')),
  payment_proof_path text,
  created_at timestamptz not null default now(),

  unique (job_order_id, kind)
);

alter table public.job_order_milestones enable row level security;

-- No insert policy: rows are only created by accept_job_offer().
create policy "Participants can view their job order milestones"
  on public.job_order_milestones for select
  using (
    exists (
      select 1 from public.job_orders jo
      where jo.id = job_order_milestones.job_order_id
        and (jo.buyer_id = auth.uid() or jo.creator_id = auth.uid())
    )
  );

create policy "Buyers can submit payment proof for their milestones"
  on public.job_order_milestones for update
  using (exists (select 1 from public.job_orders jo where jo.id = job_order_milestones.job_order_id and jo.buyer_id = auth.uid()))
  with check (
    status = 'paid'
    and exists (select 1 from public.job_orders jo where jo.id = job_order_milestones.job_order_id and jo.buyer_id = auth.uid())
  );

create policy "Creators can release a paid milestone"
  on public.job_order_milestones for update
  using (exists (select 1 from public.job_orders jo where jo.id = job_order_milestones.job_order_id and jo.creator_id = auth.uid()))
  with check (
    status = 'released'
    and exists (select 1 from public.job_orders jo where jo.id = job_order_milestones.job_order_id and jo.creator_id = auth.uid())
  );

-- Accepting an offer: closes out every other pending offer on the post, marks the post
-- fulfilled, and creates the job order + its two milestones in one transaction (mirrors
-- place_order() in 0017 for the same reason -- a partial write here would orphan state).
create or replace function public.accept_job_offer(p_offer_id uuid)
returns public.job_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.job_offers;
  v_post public.job_posts;
  v_order public.job_orders;
  v_deposit numeric(10, 2);
  v_final numeric(10, 2);
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to accept an offer.';
  end if;

  select * into v_offer from public.job_offers where id = p_offer_id;
  if v_offer is null then
    raise exception 'Offer not found.';
  end if;

  select * into v_post from public.job_posts where id = v_offer.job_post_id;
  if v_post is null then
    raise exception 'Job post not found.';
  end if;

  if v_post.buyer_id <> auth.uid() then
    raise exception 'Only the post owner can accept an offer.';
  end if;

  if v_post.status <> 'open' then
    raise exception 'This job post is no longer open.';
  end if;

  if v_offer.status <> 'pending' then
    raise exception 'This offer is no longer pending.';
  end if;

  update public.job_offers set status = 'accepted' where id = v_offer.id;
  update public.job_offers set status = 'not_selected'
    where job_post_id = v_post.id and id <> v_offer.id and status = 'pending';
  update public.job_posts set status = 'fulfilled' where id = v_post.id;

  -- 50/50 deposit/balance split. The only place a future "custom milestone split" feature
  -- would need to change.
  v_deposit := round(v_offer.price * 0.5, 2);
  v_final := v_offer.price - v_deposit;

  insert into public.job_orders (job_post_id, offer_id, buyer_id, creator_id, price, deliverable_type)
  values (v_post.id, v_offer.id, v_post.buyer_id, v_offer.creator_id, v_offer.price, v_post.deliverable_type)
  returning * into v_order;

  insert into public.job_order_milestones (job_order_id, kind, amount) values
    (v_order.id, 'deposit', v_deposit),
    (v_order.id, 'final', v_final);

  return v_order;
end;
$$;

grant execute on function public.accept_job_offer to authenticated;

-- A milestone being released drives the job order forward: deposit funds the start of work,
-- the final payment closes the order out (and unlocks the deliverable).
create or replace function public.handle_job_order_milestone_release()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'released' and old.status <> 'released' then
    if new.kind = 'deposit' then
      update public.job_orders set status = 'in_progress' where id = new.job_order_id and status = 'deposit_pending';
    elsif new.kind = 'final' then
      update public.job_orders set status = 'completed' where id = new.job_order_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_job_order_milestone_release
  after update of status on public.job_order_milestones
  for each row execute function public.handle_job_order_milestone_release();

-- Storage: reference images on a job post (public), the creator's final deliverable file
-- (private, gated on order completion, mirrors 0009/0015's digital-files gating), and one more
-- policy on the existing private payment-proofs bucket so a job order's creator can see the
-- buyer's milestone proof uploads.

insert into storage.buckets (id, name, public)
values ('job-post-images', 'job-post-images', true)
on conflict (id) do nothing;

create policy "Job post images are publicly readable in storage"
  on storage.objects for select
  using (bucket_id = 'job-post-images');

create policy "Users can upload their own job post images"
  on storage.objects for insert
  with check (bucket_id = 'job-post-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own job post images"
  on storage.objects for update
  using (bucket_id = 'job-post-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own job post images"
  on storage.objects for delete
  using (bucket_id = 'job-post-images' and auth.uid()::text = (storage.foldername(name))[1]);

insert into storage.buckets (id, name, public)
values ('job-deliverables', 'job-deliverables', false)
on conflict (id) do nothing;

create policy "Creators can manage their own job deliverable files"
  on storage.objects for all
  using (bucket_id = 'job-deliverables' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'job-deliverables' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Buyers can read completed job deliverables"
  on storage.objects for select
  using (
    bucket_id = 'job-deliverables'
    and exists (
      select 1 from public.job_orders jo
      where jo.final_file_path = storage.objects.name
        and jo.buyer_id = auth.uid()
        and jo.status = 'completed'
    )
  );

create policy "Creators can view milestone payment proofs for their job orders"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and exists (
      select 1 from public.job_order_milestones m
      join public.job_orders jo on jo.id = m.job_order_id
      where m.payment_proof_path = storage.objects.name
        and jo.creator_id = auth.uid()
    )
  );
