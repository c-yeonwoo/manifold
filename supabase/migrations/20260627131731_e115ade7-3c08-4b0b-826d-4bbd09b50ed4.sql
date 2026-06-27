
create table public.manifold_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  layer text not null check (layer in ('base','core','output')),
  kind text not null default 'goal',
  title text not null,
  description text not null default '',
  status text not null default 'queued' check (status in ('active','queued','done','archived')),
  priority int not null default 0,
  x double precision,
  y double precision,
  horizon text,
  target_date date,
  category text,
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

grant select, insert, update, delete on public.manifold_nodes to authenticated;
grant all on public.manifold_nodes to service_role;

alter table public.manifold_nodes enable row level security;
create policy "manifold_nodes_select_own" on public.manifold_nodes for select to authenticated using (auth.uid() = user_id);
create policy "manifold_nodes_insert_own" on public.manifold_nodes for insert to authenticated with check (auth.uid() = user_id);
create policy "manifold_nodes_update_own" on public.manifold_nodes for update to authenticated using (auth.uid() = user_id);
create policy "manifold_nodes_delete_own" on public.manifold_nodes for delete to authenticated using (auth.uid() = user_id);
create trigger manifold_nodes_set_updated_at before update on public.manifold_nodes for each row execute function public.set_updated_at();

create table public.manifold_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.manifold_nodes(id) on delete cascade,
  target_id uuid not null references public.manifold_nodes(id) on delete cascade,
  type text not null default 'feeds' check (type in ('feeds','reinforces','gates','feedbacks')),
  flow text,
  label text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, source_id, target_id, type)
);
create index manifold_edges_user_id_idx on public.manifold_edges(user_id);
create index manifold_edges_source_idx on public.manifold_edges(source_id);
create index manifold_edges_target_idx on public.manifold_edges(target_id);

grant select, insert, update, delete on public.manifold_edges to authenticated;
grant all on public.manifold_edges to service_role;

alter table public.manifold_edges enable row level security;
create policy "manifold_edges_select_own" on public.manifold_edges for select to authenticated using (auth.uid() = user_id);
create policy "manifold_edges_insert_own" on public.manifold_edges for insert to authenticated with check (auth.uid() = user_id);
create policy "manifold_edges_update_own" on public.manifold_edges for update to authenticated using (auth.uid() = user_id);
create policy "manifold_edges_delete_own" on public.manifold_edges for delete to authenticated using (auth.uid() = user_id);

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

grant select, insert, update, delete on public.manifold_node_logs to authenticated;
grant all on public.manifold_node_logs to service_role;

alter table public.manifold_node_logs enable row level security;
create policy "manifold_node_logs_select_own" on public.manifold_node_logs for select to authenticated using (auth.uid() = user_id);
create policy "manifold_node_logs_insert_own" on public.manifold_node_logs for insert to authenticated with check (auth.uid() = user_id);
create policy "manifold_node_logs_update_own" on public.manifold_node_logs for update to authenticated using (auth.uid() = user_id);
create policy "manifold_node_logs_delete_own" on public.manifold_node_logs for delete to authenticated using (auth.uid() = user_id);
create trigger manifold_node_logs_set_updated_at before update on public.manifold_node_logs for each row execute function public.set_updated_at();
