-- CourtBase: close the same client-trust loophole in tournaments/matches
-- that team creation had before the team_requests migration.
--
-- Right now Tournaments.jsx / TournamentProfile.jsx only check the caller's
-- role or ownership *in the browser* before inserting/updating tournaments,
-- tournament_teams, and matches directly. Nothing on the server stops a
-- logged-in user from calling the same API with different values -- create a
-- tournament without being a Tournament Official, register a team that
-- isn't theirs, add a fake match, or overwrite a score on a match they don't
-- own. That undermines the "verified" story the rest of the app is built
-- around, so this moves all of it behind security-definer RPCs, same
-- pattern as team_requests and game_stats.
--
-- These three tables hold no personal data (just tournament/match/roster
-- info that the app already displays to anyone, logged in or not), so
-- reading them stays fully public -- only the writes move behind RPCs.

alter table public.tournaments enable row level security;
alter table public.tournament_teams enable row level security;
alter table public.matches enable row level security;

-- 1. Public read on all three -------------------------------------------

drop policy if exists "anyone reads tournaments" on public.tournaments;
create policy "anyone reads tournaments"
  on public.tournaments for select
  using (true);

drop policy if exists "anyone reads tournament registrations" on public.tournament_teams;
create policy "anyone reads tournament registrations"
  on public.tournament_teams for select
  using (true);

drop policy if exists "anyone reads matches" on public.matches;
create policy "anyone reads matches"
  on public.matches for select
  using (true);

-- No insert/update/delete policies are defined for any of the three tables
-- above -- with RLS enabled and zero matching policies, the client-side
-- inserts/updates that Tournaments.jsx/TournamentProfile.jsx used to send
-- directly will now be rejected. All writes go through the functions below.
--
-- NOTE: if any of these three tables already had an INSERT/UPDATE policy
-- from before this migration (e.g. added by hand in the Supabase
-- dashboard), that old policy is still there and this migration doesn't
-- know its name to drop it. Worth a quick check in Table Editor -> each
-- table -> RLS Policies to confirm nothing older than this migration is
-- still allowing a direct write.

-- 2. Create a tournament (Tournament Official only) ---------------------

create or replace function public.create_tournament(
  p_name text,
  p_description text default null,
  p_location text default null,
  p_start_date date default null,
  p_end_date date default null
)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  row_record public.tournaments;
begin
  select role into caller_role from public.profiles where id = caller_id;

  if caller_role is distinct from 'Tournament Official' then
    raise exception 'Only a tournament official can create a tournament.';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'Please enter a tournament name.';
  end if;

  insert into public.tournaments (name, description, location, start_date, end_date, created_by)
  values (p_name, p_description, p_location, p_start_date, p_end_date, caller_id)
  returning * into row_record;

  return row_record;
end;
$$;

grant execute on function public.create_tournament(text, text, text, date, date) to authenticated;

-- 3. Register a coach's own team for a tournament ------------------------

create or replace function public.register_team_for_tournament(p_tournament_id uuid)
returns public.tournament_teams
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  caller_team_id uuid;
  row_record public.tournament_teams;
begin
  select role, team_id into caller_role, caller_team_id from public.profiles where id = caller_id;

  if caller_role is distinct from 'Coach' or caller_team_id is null then
    raise exception 'Only a coach managing a team can register for a tournament.';
  end if;

  if not exists (select 1 from public.tournaments where id = p_tournament_id) then
    raise exception 'Tournament not found.';
  end if;

  if exists (
    select 1 from public.tournament_teams
    where tournament_id = p_tournament_id and team_id = caller_team_id
  ) then
    raise exception 'Your team is already registered for this tournament.';
  end if;

  insert into public.tournament_teams (tournament_id, team_id)
  values (p_tournament_id, caller_team_id)
  returning * into row_record;

  return row_record;
end;
$$;

grant execute on function public.register_team_for_tournament(uuid) to authenticated;

-- 4. Add a match (only the tournament's creator) --------------------------

create or replace function public.add_tournament_match(
  p_tournament_id uuid,
  p_team_a_id uuid,
  p_team_b_id uuid,
  p_match_date date default null
)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  row_record public.matches;
begin
  if not exists (
    select 1 from public.tournaments
    where id = p_tournament_id and created_by = caller_id
  ) then
    raise exception 'Only the tournament''s creator can add matches to it.';
  end if;

  if p_team_a_id = p_team_b_id then
    raise exception 'Teams must be different.';
  end if;

  if not exists (
    select 1 from public.tournament_teams
    where tournament_id = p_tournament_id and team_id = p_team_a_id
  ) or not exists (
    select 1 from public.tournament_teams
    where tournament_id = p_tournament_id and team_id = p_team_b_id
  ) then
    raise exception 'Both teams must be registered for this tournament first.';
  end if;

  insert into public.matches (tournament_id, team_a_id, team_b_id, match_date, status)
  values (p_tournament_id, p_team_a_id, p_team_b_id, p_match_date, 'scheduled')
  returning * into row_record;

  return row_record;
end;
$$;

grant execute on function public.add_tournament_match(uuid, uuid, uuid, date) to authenticated;

-- 5. Record a match score (only the parent tournament's creator) ---------

create or replace function public.record_match_score(
  p_match_id uuid,
  p_team_a_score int,
  p_team_b_score int
)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  row_record public.matches;
begin
  select m.* into row_record
  from public.matches m
  join public.tournaments t on t.id = m.tournament_id
  where m.id = p_match_id and t.created_by = caller_id;

  if row_record.id is null then
    raise exception 'Only the tournament''s creator can record scores for this match.';
  end if;

  if p_team_a_score < 0 or p_team_b_score < 0 then
    raise exception 'Scores can''t be negative.';
  end if;

  update public.matches
    set team_a_score = p_team_a_score, team_b_score = p_team_b_score, status = 'completed'
    where id = p_match_id
    returning * into row_record;

  return row_record;
end;
$$;

grant execute on function public.record_match_score(uuid, int, int) to authenticated;
