# Phase 2F Publications management

## Routes and UI

- `/admin`: protected Publications list ordered strictly by `display_order`,
  with title, year, ordered indexing badges, conditional impact factor, expanded
  details, Edit/Delete links, Up/Down buttons and a requested-position control.
  It includes an independent hero-counter form, Add publication, Google Scholar
  manual-reference link, public website link and Logout.
- `/admin/publications/new`: blank form for manual entry only.
- `/admin/publications/[id]/edit`: existing fields loaded from Supabase, with a
  timestamp guard against overwriting an intervening update.
- `/admin/publications/[id]/delete`: identifies the exact record and requires an
  explicit confirmation checkbox before deletion. The server and database both
  enforce confirmation; stale deletes are rejected.

All pages and every mutation separately check the existing verified Auth user
and private admin allowlist on the server. No signup, privileged browser key,
admin membership management or other profile module was added. Admin CSS remains
scoped; the public page, CSS, assets, Citations and static data files are unchanged.

## Fields and validation

Title, four-digit year and journal/details are required. Indexing uses one badge
per line and preserves supplied badge text and order. Missing optional DOI,
article/proof URLs, publication type and impact factor become SQL NULL. Empty
indexing stays an empty array. Supplied URLs must use HTTP/HTTPS without embedded
credentials. Impact factor must be finite and non-negative; zero is retained.
No missing metadata is invented, enriched or imported from Scholar. All 37 static
records round-trip through form parsing without any change to their metadata.

Validation errors retain entered values and identify fields. Mutations provide
success/error feedback. Successful actions invalidate the public page and admin
navigation cache; public counts and cards then read updated Supabase data. Hero
counter remains independent and can contain intentional text such as `40+`.

## Database changes

Migration `20261004000300_publications_management.sql` adds:

- `admin_save_publication`: append a new record with an automatically assigned ID
  and `max(display_order) + 1`, or update the chosen record at its existing order
  when its expected timestamp matches. Original `source_order` is preserved;
  manually added records have NULL `source_order`.
- `admin_delete_publication`: explicitly confirmed, timestamp-guarded deletion.
- `admin_move_publication`: verifies the complete current order snapshot, moves
  the selected record to a requested position, and writes valid unique positions
  atomically using the existing deferrable constraint.

All three functions are SECURITY INVOKER with empty search paths, explicit admin
checks and execution revoked from PUBLIC/anon. Authenticated users may invoke
them but non-admins are rejected. Existing table RLS policies remain in force.
Ordering mutations serialize with an exclusive table lock; normal public reads
continue. Hero counter updates also use an optimistic old-value check. No table,
policy or membership structure was weakened. Generated types match the live schema.

## Verification results

- Existing 20 database authorization tests passed.
- New 31 transactional database assertions passed: admin CRUD, automatic order,
  all optional NULLs, badge order, zero impact factor, row count, transactional
  reorder, unique positions, stale requests, confirmation, independent counter,
  anonymous/non-admin denial and revocation. Synthetic writes were rolled back.
- All 33 local tests passed, including all original Auth/publication tests.
- Lint, TypeScript and production build passed. Only two existing public-page
  image lint warnings remain.
- Live authenticated browser showed all 37 existing records and all management
  controls. Created two clearly labelled temporary fixtures, edited only a fixture,
  reordered only the two appended fixtures, saved the independent `40+` counter,
  and verified the Delete confirmation page.
- Live public HTTP output reflected 39 cards/count during the fixture test while
  retaining independent `40+`, six impact-factor badges and 39 missing-proof
  messages. Confirmed deletion RPC removed only the two exact fixture IDs/titles.
- Snapshot comparison after cleanup proved every original row, field, position
  and timestamp remained unchanged. Final count is 37; counter remains `40+`.
- Final anonymous Data API field verification and the full production public
  main-element comparison against Phase 2C passed.
- Final live Logout cleared protected access; reopening `/admin` in the same
  browser redirected to login. This also closes the previously pending Phase 2E
  real-account browser check.

## Repeat checks

Files created or changed in this phase:

```text
app/admin/page.tsx
app/admin/admin.module.css
app/admin/publications/actions.ts
app/admin/publications/publication-form.tsx
app/admin/publications/new/page.tsx
app/admin/publications/[id]/edit/page.tsx
app/admin/publications/[id]/delete/page.tsx
lib/admin/publication-form.ts
lib/supabase/database.types.ts
scripts/prepare-rls-test.mjs
scripts/verify-publications-unchanged.mjs
supabase/migrations/20261004000300_publications_management.sql
supabase/tests/publications_management.sql
supabase/README.md
supabase/PHASE2E.md
supabase/PHASE2F.md
tests/admin-auth.test.mjs
tests/publications-management.test.mjs
```

Local: `node --test tests/*.test.mjs`, `npm.cmd run lint`,
`npx.cmd tsc --noEmit`, `npm.cmd run build`.

Prepare original RLS aggregation with `node scripts/prepare-rls-test.mjs` or the
new suite with `node scripts/prepare-rls-test.mjs --management`. Execute the ignored
SQL via the authenticated CLI's `db query --linked --file ... --output json`,
check every TAP assertion and expected totals (20 or 31), and reject `not ok` or
diagnostic lines. Both SQL suites roll back all fixtures.

For verifying the original 37-record baseline across live temporary tests,
`node scripts/verify-publications-unchanged.mjs --snapshot` captures only public
data in ignored `.temp`; rerun without that flag after cleanup to compare every
row including timestamps and the counter value. Existing Phase 2C/2D data and
render-verification commands also remain available. Temporary snapshots/SQL are
removed before committing; CLI link metadata remains ignored.

Official function-security reference checked:
https://supabase.com/docs/guides/database/functions
Installed Next.js 16.3.3 forms and Server Actions guidance was followed.

No credentials, real publication changes, Google Scholar import or other admin
module are included. Further modules await explicit approval.
