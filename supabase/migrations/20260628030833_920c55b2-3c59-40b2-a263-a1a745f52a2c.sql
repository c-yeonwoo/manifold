
-- 1) pairs: remove broad pending invite SELECT policy
DROP POLICY IF EXISTS pairs_select_by_code ON public.pairs;

-- Provide a SECURITY DEFINER lookup so users can resolve an invite code without enumerating
CREATE OR REPLACE FUNCTION public.find_pair_by_invite(_invite_code text)
RETURNS TABLE(id uuid, a_user_id uuid, b_user_id uuid, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, a_user_id, b_user_id, status
  FROM public.pairs
  WHERE invite_code = _invite_code
    AND status = 'pending'
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.find_pair_by_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_pair_by_invite(text) TO authenticated;

-- 2) shared_finance_summaries: add explicit opt-in flag
ALTER TABLE public.shared_finance_summaries
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS sfs_select_public ON public.shared_finance_summaries;
CREATE POLICY sfs_select_public ON public.shared_finance_summaries
  FOR SELECT
  TO anon, authenticated
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = shared_finance_summaries.user_id AND p.is_public
    )
  );

-- Owners can still see their own
DROP POLICY IF EXISTS sfs_select_own ON public.shared_finance_summaries;
CREATE POLICY sfs_select_own ON public.shared_finance_summaries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3) challenge_participants: restrict reads to authenticated + same-challenge members or self
DROP POLICY IF EXISTS cp_select_all ON public.challenge_participants;
CREATE POLICY cp_select_members ON public.challenge_participants
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.challenge_participants me
      WHERE me.challenge_id = challenge_participants.challenge_id
        AND me.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
        AND c.owner_id = auth.uid()
    )
  );

-- 4) cheers: restrict to authenticated, own rows only (counts should be served via aggregate RPC)
DROP POLICY IF EXISTS cheers_select_all ON public.cheers;
CREATE POLICY cheers_select_own ON public.cheers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5) Lock down SECURITY DEFINER compute_streak so signed-in users cannot execute it directly
REVOKE EXECUTE ON FUNCTION public.compute_streak(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_streak(uuid) TO service_role;
