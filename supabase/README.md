# Publications foundation — Phase 2A

The public website still reads the committed `data/` files. No login pages,
admin UI, public database reads, record import, or Google Scholar scraping exist.

## Integration

Next.js 16.3.3 uses `proxy.ts`, asynchronous `cookies()`, and cookie-based
`@supabase/ssr` browser/server clients. Session refresh is restricted to future
`/admin` and `/auth` routes. Every future protected mutation must call
`requirePublicationsAdmin()`; the proxy alone is not authorization.

The configuration template is `.env.example`. The connected project's public URL
and `sb_publishable_...` key belong in ignored `.env.local`. No privileged key is
needed by this foundation. Client configuration is evaluated only when called,
so the existing website builds without any Supabase environment values.

Official references checked before implementation:
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Database

The migration creates empty `publications`, singleton `publication_settings`,
and protected `private.publications_admins` tables. It was applied to the linked
`phani-kumar-portfolio` project in Phase 2B. The migration contains no publication
seed, counter seed, or admin UUID. Phase 2B separately initialized the independent
setting to `40+`; publications and persistent admin membership remain empty.
See `PHASE2B.md` for validation results. Publication migration is a later phase.

Only a trusted database operator may provision or revoke admin membership by
writing the verified Auth user UUID into `private.publications_admins`. There is
no self-registration, email-derived role, user-metadata role, or public membership
management function. Membership must never be exposed as an admin-editable table.

Public readers have SELECT only. Authenticated non-admin users can read but RLS
rejects inserts and filters out rows for update/delete. Admins can mutate both
public tables. Reordering is an admin UPDATE, with a deferrable unique ordering
constraint for future atomic swaps. A transactional reorder action/RPC belongs
to the later admin implementation; none is exposed yet.

`source_order` is nullable for future manually added records. `display_order` is
required, positive, and unique. Missing optional metadata is SQL NULL. A future
adapter must translate NULL impact factors to undefined for the existing UI.
The independent hero counter is text and must later be seeded as `40+` without
deriving it from the publication count. Original journal/details text remains
verbatim. Google Scholar is the completeness reference; imports remain manual.

The RLS regression SQL in `tests/` has passed against the connected database.
Before enabling database-backed public reads/writes, regenerate the handwritten
database types from the actual schema and verify the later imported 37-record
dataset and unchanged public rendering separately.

Local helper tests: `node --test tests/supabase-foundation.test.mjs`.
Database tests: `supabase test db` in a disposable Supabase test project after
applying the migration. These use clearly marked synthetic fixtures and roll
back all writes; they do not import or modify the 37 real records.
