-- =====================================================================
-- manifold: per-node daily check-ins (execution layer)
-- Each node carries an `actions` list; this logs which actions were
-- checked on a given day, so daily execution rolls up into node progress
-- and the flywheel. Mirrors the legacy goal_logs shape.
-- =====================================================================

create table public.manifold_node_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id uuid not null references public.manifold_nodes(id) on delete cascade,
  log_date date not null,
  checked_action_ids jsonb not null default '[]'::jsonb,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (node_id, log_date)
);

create index manifold_node_logs_user_id_idx on public.manifold_node_logs(user_id);
create index manifold_node_logs_node_date_idx on public.manifold_node_logs(node_id, log_date);

alter table public.manifold_node_logs enable row level security;

create policy "manifold_node_logs_select_own" on public.manifold_node_logs
  for select to authenticated using (auth.uid() = user_id);
create policy "manifold_node_logs_insert_own" on public.manifold_node_logs
  for insert to authenticated with check (auth.uid() = user_id);
create policy "manifold_node_logs_update_own" on public.manifold_node_logs
  for update to authenticated using (auth.uid() = user_id);
create policy "manifold_node_logs_delete_own" on public.manifold_node_logs
  for delete to authenticated using (auth.uid() = user_id);

create trigger manifold_node_logs_set_updated_at
  before update on public.manifold_node_logs
  for each row execute function public.set_updated_at();
