-- Routine templates (versioned)
CREATE TABLE public.routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_routine_templates_user ON public.routine_templates(user_id, effective_from DESC);
ALTER TABLE public.routine_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rt_select_own" ON public.routine_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rt_insert_own" ON public.routine_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rt_update_own" ON public.routine_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rt_delete_own" ON public.routine_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Routine template items
CREATE TABLE public.routine_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.routine_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  phase INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  goal_id UUID,
  action_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rti_template ON public.routine_template_items(template_id);
ALTER TABLE public.routine_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rti_select_own" ON public.routine_template_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rti_insert_own" ON public.routine_template_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rti_update_own" ON public.routine_template_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rti_delete_own" ON public.routine_template_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Daily routine logs
CREATE TABLE public.routine_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  log_date DATE NOT NULL,
  template_id UUID NOT NULL REFERENCES public.routine_templates(id) ON DELETE CASCADE,
  checked_item_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);
CREATE INDEX idx_rl_user_date ON public.routine_logs(user_id, log_date DESC);
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rl_select_own" ON public.routine_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rl_insert_own" ON public.routine_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rl_update_own" ON public.routine_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rl_delete_own" ON public.routine_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_rl_updated_at BEFORE UPDATE ON public.routine_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();