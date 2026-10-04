# Phase 3C: exact Activities migration

Source: committed `data/activities.ts` only. No metadata correction, enrichment,
normalization, inferred dates or unrelated module changes.

`scripts/activity-seed.mjs` creates
`migrations/20261004000500_seed_activities.sql`. IDs and source_order are original
array positions 1–46; display_order is the one-based position within each year.
Only undefined/null optional fields become SQL NULL; supplied text is unchanged.
The exact proof URL retains its `?usp=drive_link` query string.

The seed locks Activities for writes, holds a shared category lock, verifies exact
category labels/order and refuses any conflicting or extra existing activity row.
It inserts only missing IDs, verifies every final field and advances the sequence
without rewinding it. Exact reruns never update/delete existing rows or timestamps.

Commands:

```
node scripts/activity-seed.mjs --check
node scripts/verify-activities.mjs
node scripts/prepare-activity-repeat-test.mjs
npx supabase db query --linked --file supabase/.temp/activities-repeat-validation.sql --output json
node scripts/verify-activities-baseline.mjs http://localhost:3107/
```

The repeat test uses the generated migration, captures complete database rows and
checks Activities, categories, Publications and publication settings including
timestamps remain identical after reapplication. Its SQL is ignored under `.temp`.
Use this strict initial-dataset seed/verification only while the database retains
the initial 46 records; future admin edits must not be overwritten by reseeding.

## Results

- 46 rows, IDs 1–46; all 11 mapped fields per row match exactly; zero mismatches.
- NULL counts: date 5, duration 8, details 35, proof 45. Exactly one proof supplied.
- Category counts in approved order: Conference 6; FDP 13; Organizing 1;
  Guest Lecture 2; Training 10; Workshop 5; STTP 3; Webinar 3; Quiz 1;
  Resource Person 1; Seminar 1.
- Exact year grouping, within-year ordering and unique positive year/position pairs.
- Repeat-seed test passed, preserving complete rows and timestamps.
- Activities database tests 32; Publications database tests 20 + 31; local tests 35.
- Lint: no errors, only two existing image warnings. TypeScript and build passed.
- Static source and exact production Activities section still match Phase 3B.

Public Activities still reads static data. No Activities CRUD or public Supabase
read path was added. Publications remains 38 records with independent hero `40+`.
Phase 3D requires separate approval.
