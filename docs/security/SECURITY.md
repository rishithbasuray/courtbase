# CourtBase Security Policy

The rules every change to CourtBase must follow. If a change breaks one of
these rules, it doesn't ship. Each rule is verified with an internal
pre-launch checklist and threat model, which are kept private.

Related: [AUTH.md](AUTH.md) (who can do what) ·
[DATA_SECURITY.md](DATA_SECURITY.md) (what data we hold).

---

## 1. Protect secrets: keep keys out of code

**The rule:** no secret ever goes into the code, the Git history, a
screenshot, or a chat message.

| Secret | Where it lives | Notes |
|---|---|---|
| Supabase URL + **anon key** | `.env` locally; GitHub Secrets for the deploy | The anon key is *meant* to be public: it ships inside the website. It is safe **only because** the database's permission rules (RLS) decide what it can do. Never rely on it being hidden. |
| Supabase **service_role key** | Supabase dashboard only | It bypasses every permission rule. It must **never** be in frontend code, `.env`, GitHub or any chat. If a feature seems to need it, the feature belongs in a database function or a server-side Edge Function instead. |
| Supabase account password, GitHub password | Your password manager | Never typed by Claude, never shared. |
| Future keys (email provider, analytics, payments) | Supabase Edge Function secrets or GitHub Secrets | Never in `src/`. |

**Required:**
- `.env` and `.env.local` stay in `.gitignore` **and untracked**. Adding a
  file to `.gitignore` doesn't stop Git tracking a file it already has;
  that needs `git rm --cached <file>`. Stage files **by name**, never with
  `git add .`.
- Nothing in `src/` contains a key, password or token. The only allowed
  values are `import.meta.env.VITE_SUPABASE_URL` and
  `import.meta.env.VITE_SUPABASE_ANON_KEY`.
- Anything starting with `VITE_` ends up in the public website. Only
  public-safe values may use that prefix.
- **If a secret leaks** (committed, pasted, screenshotted): rotate it in the
  provider's dashboard **first**, then remove it from the code. Deleting the
  commit is not enough, because Git history and GitHub caches keep copies.

## 2. Validate input: check every request

**The rule:** the browser is not trusted. Every check that matters must also
happen **in the database**, because anyone can send requests straight to
Supabase with the public anon key and skip the website entirely.

- **Client-side checks are for convenience only.** Form checks in React
  (e.g. "made can't exceed attempted", "use a YouTube link", "image under
  5 MB") give quick feedback but protect nothing.
- **Server-side checks are the real protection.** They take the form of:
  - **RLS policies:** who may read or write each row.
  - **Security-definer RPC functions** for every privileged action
    (verifying stats, team join/invite, tournaments, matches, scores). Each
    function checks the caller's identity and role itself (`auth.uid()`,
    the `profiles.role` lookup) before doing anything.
  - **Constraints and triggers** for data shape: required fields,
    non-negative numbers, allowed URL formats, allowed status values.
- **Never trust IDs or roles sent by the browser.** Use `auth.uid()` inside
  the database instead of a `player_id` or `role` passed in a request.
- **Output:** React escapes text automatically. Never use
  `dangerouslySetInnerHTML`. Any user-supplied link rendered as `href` must
  be `https://` only.
- **Uploads:** check type and size on the server too (Storage bucket
  settings and policies), not just in the browser.

## 3. Least privilege: grant only the access needed

**The rule:** every role, table and key gets the **smallest** access that
still lets the feature work. When in doubt, deny.

- **RLS is on for every table.** A table with RLS on and no policy denies
  everything, which is the safe default.
- **No broad write policies.** Writes for privileged actions go through
  RPC functions, never through open `INSERT`/`UPDATE` policies. Never
  loosen a policy to make a feature work; add an RPC instead.
- **Read access is column-aware.** "Public" tables expose only public
  columns (e.g. `profiles` exposes everything except `email`).
- **`anon` (logged-out visitors)** can read public profile, team,
  tournament and verified-stat data, and nothing else.
- **`authenticated` (logged-in users)** get only what their role needs; see
  [AUTH.md](AUTH.md).
- **People:** only the founder has Supabase/GitHub admin. Contributors get
  the lowest role that lets them do their task, and it's removed afterwards.
- **Claude / AI assistants:** may read the dashboard; any production change
  needs an explanation and an explicit yes first.

## 4. Review dependencies: check what you install

**The rule:** every library added to `package.json` is code we run on our
users' devices. Treat it as such.

Before adding a package:
1. **Is it needed?** Can existing code or a few lines do the job?
2. **Is it trustworthy?** Check that it's widely used, actively maintained,
   from the expected author, and that the exact name is right (watch for
   look-alike names).
3. **Is it mature?** Prefer a version that has been out **at least two
   weeks**. Brand-new releases are where hijacked packages show up.
4. **Pin it** to an exact version (`npm install pkg@1.2.3 --save-exact`).
5. **Check the cost:** how much it adds to the download (`npm run build`
   shows sizes).

Ongoing:
- Run `npm audit` before every launch and after adding packages. Fix
  high/critical issues before shipping.
- Remove packages that aren't used.
- Commit `package-lock.json` so everyone installs the exact same versions.
  Deploys use `npm ci`.
- Review GitHub Actions the same way: pin actions to a version, and keep
  workflow secrets to the minimum needed.

---

## Reporting a security problem

If you find a vulnerability in CourtBase, **don't open a public GitHub
issue.** Email the founder privately. We aim to acknowledge reports within
3 days and fix critical issues before anything else.
