-- Buyers previously had no way to back out of an order — only the seller could reject one.
-- Allow a buyer to cancel their own order while it's still 'processing' (before the seller has
-- shipped/started fulfilling it); the existing restock trigger from 0017 already handles putting
-- reserved stock back once status flips to 'cancelled'.

create policy "Buyers can cancel their own order while processing"
  on public.orders for update
  using (auth.uid() = buyer_id and status = 'processing')
  with check (auth.uid() = buyer_id and status = 'cancelled');
