# Phase 2E admin authentication

## Routes and authorization

- `/admin/login`: email/password form submitting a Next.js Server Action.
  No signup, public registration, password logging or browser Auth client is used.
- `/admin`: server-protected dashboard showing its title, verified admin email,
  Publications placeholder and logout button only. No CRUD controls exist.
- Login authenticates through `signInWithPassword`, then `getUser` verifies the
  current user and `is_publications_admin` checks the existing private UUID
  allowlist. Authentication and editable user metadata cannot grant admin access.
- A non-admin login clears its newly issued local session and redirects to a
  fixed denied message. Anonymous dashboard requests redirect to `/admin/login`;
  authenticated non-admin requests redirect to its fixed denied message.
- Dashboard authorization is checked inside the page, separately from proxy
  token refresh. Every future protected action must independently call the
  existing admin helper; a layout or proxy is never sufficient authorization.
- Logout uses local Supabase sign-out, expires all local project Auth cookie
  chunks even when remote revocation is unavailable, invalidates the admin
  navigation cache, and redirects to login. Other cookies remain untouched.

The SSR client and proxy set HttpOnly, SameSite=Lax cookies, with Secure cookies
in production. Production hosting must use HTTPS. Admin responses are private,
no-store and marked noindex. Redirects are fixed internal paths; form credentials
and raw provider errors never appear in URLs or messages. Next.js Server Actions
provide their standard same-origin form protection. Supabase provides the Auth
provider's password verification and rate limits.

Missing configuration denies admin access safely and renders the login screen
with a configuration message rather than granting access. The public website,
publication read layer, static reference data, CSS and Citations are unchanged.

## First-admin bootstrap

The project initially had no Auth users. The operator created the first confirmed
email/password user through Supabase's authenticated dashboard, entering the
password privately in the browser. Codex detected the sole new Auth user UUID via
the authenticated CLI and added only that UUID to `private.publications_admins`.
No password, service-role key or other privileged credential was requested,
printed, stored in application configuration or included in Git.

`scripts/prepare-admin-bootstrap.mjs <verified-auth-user-uuid>` prepares ignored
transactional SQL for a trusted operator's CLI connection. It requires a real
confirmed Auth user, refuses to bootstrap a different account when another admin
already exists, and is repeatable for the same selected UUID. It is not an app
endpoint, does not create an account, and is never callable by public users.
The generated file is `supabase/.temp/first-admin-bootstrap.sql`; temporary SQL
is removed after execution. Persistent verification confirmed exactly one admin,
the selected UUID, 37 publications and independent hero counter `40+`.

## Verification

- All 20 live database authorization assertions passed, including after bootstrap.
- All 22 local tests passed. Authentication tests cover anonymous/non-admin
  denial, allowlisted acceptance, failed passwords, missing configuration, logout
  followed by denied access, cookie chunks, remote logout failure and no signup UI.
- Production HTTP checks passed for anonymous and forged-cookie redirects, no
  dashboard content leak, no-store headers, password login and no signup route.
- The initial real-account browser check was pending at the Phase 2E checkpoint.
  During Phase 2F verification, the real allowlisted account successfully loaded
  the protected dashboard; Logout returned to login, and reopening `/admin` in
  that same browser redirected to login. The live check is now complete. The
  password was entered privately and was never accessed by the test tooling.
- Real anonymous public reads and production public markup still match Phase 2C.
- Lint, TypeScript and production build passed. Only the two existing public-page
  image lint warnings remain.

Repeat tests with `node --test tests/*.test.mjs`. With a production server running,
run `node scripts/verify-admin-access.mjs http://localhost:3107` and the existing
publication-render comparison. RLS testing instructions remain in `PHASE2C.md`.

Official Auth/session references checked for this implementation:
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/reference/javascript/auth-signout
- Installed Next.js 16.3.3 authentication, cookies, redirect and revalidatePath docs.

Publication CRUD and all other modules await separate approval.
