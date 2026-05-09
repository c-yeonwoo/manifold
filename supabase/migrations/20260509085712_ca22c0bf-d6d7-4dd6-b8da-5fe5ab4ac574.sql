-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Goals table
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('health','wealth','work','love','growth','play')),
  title text not null,
  vision text not null default '',
  image_url text,
  deadline date,
  actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_id_idx on public.goals(user_id);
create index goals_user_category_idx on public.goals(user_id, category);

alter table public.goals enable row level security;

create policy "goals_select_own" on public.goals
  for select to authenticated using (auth.uid() = user_id);
create policy "goals_insert_own" on public.goals
  for insert to authenticated with check (auth.uid() = user_id);
create policy "goals_update_own" on public.goals
  for update to authenticated using (auth.uid() = user_id);
create policy "goals_delete_own" on public.goals
  for delete to authenticated using (auth.uid() = user_id);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- Goal logs table (per goal per day)
create table public.goal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  log_date date not null,
  checked_action_ids jsonb not null default '[]'::jsonb,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (goal_id, log_date)
);

create index goal_logs_user_id_idx on public.goal_logs(user_id);
create index goal_logs_goal_date_idx on public.goal_logs(goal_id, log_date);

alter table public.goal_logs enable row level security;

create policy "goal_logs_select_own" on public.goal_logs
  for select to authenticated using (auth.uid() = user_id);
create policy "goal_logs_insert_own" on public.goal_logs
  for insert to authenticated with check (auth.uid() = user_id);
create policy "goal_logs_update_own" on public.goal_logs
  for update to authenticated using (auth.uid() = user_id);
create policy "goal_logs_delete_own" on public.goal_logs
  for delete to authenticated using (auth.uid() = user_id);

create trigger goal_logs_set_updated_at
  before update on public.goal_logs
  for each row execute function public.set_updated_at();