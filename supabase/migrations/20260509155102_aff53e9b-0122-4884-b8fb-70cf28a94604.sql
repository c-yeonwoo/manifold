
REVOKE EXECUTE ON FUNCTION public.compute_streak(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compute_streak(uuid) TO authenticated;
