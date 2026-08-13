-- Let both sides of a job post/order see each other's changes live (offer accepted, milestone
-- paid/released, status advanced) instead of only on next manual refetch, mirroring the realtime
-- setup messages already has (0010).

alter publication supabase_realtime add table public.job_posts;
alter publication supabase_realtime add table public.job_offers;
alter publication supabase_realtime add table public.job_orders;
alter publication supabase_realtime add table public.job_order_milestones;
