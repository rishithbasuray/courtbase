-- CourtBase: coach-gated team roster requests
--
-- Closes a loophole in the original team-join flow: a player could
-- previously attach themselves to *any* team via a free search-and-click,
-- which undermined the verification pipeline's trust in team_id (verification
-- is only meaningful if "this player is on this team" is actually true).
-- From here on, only a Coach can create a team, and joining one requires
-- mutual consent: either a player requests to join and the team's coach
-- accepts, or a coach invites a specific unattached player and the player
-- accepts.
--
-- Coach succession (what happens to a team when its coach leaves) is
-- intentionally NOT addressed here -- still being designed. A coach can
-- still leave their team exactly as before; this migration doesn't change
-- that behavior either way.

-- 1. The requests table -----------------------------------------------------

create table if not exists public.team_requests (
  id uuid primary key default gen_random_uuid(),

  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,

  direction text not null check (direction in ('player_request', 'coach_invite')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),

  created_by uuid references public.profiles(id),
  responded_by uuid references public.profiles(id),
  responded_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists team_requests_team_id_idx on public.team_requests(team_id);
create index if not exists team_requests_player_id_idx on public.team_requests(player_id);
create index if not exists team_requests_status_idx on public.team_requests(status);

-- Only one open request between a given player and team at a time...
create unique index if not exists team_requests_one_pending_pair
  on public.team_requests(team_id, player_id)
  where status = 'pending';

-- ...and only one outgoing join request per player at a time, so a player
-- can't quietly apply to five teams and take whichever answers first.
create unique index if not exists team_requests_one_outgoing_per_player
  on public.team_requests(player_id)
  where status = 'pending' and direction = 'player_request';

-- 2. Row Level Security: read-only for normal clients ------------------------
-- Every state change (create, accept, decline, cancel) goes through the
-- functions below instead of raw INSERT/UPDATE, so the only client access
-- this table needs is SELECT.

alter table public.team_requests enable row level security;

drop policy if exists "players see their own requests" on public.team_requests;
create policy "players see their own requests"
  on public.team_requests for select
  using (auth.uid() = player_id);

drop policy if exists "coach sees requests for their team" on public.team_requests;
create policy "coach sees requests for their team"
  on public.team_requests for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'Coach'
        and p.team_id = team_requests.team_id
    )
  );

-- 3. Guard rails on the existing tables ---------------------------------------
-- These are triggers rather than RLS policies so they hold no matter what
-- policies already exist on `teams` and `profiles` -- they don't need to
-- know about or touch that existing configuration to be effective.

create or replace function public.guard_team_creation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is distinct from 'Coach' then
    raise exception 'Only a coach can create a team.';
  end if;
  return new;
end;
$$;

drop trigger if exists teams_guard_creation on public.teams;
create trigger teams_guard_creation
  before insert on public.teams
  for each row execute function public.guard_team_creation();

create or replace function public.guard_team_id_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No real change, or leaving a team (-> null): always fine.
  if new.team_id is not distinct from old.team_id or new.team_id is null then
    return new;
  end if;

  -- Joining or switching teams must go through request acceptance, which
  -- sets this flag for the duration of its own transaction only.
  if coalesce(current_setting('app.trusted_team_change', true), '') = 'true' then
    return new;
  end if;

  raise exception 'Joining a team requires a request that gets accepted -- it can''t be set directly.';
end;
$$;

drop trigger if exists profiles_guard_team_id on public.profiles;
create trigger profiles_guard_team_id
  before update of team_id on public.profiles
  for each row execute function public.guard_team_id_change();

-- 4. Request lifecycle (RPC) --------------------------------------------------

create or replace function public.request_join_team(target_team_id uuid)
returns public.team_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  caller_team_id uuid;
  row_record public.team_requests;
begin
  select role, team_id into caller_role, caller_team_id from public.profiles where id = caller_id;

  if caller_role is distinct from 'Player' then
    raise exception 'Only players can request to join a team.';
  end if;

  if caller_team_id is not null then
    raise exception 'Leave your current team before requesting to join another.';
  end if;

  if exists (
    select 1 from public.team_requests
    where player_id = caller_id and direction = 'player_request' and status = 'pending'
  ) then
    raise exception 'You already have a pending join request. Cancel it before sending another.';
  end if;

  if exists (
    select 1 from public.team_requests
    where team_id = target_team_id and player_id = caller_id and status = 'pending'
  ) then
    raise exception 'There is already a pending request between you and this team.';
  end if;

  insert into public.team_requests (team_id, player_id, direction, created_by)
  values (target_team_id, caller_id, 'player_request', caller_id)
  returning * into row_record;

  return row_record;
end;
$$;

grant execute on function public.request_join_team(uuid) to authenticated;

create or replace function public.invite_player_to_team(target_player_id uuid)
returns public.team_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  caller_team_id uuid;
  target_role text;
  target_team_id uuid;
  row_record public.team_requests;
