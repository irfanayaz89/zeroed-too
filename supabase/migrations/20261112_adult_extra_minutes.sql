-- Zeroed (adult) shares the Supabase project with Zero'd (teen), so a user can
-- sign in to either app and keep their progress.
--
-- This is the only change the adult app needs. It is additive: the teen app
-- ignores the new column. Safe to run more than once.

-- Minutes added today with "+5 min" or "Running late".
alter table public.daily_logs
  add column if not exists extra_minutes int not null default 0;
