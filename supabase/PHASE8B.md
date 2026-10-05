# Phase 8B: Achievements / Awards foundation

Migration: `migrations/20261005000400_achievements_foundation.sql`.
Applied to the linked portfolio project. It creates `public.achievements` with
zero rows; the four records remain in `data/achievements.ts` and the public page
continues to render that static source.

The table stores required nonblank title and required description, nullable
`proof_url`, `extra_proof_url`, and `source_order`, positive required
`display_order`, and database-managed timestamps. The unique display-order
constraint is deferrable for transactional reordering. The timestamp trigger
reuses the existing `private.set_record_timestamps()` function.

RLS allows anonymous and authenticated reads. Authenticated writes require
`public.is_publications_admin()` through the existing allowlist. No admin
membership changes, management RPCs, UI, or privileged browser credentials are
introduced.

`baselines/achievements.json` captures the exact committed source and rendered
Achievements section. Verify it with:

```
node scripts/verify-achievements-baseline.mjs
```

`tests/achievements_rls.sql` has 21 pgTAP assertions using synthetic negative
IDs and users. The test wrapper aggregates every assertion for the linked
database query; all fixture writes run in a transaction and roll back:

```
node scripts/prepare-rls-test.mjs --achievements
npx supabase db query --linked --file supabase/.temp/achievements-rls-validation.sql --output json
```

No achievement records are migrated in Phase 8B. Phase 8C requires separate
approval.
