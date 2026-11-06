# CourtBase Data Security

What personal data CourtBase collects, how sensitive it is, how it's
protected, and when it's deleted.

Part of the security docs: [SECURITY.md](SECURITY.md).

> **Important:** many CourtBase players are **minors**. India's Digital
> Personal Data Protection Act 2023 (DPDP) requires **verifiable parental
> consent** before processing data of anyone under 18. Similar rules apply
> elsewhere (GDPR in the EU/UK, COPPA in the US for under-13s). Get a
> lawyer's review before launch; this document is not legal advice.

---

## What we collect

| Data | Where it's stored | Who sees it | Sensitivity |
|---|---|---|---|
| **Email address** | Supabase Auth; also `profiles.email` (copied at sign-up) | Only the account owner. Never shown publicly. | 🔴 High: personal contact data |
| **Password** | Supabase Auth (hashed by Supabase; we never see it) | Nobody | 🔴 High |
| **Login sessions/tokens** | The user's browser (localStorage) | That browser only | 🔴 High: whoever holds it is logged in |
| **Name** | `profiles.name` | Public | 🟠 Medium (a minor's name is high) |
| **Role, position, team** | `profiles`, `teams` | Public | 🟢 Low |
| **Profile photo** | Supabase Storage `profile-photos` (public URLs) | Public, to anyone with the link | 🟠 Medium (a minor's face is high) |
| **Game statistics** | `game_stats` | Pending: player, coach, officials. Verified: public. | 🟢 Low |
| **Verification trail** (who approved/rejected, reasons) | `game_stats` (`*_verified_by`, `rejection_reason`) | Player, their coach, officials | 🟠 Medium |
| **Highlight video links** | `highlights` | Public | 🟠 Medium (videos may show minors) |
| **Team join requests/invites** | `team_requests` | The player and the team's coach | 🟢 Low |
| **Scout watchlists** | `watchlist` | That scout only | 🟠 Medium: reveals recruiting interest |
| **Contact-form messages** | Must be stored and delivered to the team | The team only | 🟠 Medium: may contain personal details or safety reports |

**We do not collect:** payment details, government IDs, precise location,
phone numbers, or date of birth.

**Rule:** collect the least data that the feature needs. Before adding a
new field, add it to this table with its sensitivity and who sees it.

---

## How it must be protected

### Everywhere
- **In transit:** HTTPS only (GitHub Pages and Supabase both enforce it).
- **At rest:** Supabase encrypts its database and storage disks.
- **Access:** RLS and column grants decide who reads what (see
  [AUTH.md](AUTH.md)). Public by default is **not** allowed. A field is
  public only if this document says so.

### By sensitivity
- 🔴 **High (email, password, sessions):**
  - Email is **never** readable by other users or visitors. `profiles.email`
    is excluded from public column grants, and the app gets the owner's
    email from their auth session. Long term, drop `profiles.email`
    entirely.
  - Never log, display or export these values. Never paste them into
    tickets or chats.
  - Service-role access (which can read everything) stays in the Supabase
    dashboard only.
- 🟠 **Medium (names, photos, videos, watchlists, verification notes):**
  - Visible only to the people in the "who sees it" column.
  - For **minors**: parental consent before the profile goes public, and an
    option for a limited profile (e.g. initials, no photo) until then.
  - Uploads: images only, under 5 MB, checked on the server as well as in
    the browser.
- 🟢 **Low:** can be public, but writes still go through RLS/RPC checks.

### Backups
- Daily database backups must be on (Supabase Pro plan or above), and a
  restore must be tested at least once before launch and yearly after.

---

## When data is deleted

| Data | Kept for | How it's deleted |
|---|---|---|
| Account (login + profile) | Until the user deletes it | "Delete account" removes the Supabase Auth user and the profile row, through a server-side function. |
| Profile photo | Until replaced or the account is deleted | Delete the old file on replace, and all of the user's files on account deletion. |
| Highlights | Until removed by the player or the account is deleted | Row delete. |
| Game stats | Verified stats are part of tournament records; pending/rejected ones are personal | On account deletion: delete pending/rejected. Decide (with legal advice) whether verified stats are deleted or anonymised. |
| Team requests | Until answered or cancelled | Delete answered requests after 90 days (to build). |
| Watchlists | Until the scout removes them or the account is deleted | Row delete. |
| Test/demo data | Never in production | Delete right after testing. |
| Inactive accounts | Policy to decide | Suggestion: email after 2 years inactive, delete 30 days later if there's no response. |

**User rights to support** (DPDP/GDPR): see their data, correct it, delete
it, and withdraw consent (a parent for a minor). Each needs a clear way to
do it in the app or by email, answered within 30 days.

**Breach response:** if personal data leaks, contain it first (revoke the
access), then assess what was exposed and notify affected users and, where
required, the authorities (DPDP requires reporting breaches to the Data
Protection Board).
