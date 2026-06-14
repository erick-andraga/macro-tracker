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
  updated_at timestamptz not null default now()
);

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
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.foods    enable row level security;
alter table public.entries  enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own foods" on public.foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own entries" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
