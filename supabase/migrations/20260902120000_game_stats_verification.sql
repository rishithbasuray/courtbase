-- CourtBase: per-game stat submissions + coach/official verification pipeline
--
-- This introduces the workflow described on the About page: a player submits
-- stats from a game, a coach reviews them, and a tournament official gives
-- final verification before they count toward the player's public record.
--
-- Scope note: this migration only wires up the "self-recorded" stat path.
-- The other two entry methods described on the About page (official
-- scoresheets entered after a game, and live recording by an official/coach
-- during a game) can reuse this same table later -- they'd just insert rows
-- with source = 'official' / 'coach' at a higher starting status. Not built
-- here to keep this change reviewable.

create extension if not exists pgcrypto;

-- 1. The submissions table -----------------------------------------------

create table if not exists public.game_stats (
  id uuid primary key default gen_random_uuid(),

  player_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,

  opponent text,
  game_date date not null default current_date,

  source text not null default 'self'
    check (source in ('self', 'coach', 'official')),
  status text not null default 'pending'
    check (status in ('pending', 'coach_verified', 'official_verified', 'rejected')),

  submitted_by uuid references public.profiles(id),

  coach_verified_by uuid references public.profiles(id),
  coach_verified_at timestamptz,

  official_verified_by uuid references public.profiles(id),
  official_verified_at timestamptz,

  rejected_by uuid references public.profiles(id),
  rejected_at timestamptz,
  rejection_reason text,

  minutes int not null default 0,
  points int not null default 0,
  assists int not null default 0,
  rebounds int not null default 0,
  off_rebounds int not null default 0,
  def_rebounds int not null default 0,
  steals int not null default 0,
  blocks int not null default 0,
  turnovers int not null default 0,
  fouls int not null default 0,
  fgm int not null default 0,
  fga int not null default 0,
  three_m int not null default 0,
  three_a int not null default 0,
  ftm int not null default 0,
  fta int not null default 0,

  created_at timestamptz not null default now()
);

create index if not exists game_stats_player_id_idx on public.game_stats(player_id);
create index if not exists game_stats_team_id_idx on public.game_stats(team_id);
create index if not exists game_stats_status_idx on public.game_stats(status);

-- 2. Server-controlled defaults -------------------------------------------
-- Never trust the client for who submitted a row or which team it counts
-- toward -- always derive both from the player's current profile at the
-- moment of insert.

create or replace function public.set_game_stat_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.submitted_by := auth.uid();
  select team_id into new.team_id from public.profiles where id = new.player_id;
  return new;
end;
$$;

drop trigger if exists game_stats_set_defaults on public.game_stats;
create trigger game_stats_set_defaults
  before insert on public.game_stats
  for each row execute function public.set_game_stat_defaults();

-- 3. Row Level Security -----------------------------------------------------
-- Only INSERT and SELECT are exposed to normal client access. All status
-- transitions (approve/reject) go through the security-definer functions
-- below, which perform their own authorization checks -- this avoids trusting
-- the client to only ever update the "right" columns on an UPDATE it's
-- otherwise allowed to send.

alter table public.game_stats enable row level security;

drop policy if exists "players read own submissions" on public.game_stats;
create policy "players read own submissions"
  on public.game_stats for select
  using (auth.uid() = player_id);

drop policy if exists "coach reads own roster submissions" on public.game_stats;
create policy "coach reads own roster submissions"
  on public.game_stats for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'Coach'
        and p.team_id = game_stats.team_id
    )
  );

drop policy if exists "officials read submissions pending final review" on public.game_stats;
create policy "officials read submissions pending final review"
  on public.game_stats for select
  using (
    status in ('coach_verified', 'official_verified')
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'Tournament Official'
    )
  );

drop policy if exists "anyone reads officially verified submissions" on public.game_stats;
create policy "anyone reads officially verified submissions"
  on public.game_stats for select
  using (status = 'official_verified');

drop policy if exists "players submit their own pending stats" on public.game_stats;
create policy "players submit their own pending stats"
  on public.game_stats for insert
  with check (
    auth.uid() = player_id
    and status = 'pending'
    and coach_verified_by is null
    and official_verified_by is null
    and rejected_by is null
  );

-- 4. Verification actions (RPC) ---------------------------------------------

create or replace function public.coach_verify_game_stat(
  submission_id uuid,
  approve boolean,
  reason text default null
)
returns public.game_stats
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  caller_team_id uuid;
  row_record public.game_stats;
