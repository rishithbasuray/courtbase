-- CourtBase: make account registration atomic
--
-- AuthContext.register() used to do two separate client-side steps:
--   1. supabase.auth.signUp(...)
--   2. supabase.from("profiles").insert(...)
--
-- If anything went wrong between those two calls -- a dropped connection, a
-- transient Supabase Auth hiccup, the client throwing while parsing the
-- signUp response -- step 1 had already committed a real row in auth.users,
-- but step 2 never ran. The result is an orphaned account: no matching
-- profiles row means every future login fails ("0 rows" on the profile
-- lookup), and the email is already taken so the person can never
-- re-register either. This is exactly what happened live during testing on
-- 2026-09-10 with e2e-coach-20260910@example.com, which is now stuck and
-- needs a manual delete from the Supabase dashboard.
--
-- The fix: move profile creation into a trigger on auth.users itself, so it
-- runs inside the *same* database transaction Supabase Auth uses to create
-- the user. If profile creation fails, the whole transaction rolls back --
-- including the auth.users insert -- so signUp() just returns an error and
-- no orphan is ever created. This also means profile creation no longer
-- depends on the client successfully receiving/parsing the signUp response
-- at all, which matches how the "JWT issued at future" failure was able to
-- leave a user row behind with nothing to insert the profile.
--
-- AuthContext.register() now passes name/role/position through
-- `options.data` on signUp() instead of inserting them itself -- this
-- trigger reads them back out of auth.users.raw_user_meta_data.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, name, email, role, position, profile_photo_url, verified, stats, team_id
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'Player'),
    coalesce(new.raw_user_meta_data->>'position', ''),
    '',
    false,
    '{
      "gamesPlayed": 0, "minutes": 0, "points": 0, "assists": 0, "rebounds": 0,
      "offRebounds": 0, "defRebounds": 0, "steals": 0, "blocks": 0,
      "turnovers": 0, "fouls": 0, "fgm": 0, "fga": 0, "fgPct": 0,
      "threeM": 0, "threeA": 0, "threePct": 0, "ftm": 0, "fta": 0, "ftPct": 0
    }'::jsonb,
    null
  )
  -- Belt-and-suspenders: if a profiles row for this id somehow already
  -- exists, don't fail the signup over it.
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
