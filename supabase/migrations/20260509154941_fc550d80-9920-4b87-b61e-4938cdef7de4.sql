
-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handle text UNIQUE,
  ADD COLUMN IF NOT EXISTS persona_age_bucket text,
  ADD COLUMN IF NOT EXISTS persona_role text,
  ADD COLUMN IF NOT EXISTS persona_region text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_life_vision boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS life_vision text;

-- Backfill handles for existing rows
UPDATE public.profiles
SET handle = 'u_' || substr(replace(id::text, '-', ''), 1, 8)
WHERE handle IS NULL;

-- Allow public read of public profiles (read-only fields exposed via RLS)
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
CREATE POLICY profiles_select_public ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- Update handle_new_user to include a generated handle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url, handle)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'u_' || substr(replace(new.id::text, '-', ''), 1, 8)
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. shared_visions
CREATE TABLE IF NOT EXISTS public.shared_visions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id text NOT NULL,
  snapshot jsonb NOT NULL,
  shared_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, goal_id)
);
ALTER TABLE public.shared_visions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sv_select_public ON public.shared_visions
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = shared_visions.user_id AND p.is_public));
CREATE POLICY sv_insert_own ON public.shared_visions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY sv_update_own ON public.shared_visions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY sv_delete_own ON public.shared_visions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. shared_finance_summaries
CREATE TABLE IF NOT EXISTS public.shared_finance_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  year int NOT NULL,
  month int NOT NULL,
  totals jsonb NOT NULL,
  note text NOT NULL DEFAULT '',
  shared_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);
ALTER TABLE public.shared_finance_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY sfs_select_public ON public.shared_finance_summaries
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = shared_finance_summaries.user_id AND p.is_public));
CREATE POLICY sfs_insert_own ON public.shared_finance_summaries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY sfs_update_own ON public.shared_finance_summaries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY sfs_delete_own ON public.shared_finance_summaries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. cheers
CREATE TABLE IF NOT EXISTS public.cheers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
ALTER TABLE public.cheers ENABLE ROW LEVEL SECURITY;

CREATE POLICY cheers_select_all ON public.cheers
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cheers_insert_own ON public.cheers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY cheers_delete_own ON public.cheers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  days int NOT NULL DEFAULT 21,
  starts_at date NOT NULL DEFAULT CURRENT_DATE,
  ends_at date,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY ch_select_public ON public.challenges
  FOR SELECT TO anon, authenticated USING (is_public OR auth.uid() = owner_id);
CREATE POLICY ch_insert_own ON public.challenges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY ch_update_own ON public.challenges
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY ch_delete_own ON public.challenges
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 6. challenge_participants
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  current_streak int NOT NULL DEFAULT 0,
  UNIQUE (challenge_id, user_id)
);
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY cp_select_all ON public.challenge_participants
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cp_insert_own ON public.challenge_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY cp_update_own ON public.challenge_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY cp_delete_own ON public.challenge_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. pairs
CREATE TABLE IF NOT EXISTS public.pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  a_user_id uuid NOT NULL,
  b_user_id uuid,
  invite_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY pairs_select_member ON public.pairs
  FOR SELECT TO authenticated USING (auth.uid() = a_user_id OR auth.uid() = b_user_id);
CREATE POLICY pairs_select_by_code ON public.pairs
  FOR SELECT TO authenticated USING (status = 'pending');
CREATE POLICY pairs_insert_own ON public.pairs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = a_user_id);
CREATE POLICY pairs_update_member ON public.pairs
  FOR UPDATE TO authenticated USING (auth.uid() = a_user_id OR auth.uid() = b_user_id OR (status = 'pending' AND b_user_id IS NULL));
CREATE POLICY pairs_delete_member ON public.pairs
  FOR DELETE TO authenticated USING (auth.uid() = a_user_id OR auth.uid() = b_user_id);

-- 8. compute_streak helper
CREATE OR REPLACE FUNCTION public.compute_streak(_user_id uuid)
RETURNS int
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak int := 0;
  cursor_date date := CURRENT_DATE;
  has_log boolean;
BEGIN
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.routine_logs
      WHERE user_id = _user_id
        AND log_date = cursor_date
        AND jsonb_array_length(checked_item_ids) > 0
    ) INTO has_log;
    IF NOT has_log THEN
      -- if today is missing, allow yesterday to start the streak
      IF streak = 0 AND cursor_date = CURRENT_DATE THEN
        cursor_date := cursor_date - 1;
        CONTINUE;
      END IF;
      EXIT;
    END IF;
    streak := streak + 1;
    cursor_date := cursor_date - 1;
  END LOOP;
  RETURN streak;
END;
$$;
