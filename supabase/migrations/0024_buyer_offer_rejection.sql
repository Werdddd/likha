-- Buyers previously could only dismiss competing offers as a side effect of accepting one
-- (accept_job_offer marks the rest 'not_selected'). Let a buyer directly reject an individual
-- pending offer on their own post, independent of accepting anything.

create policy "Buyers can reject a pending offer on their post"
  on public.job_offers for update
  using (
    status = 'pending'
    and exists (select 1 from public.job_posts jp where jp.id = job_offers.job_post_id and jp.buyer_id = auth.uid())
  )
  with check (
    status = 'not_selected'
    and exists (select 1 from public.job_posts jp where jp.id = job_offers.job_post_id and jp.buyer_id = auth.uid())
  );
