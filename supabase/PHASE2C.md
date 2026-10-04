# Phase 2C publication migration

Applied to the existing linked `phani-kumar-portfolio` project on 4 October 2026.
The sole source is committed `data/publications.ts`; no metadata was enriched.
The website continues to render its unchanged static data.

## Repeatable process

1. `node scripts/publication-seed.mjs --check` verifies the generated SQL against
   the committed source. Without `--check`, it regenerates the seed SQL. It also
   rejects an uncommitted change to the static publication file.
2. `npx.cmd --yes supabase@latest db push --linked --yes` applies the versioned
   `20261004000200_seed_publications.sql` migration through the authenticated CLI.
3. `node scripts/verify-publications.mjs` reads through the anonymous Data API
   using only the public URL and publishable key in ignored `.env.local`.

The seed locks the publication table, checks existing rows against the expected
dataset, inserts only missing IDs, then verifies every field inside the same
transaction. Extra records or conflicting values abort without overwriting or
deleting data. Repeating it on this dataset performs no row updates and preserves
timestamps. It advances the identity sequence past existing IDs without rewinding
it. After future admin edits, do not rerun this initial snapshot as an update tool.

`source_order` is the one-based static array position. `display_order` is the
one-based position after the website's existing year-descending, ID-ascending
sort. Missing optional values become NULL; empty indexing arrays stay arrays.
The seed requires the existing independent `40+` setting and does not update it.

## Verification results

- Exactly 37 rows, unique original IDs, and no missing/extra records.
- All 12 mapped fields on every row match the static source exactly, including
  title, year, journal/details, ordered indexing arrays, DOI, article URL,
  publication type, impact factor, proof URL, and both ordering fields.
- All 37 proof URLs are NULL. Six supplied impact factors remain unchanged;
  the other 31 are NULL. Hero counter remains `40+`.
- Re-executed the migration SQL successfully to verify repeatability.
- All 20 existing live pgTAP authorization assertions passed after import;
  synthetic fixture writes were rolled back. A subsequent anonymous verification
  confirmed all real records and the counter still match.
- All eight local tests, lint, TypeScript, and production build passed. Lint
  retains only the two existing `img` warnings in the unchanged page.

## Authorization test output

`node scripts/prepare-rls-test.mjs` prepares an ignored SQL aggregation file at
`supabase/.temp/publications-rls-validation.sql`. Execute it with:

```powershell
$result = & npx.cmd --yes supabase@latest db query --linked --file supabase/.temp/publications-rls-validation.sql --output json
if ($LASTEXITCODE -ne 0) { throw 'RLS execution failed' }
$tap = ($result | ConvertFrom-Json).rows[0].tap_results
$tap
if (@($tap | Where-Object { $_ -match '^ok [0-9]+ -' }).Count -ne 20 -or
    @($tap | Where-Object { $_ -match '^not ok|^#' }).Count -gt 0) {
  throw 'RLS assertions failed'
}
```

The original required `supabase/tests/publications_rls.sql` is retained unchanged.
The aggregation file is temporary and excluded from Git. No credentials are
included in generated SQL, source files, or this report. No admin UI, public
database adapter, new publication, or Google Scholar import was added.
