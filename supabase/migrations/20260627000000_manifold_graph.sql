-- =====================================================================
-- manifold: graph-native model (nodes + typed edges)
-- Replaces the fixed wheel-of-life tree (나 → 6 categories → goals) with
-- a layered flywheel: BASE → CORE → OUTPUT, where edges carry direction
-- and meaning (feeds / reinforces / gates / feedbacks).
-- Legacy goals/goal_logs stay intact; this is additive.
-- =====================================================================

-- Nodes ---------------------------------------------------------------
create table public.manifold_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- functional layer in the flywheel
  layer text not null check (layer in ('base','core','output')),
  -- semantic kind (routine, career, automation, asset, venture, brand,
  -- relationship, mindset, goal, ...) — free text, not constrained
  kind text not null default 'goal',

  title text not null,
  description text not null default '',

  -- contention: only a few nodes run at 100% at once, the rest are queued
  status text not null default 'queued'
    check (status in ('active','queued','done','archived')),
  priority int not null default 0,

  -- optional canvas layout seed (null => force-directed auto-place)
  x double precision,
  y double precision,

  -- timeline / sequencing
  horizon text,         -- milestone bucket, e.g. '26H2', '27H1'
  target_date date,

  -- carryover from the legacy goal model (kept optional)
  category text,        -- legacy wheel-of-life tag (health/wealth/...)
  vision text not null default '',
  image_url text,
  actions jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index manifold_nodes_user_id_idx on public.manifold_nodes(user_id);
create index manifold_nodes_user_layer_idx on public.manifold_nodes(user_id, layer);
create index manifold_nodes_user_status_idx on public.manifold_nodes(user_id, status);

alter table public.manifold_nodes enable row level security;

create policy "manifold_nodes_select_own" on public.manifold_nodes
  for select to authenticated using (auth.uid() = user_id);
create policy "manifold_nodes_insert_own" on public.manifold_nodes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "manifold_nodes_update_own" on public.manifold_nodes
  for update to authenticated using (auth.uid() = user_id);
create policy "manifold_nodes_delete_own" on public.manifold_nodes
  for delete to authenticated using (auth.uid() = user_id);

create trigger manifold_nodes_set_updated_at
  before update on public.manifold_nodes
  for each row execute function public.set_updated_at();

-- Edges ---------------------------------------------------------------
create table public.manifold_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  source_id uuid not null references public.manifold_nodes(id) on delete cascade,
  target_id uuid not null references public.manifold_nodes(id) on delete cascade,

  -- feeds:     source supplies a resource to target (BASE -> CORE)
  -- reinforces: bidirectional mutual strengthening (career <-> automation)
  -- gates:     source must precede/unblock target (대출 -> 이직)
  -- feedbacks: downstream node loops value back upstream (OUTPUT -> BASE)
  type text not null default 'feeds'
    check (type in ('feeds','reinforces','gates','feedbacks')),

  -- what flows along the edge: energy | cash | time | social | skill | focus
  flow text,
  label text not null default '',

  created_at timestamptz not null default now(),

  unique (user_id, source_id, target_id, type)
);

create index manifold_edges_user_id_idx on public.manifold_edges(user_id);
create index manifold_edges_source_idx on public.manifold_edges(source_id);
create index manifold_edges_target_idx on public.manifold_edges(target_id);

alter table public.manifold_edges enable row level security;

create policy "manifold_edges_select_own" on public.manifold_edges
  for select to authenticated using (auth.uid() = user_id);
create policy "manifold_edges_insert_own" on public.manifold_edges
  for insert to authenticated with check (auth.uid() = user_id);
create policy "manifold_edges_update_own" on public.manifold_edges
  for update to authenticated using (auth.uid() = user_id);
create policy "manifold_edges_delete_own" on public.manifold_edges
  for delete to authenticated using (auth.uid() = user_id);
