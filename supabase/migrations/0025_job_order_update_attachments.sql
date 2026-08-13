-- Let a creator attach reference images and/or a single working file to a progress update,
-- same "private, participants-only" trust level as milestone proofs and the final deliverable.

alter table public.job_order_updates add column file_path text;
alter table public.job_order_updates add column file_name text;

-- job_order_id is denormalized here too (see job_order_update_comments in 0023) so RLS and the
-- realtime filter can key on it directly instead of joining through job_order_updates.
create table public.job_order_update_images (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references public.job_orders (id) on delete cascade,
  update_id uuid not null references public.job_order_updates (id) on delete cascade,
  path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.job_order_update_images enable row level security;

create policy "Participants can view job order update image rows"
  on public.job_order_update_images for select
  using (
    exists (
      select 1 from public.job_orders jo
      where jo.id = job_order_update_images.job_order_id
        and (jo.buyer_id = auth.uid() or jo.creator_id = auth.uid())
    )
  );

create policy "Creators can attach images to their own update"
  on public.job_order_update_images for insert
  with check (
    exists (select 1 from public.job_orders jo where jo.id = job_order_update_images.job_order_id and jo.creator_id = auth.uid())
    and exists (
      select 1 from public.job_order_updates u
      where u.id = job_order_update_images.update_id and u.job_order_id = job_order_update_images.job_order_id
    )
  );

insert into storage.buckets (id, name, public)
values ('job-order-update-attachments', 'job-order-update-attachments', false)
on conflict (id) do nothing;

create policy "Creators can manage their own job order update attachments"
  on storage.objects for all
  using (bucket_id = 'job-order-update-attachments' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'job-order-update-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Participants can view job order update images"
  on storage.objects for select
  using (
    bucket_id = 'job-order-update-attachments'
    and exists (
      select 1 from public.job_order_update_images img
      join public.job_orders jo on jo.id = img.job_order_id
      where img.path = storage.objects.name
        and (jo.buyer_id = auth.uid() or jo.creator_id = auth.uid())
    )
  );

create policy "Participants can view job order update files"
  on storage.objects for select
  using (
    bucket_id = 'job-order-update-attachments'
    and exists (
      select 1 from public.job_order_updates u
      join public.job_orders jo on jo.id = u.job_order_id
      where u.file_path = storage.objects.name
        and (jo.buyer_id = auth.uid() or jo.creator_id = auth.uid())
    )
  );

alter publication supabase_realtime add table public.job_order_update_images;
