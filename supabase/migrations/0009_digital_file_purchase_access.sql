-- Phase 4: let a buyer read (and generate a signed URL for) a digital file they actually
-- purchased, on top of the existing owner-only access from the marketplace phase.

create policy "Buyers can read digital files they purchased"
  on storage.objects for select
  using (
    bucket_id = 'digital-files'
    and exists (
      select 1
      from public.listings l
      join public.order_items oi on oi.listing_id = l.id
      join public.orders o on o.id = oi.order_id
      where l.digital_file_path = storage.objects.name
        and o.buyer_id = auth.uid()
    )
  );
