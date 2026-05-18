
-- Enums
create type public.user_gender as enum ('male','female','other');
create type public.body_type as enum ('ectomorph','mesomorph','endomorph');
create type public.activity_level as enum ('sedentary','light','moderate','active','very_active');
create type public.user_goal as enum ('lose','maintain','gain');
create type public.workout_mode as enum ('gym','home');
create type public.muscle_group as enum ('chest','back','legs','shoulders','arms','core','full_body','cardio');
create type public.meal_type as enum ('breakfast','lunch','dinner','snack');

-- profiles (one per auth user; PK = auth.users.id)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  age int,
  gender user_gender,
  height_cm numeric,
  weight_kg numeric,
  body_type body_type,
  activity_level activity_level default 'moderate',
  goal user_goal default 'maintain',
  target_muscles muscle_group[] default '{}',
  preferred_mode workout_mode default 'gym',
  daily_kcal int,
  protein_g int,
  carbs_g int,
  fat_g int,
  theme_pref text default 'system',
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- exercises (shared library)
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group muscle_group not null,
  equipment text not null,           -- 'bodyweight','dumbbell','barbell','machine','cable'
  mode workout_mode[] not null default '{gym,home}',
  instructions text,
  created_at timestamptz not null default now()
);
alter table public.exercises enable row level security;
create policy "exercises readable by authenticated" on public.exercises
  for select to authenticated using (true);

-- workout_sessions
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  mode workout_mode not null default 'gym',
  notes text,
  created_at timestamptz not null default now()
);
alter table public.workout_sessions enable row level security;
create policy "own sessions all" on public.workout_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- workout_sets
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  set_no int not null,
  reps int not null,
  weight_kg numeric,
  created_at timestamptz not null default now()
);
alter table public.workout_sets enable row level security;
create policy "own sets all" on public.workout_sets for all
  using (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- foods (shared + custom)
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  serving_g numeric not null default 100,
  kcal numeric not null,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  fiber_g numeric not null default 0,
  is_veg boolean not null default true,
  is_custom boolean not null default false,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index foods_name_idx on public.foods using gin (to_tsvector('simple', name));
alter table public.foods enable row level security;
create policy "foods read shared or own" on public.foods for select to authenticated
  using (is_custom = false or user_id = auth.uid());
create policy "foods insert own custom" on public.foods for insert to authenticated
  with check (is_custom = true and user_id = auth.uid());
create policy "foods update own" on public.foods for update to authenticated
  using (user_id = auth.uid());
create policy "foods delete own" on public.foods for delete to authenticated
  using (user_id = auth.uid());

-- meal_entries
create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  meal_type meal_type not null,
  food_id uuid references public.foods(id) on delete set null,
  food_name text not null,           -- snapshot in case food row is deleted
  servings numeric not null default 1,
  kcal numeric not null,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  source text not null default 'manual', -- 'manual'|'search'|'ai_photo'
  photo_path text,
  created_at timestamptz not null default now()
);
alter table public.meal_entries enable row level security;
create policy "own meals all" on public.meal_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- weight_logs
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  weight_kg numeric not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
alter table public.weight_logs enable row level security;
create policy "own weights all" on public.weight_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ai_messages
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.ai_messages enable row level security;
create policy "own ai_messages all" on public.ai_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket for meal photos
insert into storage.buckets (id, name, public) values ('meal-photos','meal-photos', false)
  on conflict (id) do nothing;
create policy "meal photos own select" on storage.objects for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "meal photos own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "meal photos own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
