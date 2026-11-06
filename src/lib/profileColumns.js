// Columns anyone may read from `profiles`. `email` is deliberately absent:
// the database only grants these columns to the public, so asking for
// "*" (or for email) is refused. Your own email comes from the auth session
// instead (see AuthContext.loadProfile).
export const PUBLIC_PROFILE_COLUMNS =
  "id, name, role, position, verified, stats, created_at, team_id, profile_photo_url";
