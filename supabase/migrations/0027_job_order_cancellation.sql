-- Job orders had no cancellation path at all: the 'cancelled' status existed in the check
-- constraint and the UI already had a terminal-state message for it, but nothing could ever
-- produce it. Only allow cancelling before any money has moved (still 'deposit_pending'),
-- mirroring the buyer's pre-shipment order cancellation in 0019 -- once the deposit is paid,
-- the order has to be resolved manually rather than silently cancelled.
-- Implemented as a security-definer RPC (like accept_job_offer in 0021) rather than loosening
-- the existing blanket "Creators can advance"/"Buyers can update" policies, so the allowed
-- transition is enforced in one place instead of via a column-scoped policy.

create or replace function public.cancel_job_order(p_job_order_id uuid)
returns public.job_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.job_orders;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to cancel a job order.';
  end if;

  select * into v_order from public.job_orders where id = p_job_order_id;
  if v_order is null then
    raise exception 'Job order not found.';
  end if;

  if v_order.buyer_id <> auth.uid() and v_order.creator_id <> auth.uid() then
    raise exception 'Only a participant can cancel this job order.';
  end if;

  if v_order.status <> 'deposit_pending' then
    raise exception 'This job order can no longer be cancelled -- the deposit has already been paid.';
  end if;

  update public.job_orders set status = 'cancelled' where id = p_job_order_id returning * into v_order;
  return v_order;
end;
$$;

grant execute on function public.cancel_job_order to authenticated;
