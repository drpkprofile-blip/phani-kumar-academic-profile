# Phase 4C: exact Certifications migration

The sole migration source is the committed `data/certifications.ts`. The seed
does not enrich, infer, normalize, or correct any field. Array positions 1–13
determine IDs, `source_order`, and `display_order`; supplied certificate and FDP
URLs are preserved byte-for-byte, and only absent URLs become SQL `NULL`.

`scripts/certification-seed.mjs` generates
`migrations/20261005000200_seed_certifications.sql`. The transaction locks the
table, rejects unexpected or conflicting rows, inserts only missing IDs, checks
all 13 rows field by field, and advances (never rewinds) the identity sequence.
An exact rerun performs no row updates or deletes.

Commands:

```
node scripts/certification-seed.mjs --check
npx supabase db push --linked
node scripts/verify-certifications.mjs --capture-repeat-snapshot
npx supabase db query --linked --file supabase/migrations/20261005000200_seed_certifications.sql --output json
node scripts/verify-certifications.mjs --check-repeat-snapshot
node scripts/verify-certifications-baseline.mjs http://localhost:3107/
```

The verifier reads the database with the public Supabase key and compares every
field to the committed source. Its repeat snapshot, like CLI test aggregation,
is stored in ignored `supabase/.temp/` and includes timestamps to detect any
change on a second seed run.

Verification: 13 rows, IDs 1–13, source/display order 1–13, exact title and URL
matches, zero field mismatches; 9 certificate URLs and 6 FDP URLs, with the
other optional values `NULL`. The public NPTEL section still reads the static
file and matches its captured baseline. Phase 4D requires separate approval.