begin
  select role, team_id into caller_role, caller_team_id from public.profiles where id = caller_id;

  if caller_role is distinct from 'Coach' or caller_team_id is null then
    raise exception 'Only a coach managing a team can send invites.';
  end if;

  select role, team_id into target_role, target_team_id from public.profiles where id = target_player_id;

  if target_role is distinct from 'Player' then
    raise exception 'You can only invite a player.';
  end if;

  if target_team_id is not null then
    raise exception 'That player is already on a team.';
  end if;

  if exists (
    select 1 from public.team_requests
    where team_id = caller_team_id and player_id = target_player_id and status = 'pending'
  ) then
    raise exception 'There is already a pending request between this player and your team.';
  end if;

  insert into public.team_requests (team_id, player_id, direction, created_by)
  values (caller_team_id, target_player_id, 'coach_invite', caller_id)
  returning * into row_record;

  return row_record;
end;
$$;

grant execute on function public.invite_player_to_team(uuid) to authenticated;

create or replace function public.respond_to_team_request(request_id uuid, approve boolean)
returns public.team_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  caller_team_id uuid;
  row_record public.team_requests;
  target_current_team uuid;
begin
  select * into row_record from public.team_requests where id = request_id for update;

  if row_record.id is null then
    raise exception 'Request not found.';
  end if;

  if row_record.status <> 'pending' then
    raise exception 'This request has already been resolved.';
  end if;

  select role, team_id into caller_role, caller_team_id from public.profiles where id = caller_id;

  if row_record.direction = 'player_request' then
    if caller_role is distinct from 'Coach' or caller_team_id is distinct from row_record.team_id then
      raise exception 'Only the coach of this team can respond to this request.';
    end if;
  else -- coach_invite
    if caller_id is distinct from row_record.player_id then
      raise exception 'Only the invited player can respond to this invite.';
    end if;
  end if;

  if approve then
    select team_id into target_current_team from public.profiles where id = row_record.player_id;
    if target_current_team is not null then
      raise exception 'This player already joined a team while this request was pending.';
    end if;

    perform set_config('app.trusted_team_change', 'true', true);
    update public.profiles set team_id = row_record.team_id where id = row_record.player_id;

    update public.team_requests
      set status = 'accepted', responded_by = caller_id, responded_at = now()
      where id = request_id
      returning * into row_record;

    -- Clean up any other pending requests now that the player has a team.
    update public.team_requests
      set status = 'cancelled', responded_by = caller_id, responded_at = now()
      where player_id = row_record.player_id and status = 'pending' and id <> row_record.id;
  else
    update public.team_requests
      set status = 'declined', responded_by = caller_id, responded_at = now()
      where id = request_id
      returning * into row_record;
  end if;

  return row_record;
end;
$$;

grant execute on function public.respond_to_team_request(uuid, boolean) to authenticated;

create or replace function public.cancel_team_request(request_id uuid)
returns public.team_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  row_record public.team_requests;
begin
  select * into row_record from public.team_requests where id = request_id for update;

  if row_record.id is null then
    raise exception 'Request not found.';
  end if;

  if row_record.status <> 'pending' then
    raise exception 'This request has already been resolved.';
  end if;

  if row_record.created_by is distinct from caller_id then
    raise exception 'You can only cancel a request you sent.';
  end if;

  update public.team_requests
    set status = 'cancelled', responded_by = caller_id, responded_at = now()
    where id = request_id
    returning * into row_record;

  return row_record;
end;
$$;

grant execute on function public.cancel_team_request(uuid) to authenticated;

create or replace function public.remove_player_from_roster(target_player_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  caller_team_id uuid;
  target_team_id uuid;
  row_record public.profiles;
begin
  select role, team_id into caller_role, caller_team_id from public.profiles where id = caller_id;

  if caller_role is distinct from 'Coach' or caller_team_id is null then
    raise exception 'Only a coach managing a team can remove players.';
  end if;

  select team_id into target_team_id from public.profiles where id = target_player_id;

  if target_team_id is distinct from caller_team_id then
    raise exception 'That player is not on your roster.';
  end if;

  perform set_config('app.trusted_team_change', 'true', true);
  update public.profiles set team_id = null where id = target_player_id
    returning * into row_record;

  return row_record;
end;
$$;

grant execute on function public.remove_player_from_roster(uuid) to authenticated;

-- 5. Team creation, atomically joined by its coach ----------------------------
-- Replaces the old "insert into teams, then setTeam(newId)" two-step client
-- flow -- the second step is now blocked by the trigger above for anyone
-- outside this function, so creating and attaching happen together here.

create or replace function public.create_team_and_join(
  team_name text,
  team_city text default null,
  team_coach text default null
)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  caller_team_id uuid;
  row_record public.teams;
begin
  select role, team_id into caller_role, caller_team_id from public.profiles where id = caller_id;

  if caller_role is distinct from 'Coach' then
    raise exception 'Only a coach can create a team.';
  end if;

  if caller_team_id is not null then
    raise exception 'Leave your current team before creating a new one.';
  end if;

  insert into public.teams (name, city, coach, created_by)
  values (team_name, team_city, team_coach, caller_id)
  returning * into row_record;

  perform set_config('app.trusted_team_change', 'true', true);
  update public.profiles set team_id = row_record.id where id = caller_id;

  return row_record;
end;
$$;

grant execute on function public.create_team_and_join(text, text, text) to authenticated;
