-- Phase 5: 1:1 direct messaging.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles (id) on delete cascade,
  user_b_id uuid not null references public.profiles (id) on delete cascade,
  user_a_last_read_at timestamptz not null default now(),
  user_b_last_read_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (user_a_id <> user_b_id)
);

-- One conversation per pair, regardless of which side started it.
create unique index conversations_unique_pair
  on public.conversations (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id));

alter table public.conversations enable row level security;

create policy "Participants can view their conversations"
  on public.conversations for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "Users can start a conversation they're part of"
  on public.conversations for insert
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- No direct UPDATE policy: read markers are only ever changed via mark_conversation_read()
-- below (SECURITY DEFINER), so a participant can never touch the other side's marker or
-- reassign the conversation to someone else.
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set user_a_last_read_at = case when user_a_id = auth.uid() then now() else user_a_last_read_at end,
      user_b_last_read_at = case when user_b_id = auth.uid() then now() else user_b_last_read_at end
  where id = p_conversation_id and (user_a_id = auth.uid() or user_b_id = auth.uid());
end;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Participants can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

create policy "Participants can send messages in their conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

-- Bump the conversation's last_message_at, and treat the sender as having read up to their
-- own message (so they don't see an unread badge for something they just sent).
create or replace function public.handle_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      user_a_last_read_at = case when user_a_id = new.sender_id then new.created_at else user_a_last_read_at end,
      user_b_last_read_at = case when user_b_id = new.sender_id then new.created_at else user_b_last_read_at end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_message_insert();

alter publication supabase_realtime add table public.messages;
