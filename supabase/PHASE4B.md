# Phase 4B: Certifications backend foundation

Migration: `migrations/20261005000100_certifications_foundation.sql`.
Applied to the linked portfolio project. It creates an empty
`public.certifications` table; the 13 NPTEL records remain in
`data/certifications.ts` and are not seeded or read from Supabase.

The table stores title, optional certificate/FDP URLs, nullable source order,
positive unique display order, and database timestamps. The display-order
constraint is deferrable to permit transactional position swaps. Timestamps
reuse the existing `private.set_record_timestamps()` trigger function.

RLS permits anonymous and authenticated reads. Authenticated mutations are
granted only through policies that check the existing
`public.is_publications_admin()` allowlist. Admin membership behavior and
privileged credentials are unchanged. No management RPC or user-facing admin
controls are added in this phase.

`baselines/certifications.json` records the exact committed certification source
and rendered public section. Verify it with:

```
node scripts/verify-certifications-baseline.mjs http://localhost:3107/
```

The 18 pgTAP assertions in `tests/certifications_rls.sql` use only synthetic
negative IDs/users and roll back all fixture writes. To aggregate results from a
linked database query:

```
node scripts/prepare-rls-test.mjs --certifications
npx supabase db query --linked --file supabase/.temp/certifications-rls-validation.sql --output json
```

No certification rows were migrated; the live table contains zero rows. Phase
4C remains pending separate approval.
