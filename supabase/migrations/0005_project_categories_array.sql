-- Allow multiple (and custom, user-typed) categories per project instead of exactly one.

alter table public.projects add column categories text[] not null default '{}';

update public.projects set categories = array[category] where category is not null;

alter table public.projects drop column category;

-- Re-establish the safe-column update grant now that "category" is gone.
revoke update on public.projects from authenticated;
grant update (title, description, cover_url, categories, mediums, region)
  on public.projects to authenticated;
