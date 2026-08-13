-- Digital files should only become downloadable once the seller has marked the order
-- complete (status = 'delivered'), not immediately on purchase.

drop policy "Buyers can read digital files they purchased" on storage.objects;

create policy "Buyers can read digital files they purchased and completed"
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
        and o.status = 'delivered'
    )
  );
