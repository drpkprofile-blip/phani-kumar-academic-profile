# Phase 3D: public Activities reads

`lib/activities.ts` uses the existing server-only Supabase SSR client. It reads
Activities by year descending and display_order ascending, and category labels
by their database display_order. Only categories present in returned activities
are displayed. Years, total count and per-year counts derive from returned rows.
The adapter preserves the AcademicActivity field names and converts optional SQL
NULL values to undefined. Category labels are authoritative database text backed
by the category foreign key, including future categories.

`app/page.tsx` changes only the Activities import/read and total-count expression.
Card markup, CSS, category strip, year grouping, numbering, proof labels and all
unrelated modules are unchanged. `data/activities.ts` remains the exact committed
reference. Missing URL/key configuration renders that reference without creating
a client. Configured query/category failures surface an error instead of silently
substituting stale reference data. No credential or admin-auth changes are made.

## Validation

- 40 local tests passed, including five Activities read/render tests.
- Live database assertions: Activities 32, Publications authorization 20,
  Publications management 31; all fixtures rolled back.
- `node scripts/verify-activities-render.mjs http://localhost:3111/` exercises
  anonymous real SSR reads and compares the entire production Activities section
  against the immutable Phase 3B/3C snapshot.
- 46 exact cards; category order, all year groups and numbering preserved.
  Missing dates 5, durations 8, details 35; one exact proof link and 45 placeholders.
- Lint: zero errors and the two pre-existing image warnings. TypeScript passed.
- Configured production build passed; production HTML matched the baseline.
- Unconfigured production build passed with both public Supabase environment
  values overridden to empty strings in the child process only. Its production
  server on port 3110 matched the same Activities baseline. `.env.local` was not
  edited or renamed. The final build is configured.

The shared render-test helper supplies static Activities only when unrelated tests
do not provide an Activities mock. Activities tests and the live verifier explicitly
inject the new reader's result; they do not bypass the read layer being verified.

No Activities admin CRUD is included. Phase 3E requires separate approval.
