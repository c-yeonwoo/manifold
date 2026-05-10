CREATE UNIQUE INDEX IF NOT EXISTS goal_logs_user_goal_date_uniq
ON public.goal_logs (user_id, goal_id, log_date);