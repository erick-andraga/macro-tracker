-- Macro Tracker schema. Run this in the Supabase SQL Editor.
-- Every table is scoped to the signed-in user via Row Level Security.

-- ---------------------------------------------------------------------------
-- profiles: one row per user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  age        int     not null default 30,
  sex        text    not null default 'male',
  weight_kg  numeric not null default 80,
  height_cm  numeric not null default 178,
  activity   text    not null default 'moderate',
  goal       text    not null default 'maintain',
  threshold  text    not null default 'mid',
  updated_at timestamptz not null default now()
);

-- Add the macro-threshold column to existing tables (safe to re-run).
alter table public.profiles
  add column if not exists threshold text not null default 'mid';

-- ---------------------------------------------------------------------------
-- foods: user-created foods (built-in sample foods live in the app code)
-- ---------------------------------------------------------------------------
create table if not exists public.foods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name       text not null,
  serving    text not null default '1 serving',
  calories   numeric not null default 0,
  protein    numeric not null default 0,
  carbs      numeric not null default 0,
  fat        numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- entries: a logged food on a given day. food_id is text because it can point
-- at either a built-in sample food ("f1") or a user food (uuid as text).
-- ---------------------------------------------------------------------------
create table if not exists public.entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  food_id    text not null,
  quantity   numeric not null default 1,
  date       date not null,
  created_at timestamptz not null default now()
);

create index if not exists entries_user_date_idx on public.entries (user_id, date);

-- ---------------------------------------------------------------------------
-- profile_snapshots: a frozen copy of the profile per month (YYYY-MM), so that
-- editing the current profile never changes past months' goals/totals.
-- ---------------------------------------------------------------------------
create table if not exists public.profile_snapshots (
  user_id   uuid not null references auth.users (id) on delete cascade default auth.uid(),
  month     text not null, -- 'YYYY-MM'
  age       int     not null default 30,
  sex       text    not null default 'male',
  weight_kg numeric not null default 80,
  height_cm numeric not null default 178,
  activity  text    not null default 'moderate',
  goal      text    not null default 'maintain',
  threshold text    not null default 'mid',
  primary key (user_id, month)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.foods             enable row level security;
alter table public.entries           enable row level security;
alter table public.profile_snapshots enable row level security;

-- Drop-then-create so this file is safe to re-run.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own foods" on public.foods;
create policy "own foods" on public.foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own entries" on public.entries;
create policy "own entries" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own snapshots" on public.profile_snapshots;
create policy "own snapshots" on public.profile_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
