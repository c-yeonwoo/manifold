CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_user_date ON public.expenses (user_id, date DESC);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select_own" ON public.expenses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "expenses_insert_own" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_update_own" ON public.expenses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "expenses_delete_own" ON public.expenses
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER expenses_set_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();