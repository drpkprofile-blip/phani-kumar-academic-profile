# Publications foundation — Phase 2A

The public Publications section and its independent hero counter now read
Supabase server-side. Other sections still read committed `data/` files.
Phase 2E adds `/admin/login`; Phase 2F replaces the allowlist-protected `/admin`
placeholder with Publications management. No other admin module or Google Scholar
scraping exists. See `PHASE2E.md` and `PHASE2F.md`.
Phase 2C imported only the existing 37 committed publication records.

## Integration

Next.js 16.3.3 uses `proxy.ts`, asynchronous `cookies()`, and cookie-based
`@supabase/ssr` browser/server clients. Session refresh is restricted to future
`/admin` and `/auth` routes. Every future protected mutation must call
`requirePublicationsAdmin()`; the proxy alone is not authorization.

The configuration template is `.env.example`. The connected project's public URL
and `sb_publishable_...` key belong in ignored `.env.local`. No privileged key is
needed by these public reads. When configuration is absent, the Publications read
layer uses the committed reference data so builds/tests remain usable. Configured
reads never silently fall back on database errors. See `PHASE2D.md`.

Official references checked before implementation:
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Database

The migration creates empty `publications`, singleton `publication_settings`,
and protected `private.publications_admins` tables. It was applied to the linked
`phani-kumar-portfolio` project in Phase 2B. The migration contains no publication
seed, counter seed, or admin UUID. Phase 2B separately initialized the independent
setting to `40+`. Phase 2C seeded the 37 publications; persistent admin membership
remains empty. See `PHASE2B.md` and `PHASE2C.md` for validation results.

Only a trusted database operator may provision or revoke admin membership by
writing the verified Auth user UUID into `private.publications_admins`. There is
no self-registration, email-derived role, user-metadata role, or public membership
management function. Membership must never be exposed as an admin-editable table.

Public readers have SELECT only. Authenticated non-admin users can read but RLS
rejects inserts and filters out rows for update/delete. Admins can mutate both
public tables. Reordering is an admin UPDATE, with a deferrable unique ordering
constraint for atomic swaps. Phase 2F exposes three SECURITY INVOKER management
RPCs for save, confirmed delete and transactional reorder. They independently
check the private admin allowlist and retain existing RLS enforcement.

`source_order` is nullable for future manually added records. `display_order` is
required, positive, and unique. Missing optional metadata is SQL NULL. A future
adapter must translate NULL impact factors to undefined for the existing UI.
The independent hero counter is text and remains `40+` without
deriving it from the publication count. Original journal/details text remains
verbatim. Google Scholar is the completeness reference; imports remain manual.

The RLS regression SQL in `tests/` has passed against the connected database.
Phase 2D regenerated database types from the actual public schema and verified
anonymous reads and unchanged rendering against all 37 committed records.
Phase 2C verifies the database dataset against every field of the committed source.

Local helper tests: `node --test tests/supabase-foundation.test.mjs`.
Database tests: `supabase test db` in a disposable Supabase test project after
applying the migration. These use clearly marked synthetic fixtures and roll
back all writes; they do not import or modify the 37 real records.
