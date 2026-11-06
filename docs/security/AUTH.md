# CourtBase Authentication & Authorization

**Authentication** = proving who you are (logging in).
**Authorization** = what you're allowed to do once you're in.

Part of the security docs: [SECURITY.md](SECURITY.md).

---

## How people get in

- **Login system:** Supabase Auth, with email + password.
- **Sign-up:** `supabase.auth.signUp()` with `name`, `role` and `position`
  as metadata. The `handle_new_user` database trigger creates the matching
  `profiles` row in the same step, so you can never have a login without a
  profile.
- **Sessions:** Supabase issues a login token that's stored in the browser
  (localStorage) and refreshed automatically. Logging out clears it.
- **Password reset:** "Forgot password?" emails a one-time link. The link
  only redirects to the addresses on Supabase's allow-list (localhost:5173
  and the live site). The reset page refuses to work without a valid link.
- **Email change:** done through Supabase Auth. Confirmation goes to both
  the old and new addresses.

### Requirements
- **Privileged roles need approval.** Coach, Tournament Official and Scout
  accounts are approved (by an admin, an invite code, or a tournament
  vouching for them) before they get their powers. Without this, "verified"
  stats can't be trusted.
- **Email confirmation is on.** New accounts must click a link sent to the
  address, so nobody can register with an email they don't own.
- **Passwords:** at least 10 characters, with Supabase's leaked-password
  protection enabled.
- **Account deletion is complete.** It removes the login, the profile and
  uploaded files, through a server-side function (the browser can't delete
  logins).
- **Sessions for deleted accounts** sign out cleanly.

---

## The roles

| Role | Who | How they get it |
|---|---|---|
| **Visitor** (`anon`) | Anyone, not logged in | Automatically |
| **Player** | Athletes | Chosen at sign-up (with parental consent for minors) |
| **Coach** | Team coaches | Requested at sign-up, granted after approval |
| **Tournament Official** | Event organisers | Requested at sign-up, granted after approval |
| **Scout** | Recruiters | Requested at sign-up, granted after approval |
| **Admin** | Founder | Supabase dashboard; a dedicated admin role later |

Roles live in `profiles.role`. The browser shows or hides buttons based on
the role, but that's **only cosmetic**. Every real permission is enforced
in the database (RLS policies and RPC functions).

---

## Who can do what

✅ = allowed · ❌ = denied · "own" = only their own records.
"Enforced by" names the database rule or function that does the check.

### Profiles & teams
| Action | Visitor | Player | Coach | Official | Scout | Enforced by |
|---|---|---|---|---|---|---|
| View public profile fields (name, role, position, photo, team, verified) | ✅ | ✅ | ✅ | ✅ | ✅ | RLS "Public profiles are viewable by everyone" + column grants |
| View anyone's **email** | ❌ | own only | own only | own only | own only | Column grants (email not granted); own email comes from the auth session |
| Edit profile (photo, team link) | ❌ | own | own | own | own | RLS "Users can update their own profile" |
| Create a team | ❌ | ❌ | ✅ | ❌ | ❌ | `create_team_and_join` RPC + `guard_team_creation` trigger |
| Request to join a team | ❌ | ✅ | ❌ | ❌ | ❌ | `request_join_team` RPC |
| Invite a player / accept a join request | ❌ | ❌ | own team | ❌ | ❌ | `invite_player_to_team`, `respond_to_team_request` RPCs |
| Remove a player from roster | ❌ | ❌ | own team | ❌ | ❌ | `remove_player_from_roster` RPC |

### Stats & verification
| Action | Visitor | Player | Coach | Official | Scout | Enforced by |
|---|---|---|---|---|---|---|
| Submit game stats | ❌ | own, as "pending" | ❌ | ❌ | ❌ | RLS "players submit their own pending stats" + `set_game_stat_defaults` trigger |
| See own submissions (any status) | ❌ | own | ❌ | ❌ | ❌ | RLS "players read own submissions" |
| Coach-verify / reject | ❌ | ❌ | own roster | ❌ | ❌ | `coach_verify_game_stat` RPC |
| Final official sign-off | ❌ | ❌ | ❌ | ✅ | ❌ | `official_verify_game_stat` RPC |
| See officially verified stats | ✅ | ✅ | ✅ | ✅ | ✅ | RLS "anyone reads officially verified submissions" (plus a matching `select` grant for `anon`) |

### Tournaments
| Action | Visitor | Player | Coach | Official | Scout | Enforced by |
|---|---|---|---|---|---|---|
| View tournaments, teams, matches | ✅ | ✅ | ✅ | ✅ | ✅ | RLS "anyone reads …" |
| Create a tournament | ❌ | ❌ | ❌ | ✅ | ❌ | `create_tournament` RPC |
| Register own team | ❌ | ❌ | own team | ❌ | ❌ | `register_team_for_tournament` RPC |
| Add match / record score | ❌ | ❌ | ❌ | own tournament | ❌ | `add_tournament_match`, `record_match_score` RPCs |

### Media & scouting
| Action | Visitor | Player | Coach | Official | Scout | Enforced by |
|---|---|---|---|---|---|---|
| Add / remove highlight links | ❌ | own | ❌ | ❌ | ❌ | RLS on `highlights` |
| Upload profile photo | ❌ | own folder | own folder | own folder | own folder | Storage bucket `profile-photos` policies (images only, size limit) |
| Watchlist add / view / remove | ❌ | ❌ | ❌ | ❌ | own | RLS on `watchlist` |

---

## Rules for new features
1. Decide the row above **before** writing code.
2. If it's privileged (it affects someone else's data or the "verified"
   status), it's an RPC with its own role check, not a client-side write.
3. New tables get RLS **on** with no policies, then the narrowest policy
   needed.
4. Add the new row to this document and a matching check to the internal
   security checklist.
