-- Previously the buyer could only see/download the creator's final deliverable file after the
-- order reached 'completed' — which requires the buyer to already have confirmed satisfaction
-- and paid the final milestone in full. That forced the buyer to approve and pay blind, without
-- ever seeing the work. Now the file is visible as soon as the creator submits it for review
-- ('delivered'), and stays visible through a revision round, so the buyer can judge the actual
-- deliverable before confirming or paying — final payment release still requires the creator to
-- manually verify the buyer's payment proof, so the creator isn't paid before that's checked.

drop policy "Buyers can read completed job deliverables" on storage.objects;

create policy "Buyers can read submitted job deliverables"
  on storage.objects for select
  using (
    bucket_id = 'job-deliverables'
    and exists (
      select 1 from public.job_orders jo
      where jo.final_file_path = storage.objects.name
        and jo.buyer_id = auth.uid()
        and jo.status in ('delivered', 'revision', 'completed')
    )
  );
