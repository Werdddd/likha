-- Phase 3: storage for listing photos (public) and digital product files (private).
-- Path convention for both: {bucket}/{creator_id}/{filename}

insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', true)
on conflict (id) do nothing;

create policy "Listing media files are publicly readable"
  on storage.objects for select
  using (bucket_id = 'listing-media');

create policy "Users can upload their own listing media files"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own listing media files"
  on storage.objects for update
  using (
    bucket_id = 'listing-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own listing media files"
  on storage.objects for delete
  using (
    bucket_id = 'listing-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Private: only the owning creator can read/write. Buyer download access (via signed URLs
-- issued after a verified purchase) is added in the Cart & Orders phase.
insert into storage.buckets (id, name, public)
values ('digital-files', 'digital-files', false)
on conflict (id) do nothing;

create policy "Owners can read their own digital files"
  on storage.objects for select
  using (
    bucket_id = 'digital-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owners can upload their own digital files"
  on storage.objects for insert
  with check (
    bucket_id = 'digital-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owners can update their own digital files"
  on storage.objects for update
  using (
    bucket_id = 'digital-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owners can delete their own digital files"
  on storage.objects for delete
  using (
    bucket_id = 'digital-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
