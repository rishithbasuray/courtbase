# CourtBase

Grassroots-basketball platform: verified player profiles, coach/official stat sign-off, tournaments, scouting. Target: testable state by end of September 2026.

## Hard rules

- **Never commit, push, or merge without explicit approval from the user.** Ask every time; approval for one commit/push does not carry over to the next.
- **Always work on the `redesign` branch.** Check the current branch before editing; never switch to or change `main`.
- **Never loosen RLS policies or bypass the RPC pattern.** No new permissive INSERT/UPDATE/DELETE policies, no raw client-side inserts/updates for privileged operations, no `service_role` key in client code.

## Stack

- Vite + React 19, `react-router-dom` with `HashRouter` (required for GitHub Pages — don't switch to `BrowserRouter`).
- Supabase: Postgres, Auth, Storage, RLS. Migrations in `supabase/migrations/`.
- Styling is plain CSS with custom-property tokens (`src/index.css`). Tailwind packages are installed but unused. Do not use Tailwind.
- Deployed by GitHub Actions to https://rishithbasuray.github.io/courtbase/ (workflow passes Supabase env vars into the build).

Commands: `npm run dev` (local preview), `npm run build`, `npm run lint`.

## Backend architecture (settled — don't relitigate)

- **Security-definer RPC pattern**: privileged mutations (verification, team join/invite, tournament creation, match creation, score recording) go through Postgres `security definer` functions that do their own server-side auth checks. Client code calls these RPCs, never raw inserts, for anything privileged. New privileged operations must follow the same pattern.
- **Atomic registration**: the `handle_new_user` trigger (`AFTER INSERT ON auth.users`, migration `20260910130000_atomic_profile_creation.sql`) creates the `profiles` row in the signup transaction from `raw_user_meta_data`. `register()` in `AuthContext.jsx` is a single `supabase.auth.signUp()` call with `options.data` — do not add a separate profile insert.
- **RLS lockdown**: migration `20260914130000_close_tournament_insert_loopholes.sql` removed the loose INSERT policies on `tournaments`/`matches`. Their UPDATE/DELETE/SELECT policies were reviewed and left as-is.
- Production Supabase data has been cleaned of test/debug/e2e accounts — don't create test accounts in production.
- All functional work is complete and verified live (registration, loading/error/empty states, password reset, coach → official → public verification pipeline, team requests, tournament/match RPCs).

## Redesign: "Fast Break, Clean Cut"

Bold navy/orange/gold color energy on a clean, light, precision-tech layout. Should feel futuristic and interactive while staying accessible and professional.

Motion rules:
- No ambient/looping motion (no marquees, no pulsing dots).
- Only load-once animations (e.g. stat counters) and hover-triggered interactions.
- Respect `prefers-reduced-motion`.

### Design tokens (`src/index.css`)

```
--text: #4a5058           /* body text */
--text-h: #0b1c3a         /* headings, navy */
--text-on-dark: #f2f5fa
--text-on-dark-muted: #b7c1d8
--bg: #f8f7f4             /* page background, paper */
--bg-dark: #0b1c3a        /* navy — hero badge, footer, CTA bands, dashboard dark chrome */
--bg-dark-2: #132a52      /* lighter navy hover state */
--nav-bg: #15171b         /* charcoal-black — navbar ONLY, deliberately not navy */
--border: #e3e2dc
--accent: #ff5a1f         /* basketball orange */
--accent-hover: #e0480f
--accent-2: #ffc738       /* gold, secondary accent */
```

Fonts (Google Fonts, linked in `index.html`):
- `--heading`: **Sora** (600–900) for headings/display
- `--sans`: **IBM Plex Sans** for body
- `--mono`: **IBM Plex Mono** for stat numbers (tabular digits)

Use the tokens — never hardcode hex values. The old palette (warm cream `#f0ece2`/`#faf7f1`/`#fff7ed`, old orange `#ea580c`, slate `#1f2933`) and Inter/Poppins must not reappear.

### Done

- `index.html` — font links.
- `src/index.css` — token rewrite; global `h1` no longer uppercase.
- `src/pages/Home.jsx` + `Home.css` — full redesign: eyebrow pill, headline with orange highlighted word, stat-sheet card that counts up once via `IntersectionObserver`, gold→orange diagonal corner cut behind hero, role cards with hover lift, navy CTA band before footer. About/Mission zig-zag content kept, restyled.
- `src/components/Navbar.jsx` + `Navbar.css` — charcoal-black bar (`--nav-bg`; the user found navy "boring"), thin orange top border, 🏀 emoji logo mark, underline-on-hover links.
- `src/pages/Discovery.css` — old hex literals → tokens, plus new classes for the redesigned team/tournament pages (`team-record-*`, `tournament-record-*`, `roster-card`, `matchup-*`, `section-eyebrow`, `empty-panel`).
- Auth pages (Login, Register, ForgotPassword, ResetPassword) — fully redesigned. They share `src/components/AuthShell.jsx`: a split card with a navy panel on the left (gold→orange corner cut, eyebrow, headline, ✓ bullets) and the form on the right. Styles are in `Auth.css`.
- `TeamProfile.jsx` — fully redesigned: team-initials mark, record-style hero, roster grid of cards with avatars.

### Remaining

- `TournamentProfile.jsx` — **partly done.** The hero, metrics strip, team card grid and matchup cards are redesigned. Still to do:
  - The add-match form reuses `.auth-card` with inline overrides.
  - The cancel button has a hardcoded `#6b7280`.
  - The score-entry inputs and button use inline styles.
  - The description block is still the old inline-styled `stats-section`.
- Dashboards (Coach, Official, Scout), `Profile.jsx`, `PlayerProfile.jsx` — not started. They pick up the new colours and fonts from the tokens, but their layouts are unchanged.

The user has more ideas and wants to iterate — ask before making large design decisions.

### Workflow

- Redesign work so far is on `redesign` in commit `6323ba5` ("WIP: Fast Break Clean Cut redesign") and has been pushed to `origin/redesign`. It is not merged to `main`, so the live site does not show it yet.
- Preview locally with `npm run dev`. Don't push after every small change; commit, push or merge only with approval (see Hard rules).
- `src/App.css` and `src/components/Hero.jsx` are dead code (not imported). Leave them unless asked to delete.

## Loose ends

- An "API DISABLED" badge seen in the Supabase dashboard during the RLS review was never followed up. Probably nothing; worth a quick check if it comes up.
