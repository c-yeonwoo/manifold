
-- 1) pairs: restrict pending-claim update to require b_user_id = auth.uid()
DROP POLICY IF EXISTS pairs_update_member ON public.pairs;
CREATE POLICY pairs_update_member ON public.pairs
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = a_user_id
    OR auth.uid() = b_user_id
    OR (status = 'pending' AND b_user_id IS NULL)
  )
  WITH CHECK (
    auth.uid() = a_user_id
    OR auth.uid() = b_user_id
  );

-- 2) shared_visions: add explicit is_public flag and require it for public read
ALTER TABLE public.shared_visions
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS sv_select_public ON public.shared_visions;
CREATE POLICY sv_select_public ON public.shared_visions
  FOR SELECT TO anon, authenticated
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = shared_visions.user_id AND p.is_public
    )
  );

CREATE POLICY sv_select_own ON public.shared_visions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3) compute_streak: switch to SECURITY INVOKER so RLS applies to caller
ALTER FUNCTION public.compute_streak(uuid) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.compute_streak(uuid) TO authenticated;
