-- =====================================================================
-- manifold: measurable life targets (metrics)
-- Big numbers on the home dashboard — e.g. 체중 70kg, 월 수입 1000만원,
-- 순자산 10억, 35세 이전 결혼. Each is a measurable milestone (or a final
-- target), optionally linked to a node and tracking a current value.
-- =====================================================================

create table public.manifold_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  label text not null,            -- "월 수입", "체중", "결혼"
  value numeric not null,         -- target number, e.g. 1000
  unit text not null default '',  -- "만원", "kg", "억", "세"
  current numeric,                -- optional current value for progress

  -- milestone: a checkpoint on the way; final: the end-state target
  kind text not null default 'milestone'
    check (kind in ('milestone','final')),

  node_id uuid references public.manifold_nodes(id) on delete set null,
  position int not null default 0,
  meta jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index manifold_metrics_user_id_idx on public.manifold_metrics(user_id);

alter table public.manifold_metrics enable row level security;

create policy "manifold_metrics_select_own" on public.manifold_metrics
  for select to authenticated using (auth.uid() = user_id);
create policy "manifold_metrics_insert_own" on public.manifold_metrics
  for insert to authenticated with check (auth.uid() = user_id);
create policy "manifold_metrics_update_own" on public.manifold_metrics
  for update to authenticated using (auth.uid() = user_id);
create policy "manifold_metrics_delete_own" on public.manifold_metrics
  for delete to authenticated using (auth.uid() = user_id);

create trigger manifold_metrics_set_updated_at
  before update on public.manifold_metrics
  for each row execute function public.set_updated_at();
