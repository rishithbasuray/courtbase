-- CourtBase: fix missing table-level grants on game_stats and team_requests
--
-- Both tables were created with Row Level Security policies, but RLS is a
-- second gate on top of ordinary Postgres privileges -- a role needs the
-- base GRANT *and* to pass RLS, not one or the other. Neither table ever
-- got the base GRANT, so every plain client-side read against them (and the
-- one plain client-side insert -- a player submitting a game) has been
-- failing with "permission denied for table ..." the whole time. Every
-- *write* that went through the RPC functions (approve/reject/invite/etc.)
-- was unaffected, since those run as the function owner and bypass this
-- entirely -- which is why this stayed hidden until a plain SELECT was
-- actually inspected.

grant select, insert on public.game_stats to authenticated;
grant select on public.team_requests to authenticated;
