-- Phase 2: portfolio projects, media, appreciations, and comments.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  cover_url text,
  category text not null
    check (category in ('Illustration', 'Graphic Design', 'Photography', 'UI/UX Design', 'Writing', '3D Art', 'Crafts')),
  mediums text[] not null default '{}',
  region text not null check (region in ('Manila', 'Cebu', 'Davao', 'Iloilo', 'Baguio', 'Bacolod')),
  appreciation_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Projects are publicly readable"
  on public.projects for select
  using (true);

create policy "Creators can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their own projects"
  on public.projects for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "Creators can delete their own projects"
  on public.projects for delete
  using (auth.uid() = creator_id);

-- appreciation_count/comment_count are system-maintained (triggers below).
revoke update on public.projects from authenticated;
grant update (title, description, cover_url, category, mediums, region)
  on public.projects to authenticated;

create or replace function public.handle_project_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set project_count = project_count + 1 where id = new.creator_id;
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_project_insert();

create or replace function public.handle_project_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set project_count = greatest(project_count - 1, 0) where id = old.creator_id;
  return old;
end;
$$;

create trigger on_project_deleted
  after delete on public.projects
  for each row execute function public.handle_project_delete();

create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  type text not null default 'image' check (type in ('image', 'video', 'text')),
  url text not null,
  caption text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.project_media enable row level security;

create policy "Project media is publicly readable"
  on public.project_media for select
  using (true);

create policy "Creators can manage media on their own projects"
  on public.project_media for all
  using (exists (select 1 from public.projects p where p.id = project_media.project_id and p.creator_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_media.project_id and p.creator_id = auth.uid()));

create table public.appreciations (
  project_id uuid not null references public.projects (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, creator_id)
);

alter table public.appreciations enable row level security;

create policy "Appreciations are publicly readable"
  on public.appreciations for select
  using (true);

create policy "Users can appreciate as themselves"
  on public.appreciations for insert
  with check (auth.uid() = creator_id);

create policy "Users can remove their own appreciation"
  on public.appreciations for delete
  using (auth.uid() = creator_id);

create or replace function public.handle_appreciation_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects set appreciation_count = appreciation_count + 1 where id = new.project_id;
  return new;
end;
$$;

create trigger on_appreciation_created
  after insert on public.appreciations
  for each row execute function public.handle_appreciation_insert();

create or replace function public.handle_appreciation_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects set appreciation_count = greatest(appreciation_count - 1, 0) where id = old.project_id;
  return old;
end;
$$;

create trigger on_appreciation_deleted
  after delete on public.appreciations
  for each row execute function public.handle_appreciation_delete();

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Comments are publicly readable"
  on public.comments for select
  using (true);

create policy "Users can comment as themselves"
  on public.comments for insert
  with check (auth.uid() = creator_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = creator_id);

create or replace function public.handle_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects set comment_count = comment_count + 1 where id = new.project_id;
  return new;
end;
$$;

create trigger on_comment_created
  after insert on public.comments
  for each row execute function public.handle_comment_insert();

create or replace function public.handle_comment_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects set comment_count = greatest(comment_count - 1, 0) where id = old.project_id;
  return old;
end;
$$;

create trigger on_comment_deleted
  after delete on public.comments
  for each row execute function public.handle_comment_delete();
