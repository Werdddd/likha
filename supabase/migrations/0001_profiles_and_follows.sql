-- Phase 1: profiles + follows, backing the Creator type and follower/following system.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique,
  name text not null default '',
  avatar_url text,
  cover_url text,
  bio text not null default '',
  region text check (region in ('Manila', 'Cebu', 'Davao', 'Iloilo', 'Baguio', 'Bacolod')),
  categories text[] not null default '{}'
    check (categories <@ array['Illustration', 'Graphic Design', 'Photography', 'UI/UX Design', 'Writing', '3D Art', 'Crafts']::text[]),
  profile_mode text not null default 'portfolio' check (profile_mode in ('portfolio', 'open_for_work')),
  tags text[] not null default '{}',
  badges text[] not null default '{}',
  follower_count integer not null default 0,
  following_count integer not null default 0,
  project_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Column-level grants: badges/counts are system-maintained (via triggers below,
-- which run as SECURITY DEFINER and bypass this), never directly user-writable.
revoke update on public.profiles from authenticated;
grant update (handle, name, avatar_url, cover_url, bio, region, categories, profile_mode, tags)
  on public.profiles to authenticated;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  final_handle text;
  suffix int := 0;
begin
  base_handle := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  if base_handle = '' then
    base_handle := 'user';
  end if;

  final_handle := base_handle;
  while exists (select 1 from public.profiles where handle = final_handle) loop
    suffix := suffix + 1;
    final_handle := base_handle || suffix::text;
  end loop;

  insert into public.profiles (id, handle, name)
  values (new.id, final_handle, '');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

alter table public.follows enable row level security;

create policy "Follows are publicly readable"
  on public.follows for select
  using (true);

create policy "Users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow as themselves"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- Keep follower_count/following_count on profiles in sync with follows.
create or replace function public.handle_follow_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set following_count = following_count + 1 where id = new.follower_id;
  update public.profiles set follower_count = follower_count + 1 where id = new.followee_id;
  return new;
end;
$$;

create trigger on_follow_created
  after insert on public.follows
  for each row execute function public.handle_follow_insert();

create or replace function public.handle_follow_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
  update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = old.followee_id;
  return old;
end;
$$;

create trigger on_follow_deleted
  after delete on public.follows
  for each row execute function public.handle_follow_delete();
