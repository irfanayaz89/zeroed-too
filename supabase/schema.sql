-- Focus'd V1 database schema: the whole thing, in one file.
--
-- There are no real users yet, so instead of migrations this file drops the
-- app's tables and creates them fresh. Running it DELETES ALL APP DATA.
-- Once there are real users, switch back to additive migrations.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.update_updated_at() cascade;
drop function if exists public.delete_my_account();
drop table if exists public.hobby_prompts cascade;
drop table if exists public.parent_shares cascade;
drop table if exists public.daily_reflections cascade;
drop table if exists public.daily_logs cascade;
drop table if exists public.timetable_blocks cascade;
drop table if exists public.profiles cascade;

-- One row per user: onboarding answers and preferences.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  age int,
  age_group text,
  hobbies text[],
  focus_struggle text,
  onboarding_complete boolean not null default false,
  focus_areas text[],
  free_times text[],
  sessions_per_day int,
  session_length int,
  buddy_name text,
  created_at timestamptz not null default now()
);

-- Recurring focus sessions. Times are "HH:MM"; days_of_week uses 0 = Sunday.
create table public.timetable_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null,
  start_time text not null,
  end_time text not null,
  days_of_week int[] not null default '{}',
  reminder_enabled boolean not null default false,
  reminder_minutes_before int,
  reminder_style text,
  notes_template text,
  created_at timestamptz not null default now()
);
create index timetable_blocks_user_idx on public.timetable_blocks (user_id);

-- What happened to one session on one day.
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  block_id uuid not null references public.timetable_blocks (id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  skipped boolean not null default false,
  snoozed_count int not null default 0,
  block_note text,
  completed_at timestamptz,
  -- Today's start after "Running late" ("HH:MM").
  planned_start text,
  started_at timestamptz,
  -- Minutes actually focused (popping early counts what was done).
  focused_minutes int,
  created_at timestamptz not null default now(),
  unique (block_id, date)
);
create index daily_logs_user_date_idx on public.daily_logs (user_id, date);

-- The end-of-day check-in.
create table public.daily_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  mood text check (mood in ('great', 'good', 'okay', 'meh', 'rough')),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Everyone (including guest/anonymous users) sees and edits only their own rows.
alter table public.profiles enable row level security;
alter table public.timetable_blocks enable row level security;
alter table public.daily_logs enable row level security;
alter table public.daily_reflections enable row level security;

-- Guests sign in anonymously and use the authenticated role, so the anon role
-- (no session at all) never needs these tables.
revoke all on public.profiles, public.timetable_blocks, public.daily_logs, public.daily_reflections from anon;

create policy "own profile" on public.profiles
  for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "own blocks" on public.timetable_blocks
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own logs" on public.daily_logs
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own reflections" on public.daily_reflections
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Every new account (guest or email) gets an empty profile straight away.
-- The app also creates one if it's missing, so this is a safety net.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets a signed-in user delete their own account. Their rows go with it (cascade).
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Give accounts that already exist an empty profile again.
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;
