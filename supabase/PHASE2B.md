# Phase 2B backend validation

Project: `phani-kumar-portfolio` (`ngexzjhsacwugpmvmxrg`), Mumbai (`ap-south-1`).
Verified on 4 October 2026 using the authenticated official Supabase CLI.

- Linked this local folder using `supabase link`.
- Applied `20261004000100_publications_foundation.sql` using `supabase db push`.
- Confirmed the migration is recorded in `supabase_migrations.schema_migrations`.
- Confirmed all three tables exist and have RLS enabled.
- Confirmed eight public-table policies and restricted private membership access.
- Ran all 20 prepared pgTAP authorization assertions against the remote database;
  all passed. Aggregated TAP output was used because `db query` otherwise shows
  only the last result set. Synthetic test writes were rolled back.
- Initialized only the independent `hero_publications` setting to `40+`.
- Verified actual anonymous Data API reads: zero publications and counter `40+`.
- Persistent admin membership remains empty. No real account was promoted.

Ignored `.env.local` contains only the public project URL and publishable key.
CLI-managed credentials and temporary connection metadata are excluded from Git;
no privileged credential is stored in application configuration.

No publication import, Google Scholar scraping, admin UI, or public Supabase
data reads were added. Existing application files, data, and public assets are
unchanged from the Phase 1 checkpoint.

The RLS suite can run transactionally on this backend; its settings fixture uses
an upsert and rollback restores the previous counter value. It uses reserved
synthetic identities and negative publication IDs, and should always be run in
an otherwise suitable test context.
