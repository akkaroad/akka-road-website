-- AKKA ROAD: SAFE, RE-RUNNABLE SUPABASE SETUP
-- Run this entire file in Supabase -> SQL Editor -> New query.

create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  hero_title text,
  hero_copy text,
  booking_email text,
  instagram_url text,
  shop_url text,
  updated_at timestamptz default now()
);

alter table public.site_settings add column if not exists hero_title text;
alter table public.site_settings add column if not exists hero_copy text;
alter table public.site_settings add column if not exists booking_email text;
alter table public.site_settings add column if not exists instagram_url text;
alter table public.site_settings add column if not exists shop_url text;
alter table public.site_settings add column if not exists updated_at timestamptz default now();

create table if not exists public.band_members (
  id uuid primary key default gen_random_uuid(), name text not null, role text, bio text,
  photo_url text, sort_order int default 0, published boolean default false,
  created_at timestamptz default now()
);
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(), title text not null, excerpt text, body text,
  published_at timestamptz default now(), published boolean default false,
  created_at timestamptz default now()
);
create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(), title text not null, description text,
  release_date date, artwork_url text, spotify_url text, apple_music_url text, youtube_url text,
  published boolean default false, created_at timestamptz default now()
);
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(), title text not null, event_date timestamptz,
  location text, ticket_url text, description text, published boolean default false,
  created_at timestamptz default now()
);
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(), title text not null,
  type text check(type in ('photo','video')) default 'photo', url text not null,
  caption text, published boolean default false, created_at timestamptz default now()
);

insert into public.site_settings(hero_title,hero_copy,booking_email,instagram_url,shop_url)
select 'Music for the road between struggle and light.',
       'Akka Road brings honest songs, warm grooves, and a spirit of unity to every stage, studio, and gathering.',
       'booking@example.com','https://instagram.com/','#'
where not exists(select 1 from public.site_settings);

alter table public.site_settings enable row level security;
alter table public.band_members enable row level security;
alter table public.posts enable row level security;
alter table public.releases enable row level security;
alter table public.events enable row level security;
alter table public.media enable row level security;

-- Public website reads.
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings for select using (true);

-- Authenticated dashboard users may fully manage content.
do $$
declare t text;
begin
  foreach t in array array['site_settings','band_members','posts','releases','events','media'] loop
    execute format('drop policy if exists authenticated_manage on public.%I', t);
    execute format('create policy authenticated_manage on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Published public content.
drop policy if exists band_members_public_read on public.band_members;
create policy band_members_public_read on public.band_members for select using (published = true);
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select using (published = true);
drop policy if exists releases_public_read on public.releases;
create policy releases_public_read on public.releases for select using (published = true);
drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events for select using (published = true);
drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media for select using (published = true);

-- Optional media bucket for future direct uploads.
insert into storage.buckets (id, name, public)
values ('akka-road-media','akka-road-media',true)
on conflict (id) do update set public = true;

drop policy if exists media_public_view on storage.objects;
create policy media_public_view on storage.objects for select using (bucket_id = 'akka-road-media');
drop policy if exists media_authenticated_upload on storage.objects;
create policy media_authenticated_upload on storage.objects for insert to authenticated with check (bucket_id = 'akka-road-media');
drop policy if exists media_authenticated_update on storage.objects;
create policy media_authenticated_update on storage.objects for update to authenticated using (bucket_id = 'akka-road-media') with check (bucket_id = 'akka-road-media');
drop policy if exists media_authenticated_delete on storage.objects;
create policy media_authenticated_delete on storage.objects for delete to authenticated using (bucket_id = 'akka-road-media');
