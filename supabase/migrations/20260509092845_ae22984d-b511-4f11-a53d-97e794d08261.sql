CREATE TABLE public.affirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affirmations_select_own" ON public.affirmations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "affirmations_insert_own" ON public.affirmations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "affirmations_update_own" ON public.affirmations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "affirmations_delete_own" ON public.affirmations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_affirmations_user_position ON public.affirmations(user_id, position);

CREATE TRIGGER set_affirmations_updated_at
BEFORE UPDATE ON public.affirmations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();