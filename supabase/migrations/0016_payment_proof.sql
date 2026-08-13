-- Drop COD (enforced at the app layer going forward — the checkout screen no longer offers
-- it; the existing payment_method check constraint is left as-is so historical 'cod' orders,
-- if any, still read back fine) and require a buyer-submitted proof of payment for gcash/card
-- orders, which the seller reviews and verifies before advancing fulfillment.

alter table public.orders add column payment_proof_path text;
alter table public.orders add column payment_verified boolean not null default false;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "Buyers can upload their own payment proofs"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Buyers can view their own payment proofs"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Reuses the security definer helper from 0014 so this doesn't reopen the orders/order_items
-- RLS recursion that fix addressed.
create policy "Creators can view payment proofs for their orders"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and exists (
      select 1 from public.orders o
      where o.payment_proof_path = storage.objects.name
        and public.order_belongs_to_creator(o.id, auth.uid())
    )
  );
