# Phase 3B: Activities backend foundation

Migration: `migrations/20261004000400_activities_foundation.sql`.
Applied to the existing linked project. Activities remains empty; the 46 static
records are not migrated and public rendering still reads `data/activities.ts`.

`activities` has identity ID, required text year/title/activity_type/institution,
nullable date_text/duration_text/details/proof_url/source_order, required positive
display_order and database-managed timestamps. Dates and durations remain text.
The deferrable `(year, display_order)` unique constraint supports atomic swaps
within a year. Future public queries must order year descending, position ascending.

`activity_categories` stores exact labels as primary keys, positive unique
deferrable positions and timestamps. Its 11 initial labels retain source order.
Activities references labels via a restrictive foreign key. Admins may add future
categories without altering the schema; referenced labels cannot be deleted or
renamed accidentally. No category CRUD interface is included in this phase.

Both tables enable RLS, revoke default privileges and grant public SELECT only.
Authenticated writes require the existing `public.is_publications_admin()` check,
backed by `private.publications_admins`. No membership grants/policies change.
Both tables reuse the existing timestamp trigger function. No privileged browser
credentials, authentication changes, management RPCs or UI changes are added.

## Baseline and verification

`baselines/activities.json` captures all source records, exact category/year order,
normalized committed-source SHA-256 and exact rendered Activities section.
Run `node scripts/verify-activities-baseline.mjs http://localhost:3107/` to compare
committed data, renderer output and production HTTP output. `--capture` is only
for deliberate initial baseline capture; do not overwrite during migration.

`tests/activities_rls.sql` contains 32 pgTAP assertions with synthetic negative
IDs/users; all fixture writes roll back. It checks public reads, unauthorized
writes, admin writes, category expansion/protection, free text, NULLs, membership
protection, per-year uniqueness and deferred swaps. Run with `supabase test db`
on a disposable test database, or prepare ignored CLI aggregation with:

```
node scripts/prepare-rls-test.mjs --activities
npx supabase db query --linked --file supabase/.temp/activities-rls-validation.sql --output json
```

Validation passed: Activities 32, existing Publications authorization 20,
Publications management 31, local tests 33, TypeScript, lint (only two existing
image warnings) and production build. Anonymous API reads confirm zero activities,
11 categories, 38 existing publications and independent hero counter `40+`.
Phase 3C remains pending separate approval.
