-- Region selector previously only covered 6 cities (Manila, Cebu, Davao, Iloilo, Baguio,
-- Bacolod). Replace with the full set of 17 official PH regions so any location nationwide
-- can be selected.

alter table public.profiles drop constraint profiles_region_check;
alter table public.projects drop constraint projects_region_check;
alter table public.job_posts drop constraint job_posts_region_check;

-- Remap existing rows off the old city-based values to their containing region before the
-- new constraint goes on, so it doesn't fail validation against orphaned data.
update public.profiles set region = case region
  when 'Manila' then 'NCR'
  when 'Cebu' then 'Central Visayas'
  when 'Davao' then 'Davao Region'
  when 'Iloilo' then 'Western Visayas'
  when 'Baguio' then 'CAR'
  when 'Bacolod' then 'Western Visayas'
  else region
end
where region in ('Manila', 'Cebu', 'Davao', 'Iloilo', 'Baguio', 'Bacolod');

update public.projects set region = case region
  when 'Manila' then 'NCR'
  when 'Cebu' then 'Central Visayas'
  when 'Davao' then 'Davao Region'
  when 'Iloilo' then 'Western Visayas'
  when 'Baguio' then 'CAR'
  when 'Bacolod' then 'Western Visayas'
  else region
end
where region in ('Manila', 'Cebu', 'Davao', 'Iloilo', 'Baguio', 'Bacolod');

update public.job_posts set region = case region
  when 'Manila' then 'NCR'
  when 'Cebu' then 'Central Visayas'
  when 'Davao' then 'Davao Region'
  when 'Iloilo' then 'Western Visayas'
  when 'Baguio' then 'CAR'
  when 'Bacolod' then 'Western Visayas'
  else region
end
where region in ('Manila', 'Cebu', 'Davao', 'Iloilo', 'Baguio', 'Bacolod');

alter table public.profiles add constraint profiles_region_check check (
  region is null or region in (
    'NCR', 'CAR', 'Ilocos Region', 'Cagayan Valley', 'Central Luzon', 'CALABARZON',
    'MIMAROPA', 'Bicol Region', 'Western Visayas', 'Central Visayas', 'Eastern Visayas',
    'Zamboanga Peninsula', 'Northern Mindanao', 'Davao Region', 'SOCCSKSARGEN', 'Caraga',
    'BARMM'
  )
);

alter table public.projects add constraint projects_region_check check (
  region in (
    'NCR', 'CAR', 'Ilocos Region', 'Cagayan Valley', 'Central Luzon', 'CALABARZON',
    'MIMAROPA', 'Bicol Region', 'Western Visayas', 'Central Visayas', 'Eastern Visayas',
    'Zamboanga Peninsula', 'Northern Mindanao', 'Davao Region', 'SOCCSKSARGEN', 'Caraga',
    'BARMM'
  )
);

alter table public.job_posts add constraint job_posts_region_check check (
  region is null or region in (
    'NCR', 'CAR', 'Ilocos Region', 'Cagayan Valley', 'Central Luzon', 'CALABARZON',
    'MIMAROPA', 'Bicol Region', 'Western Visayas', 'Central Visayas', 'Eastern Visayas',
    'Zamboanga Peninsula', 'Northern Mindanao', 'Davao Region', 'SOCCSKSARGEN', 'Caraga',
    'BARMM'
  )
);
