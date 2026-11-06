-- CourtBase: stop exposing profiles.email through the public API.
--
-- The "Public profiles are viewable by everyone" policy lets anyone --
-- including logged-out visitors holding the public anon key -- read every
-- column of every profile, and `email` is one of those columns. The site
-- never shows another user's email, so the fix is to grant SELECT on every
-- column *except* email. The row-level policy stays exactly as it is.
--
-- Run this only after the client code that selects explicit columns
-- (src/lib/profileColumns.js) is live: the old `select("*")` would be
-- refused once email is no longer readable.
--
-- Users still see their own email: the app reads it from their auth
-- session, not from this table. Security-definer functions (signup
-- trigger, RPCs) run as the table owner and are unaffected, as are
-- INSERT/UPDATE/DELETE grants.
--
-- Rollback: grant select on public.profiles to anon, authenticated;

revoke select on public.profiles from anon, authenticated;

grant select (
  id, name, role, position, verified, stats, created_at, team_id, profile_photo_url
) on public.profiles to anon, authenticated;
