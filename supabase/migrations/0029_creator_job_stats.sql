-- job_orders is only readable by its two participants (0021's "Participants can view their job
-- order" policy), so a creator's completed-commission track record was invisible to anyone
-- browsing their profile. Expose just the aggregate count -- not price, buyer identity, or any
-- other detail -- via a security-definer function so it's safe to show publicly.

create or replace function public.completed_job_order_count(p_creator_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.job_orders where creator_id = p_creator_id and status = 'completed';
$$;

grant execute on function public.completed_job_order_count to authenticated, anon;
