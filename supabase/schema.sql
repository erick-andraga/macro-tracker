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
-- recipes: a named group of foods. Components are stored as JSON
-- ([{ "foodId": "...", "quantity": 1 }, ...]); a recipe's macros are computed
-- from the *current* values of its component foods in the app, never stored.
-- ---------------------------------------------------------------------------
create table if not exists public.recipes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name       text not null,
  components jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- recipe_component_logs: the component quantities used each time a recipe is
-- logged (history/audit). The recipe row itself always holds the latest values.
-- recipe_id is text for the same reason as entries.food_id.
-- ---------------------------------------------------------------------------
create table if not exists public.recipe_component_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  recipe_id  text not null,
  components jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists recipe_component_logs_user_recipe_idx
  on public.recipe_component_logs (user_id, recipe_id);

-- ---------------------------------------------------------------------------
-- entries: a logged food on a given day. food_id is text because it can point
-- at either a built-in sample food ("f1"), a user food, or a recipe (uuid as text).
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
alter table public.profiles              enable row level security;
alter table public.foods                 enable row level security;
alter table public.recipes               enable row level security;
alter table public.recipe_component_logs enable row level security;
alter table public.entries               enable row level security;
alter table public.profile_snapshots    enable row level security;

-- Drop-then-create so this file is safe to re-run.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own foods" on public.foods;
create policy "own foods" on public.foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own recipes" on public.recipes;
create policy "own recipes" on public.recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own recipe component logs" on public.recipe_component_logs;
create policy "own recipe component logs" on public.recipe_component_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own entries" on public.entries;
create policy "own entries" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own snapshots" on public.profile_snapshots;
create policy "own snapshots" on public.profile_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