begin
  select role, team_id into caller_role, caller_team_id
  from public.profiles where id = caller_id;

  if caller_role is distinct from 'Coach' then
    raise exception 'Only a coach can review this submission.';
  end if;

  select * into row_record from public.game_stats where id = submission_id for update;

  if row_record.id is null then
    raise exception 'Submission not found.';
  end if;

  if row_record.status <> 'pending' then
    raise exception 'This submission has already been reviewed.';
  end if;

  if caller_team_id is null or row_record.team_id is distinct from caller_team_id then
    raise exception 'You can only review submissions from your own roster.';
  end if;

  if approve then
    update public.game_stats
      set status = 'coach_verified', coach_verified_by = caller_id, coach_verified_at = now()
      where id = submission_id
      returning * into row_record;
  else
    update public.game_stats
      set status = 'rejected', rejected_by = caller_id, rejected_at = now(), rejection_reason = reason
      where id = submission_id
      returning * into row_record;
  end if;

  return row_record;
end;
$$;

grant execute on function public.coach_verify_game_stat(uuid, boolean, text) to authenticated;

create or replace function public.official_verify_game_stat(
  submission_id uuid,
  approve boolean,
  reason text default null
)
returns public.game_stats
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  row_record public.game_stats;
begin
  select role into caller_role from public.profiles where id = caller_id;

  if caller_role is distinct from 'Tournament Official' then
    raise exception 'Only a tournament official can give final verification.';
  end if;

  select * into row_record from public.game_stats where id = submission_id for update;

  if row_record.id is null then
    raise exception 'Submission not found.';
  end if;

  if row_record.status <> 'coach_verified' then
    raise exception 'This submission needs coach verification first.';
  end if;

  if approve then
    update public.game_stats
      set status = 'official_verified', official_verified_by = caller_id, official_verified_at = now()
      where id = submission_id
      returning * into row_record;
  else
    update public.game_stats
      set status = 'rejected', rejected_by = caller_id, rejected_at = now(), rejection_reason = reason
      where id = submission_id
      returning * into row_record;
  end if;

  return row_record;
end;
$$;

grant execute on function public.official_verify_game_stat(uuid, boolean, text) to authenticated;

-- 5. Auto-flip the existing profiles.verified flag ---------------------------
-- Keeps every "Verified" badge already in the app (Players, Teams, Scout
-- watchlist, etc.) accurate with zero changes to that display code: the flag
-- now reflects "has at least one officially verified game" instead of being
-- dead weight nothing ever set.

create or replace function public.mark_player_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'official_verified' and (old.status is distinct from 'official_verified') then
    update public.profiles set verified = true
      where id = new.player_id and verified is distinct from true;
  end if;
  return new;
end;
$$;

drop trigger if exists game_stats_mark_verified on public.game_stats;
create trigger game_stats_mark_verified
  after update on public.game_stats
  for each row execute function public.mark_player_verified();

-- 6. Public aggregate view ---------------------------------------------------
-- One row per player, summed from officially verified games only. Owned by
-- the migration role, so it intentionally reads across all of game_stats
-- regardless of the caller's RLS visibility -- safe here because the WHERE
-- clause hard-codes status = 'official_verified', the one status that's
-- already meant to be public.

create or replace view public.player_verified_stats as
select
  player_id,
  count(*) as games_played,
  coalesce(sum(minutes), 0) as minutes,
  coalesce(sum(points), 0) as points,
  coalesce(sum(assists), 0) as assists,
  coalesce(sum(rebounds), 0) as rebounds,
  coalesce(sum(off_rebounds), 0) as off_rebounds,
  coalesce(sum(def_rebounds), 0) as def_rebounds,
  coalesce(sum(steals), 0) as steals,
  coalesce(sum(blocks), 0) as blocks,
  coalesce(sum(turnovers), 0) as turnovers,
  coalesce(sum(fouls), 0) as fouls,
  coalesce(sum(fgm), 0) as fgm,
  coalesce(sum(fga), 0) as fga,
  coalesce(sum(three_m), 0) as three_m,
  coalesce(sum(three_a), 0) as three_a,
  coalesce(sum(ftm), 0) as ftm,
  coalesce(sum(fta), 0) as fta
from public.game_stats
where status = 'official_verified'
group by player_id;

grant select on public.player_verified_stats to anon, authenticated;
