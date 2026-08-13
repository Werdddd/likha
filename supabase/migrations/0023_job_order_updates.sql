-- Progress updates on a job order: the creator posts regular text updates as work progresses,
-- the buyer (and creator) can discuss each one, and both sides can scroll the full history.
-- Also adds an explicit buyer confirmation gate: the final milestone payment only becomes
-- available after the buyer confirms they're satisfied with the delivered work, rather than
-- the moment status flips to 'delivered'.

create table public.job_order_updates (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references public.job_orders (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.job_order_updates enable row level security;

create policy "Participants can view job order updates"
  on public.job_order_updates for select
  using (
    exists (
      select 1 from public.job_orders jo
      where jo.id = job_order_updates.job_order_id
        and (jo.buyer_id = auth.uid() or jo.creator_id = auth.uid())
    )
  );

create policy "Creators can post updates on their job order"
  on public.job_order_updates for insert
  with check (
    auth.uid() = creator_id
    and exists (select 1 from public.job_orders jo where jo.id = job_order_updates.job_order_id and jo.creator_id = auth.uid())
  );

-- job_order_id is denormalized onto comments (rather than joining through job_order_updates)
-- so both RLS and the realtime subscription filter can key on it directly with a single hop.
create table public.job_order_update_comments (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references public.job_orders (id) on delete cascade,
  update_id uuid not null references public.job_order_updates (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.job_order_update_comments enable row level security;

create policy "Participants can view update comments"
  on public.job_order_update_comments for select
  using (
    exists (
      select 1 from public.job_orders jo
      where jo.id = job_order_update_comments.job_order_id
        and (jo.buyer_id = auth.uid() or jo.creator_id = auth.uid())
    )
  );

create policy "Participants can comment on an update"
  on public.job_order_update_comments for insert
  with check (
    auth.uid() = creator_id
    and exists (
      select 1 from public.job_orders jo
      where jo.id = job_order_update_comments.job_order_id
        and (jo.buyer_id = auth.uid() or jo.creator_id = auth.uid())
    )
    and exists (
      select 1 from public.job_order_updates u
      where u.id = job_order_update_comments.update_id
        and u.job_order_id = job_order_update_comments.job_order_id
    )
  );

-- Set by the buyer (via the existing "Buyers can update their job order" policy from 0021) once
-- they've reviewed the update history and are satisfied; gates the final milestone payment.
alter table public.job_orders add column buyer_confirmed_at timestamptz;

alter publication supabase_realtime add table public.job_order_updates;
alter publication supabase_realtime add table public.job_order_update_comments;
