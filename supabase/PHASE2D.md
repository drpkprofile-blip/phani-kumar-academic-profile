# Phase 2D public Publications reads

`lib/publications.ts` is a typed server-only data-access layer using the existing
Supabase SSR/server client and generated live public-schema types. It selects
publication rows strictly by ascending `display_order`, with no subsequent
year/ID sort. It separately reads the singleton `publication_settings` counter.
The page is now rendered on request because the server client reads cookies;
the production build does not require a database fetch.

The adapter preserves supplied fields and indexing order. SQL NULL optional
values become undefined, including impact factor; zero remains a supplied value.
`proof_url` maps to the existing `proof` property. The card markup remains intact,
including article URL precedence, DOI fallback, proof links and pending messages.
The section count uses the returned row count. The hero counter uses settings.

If either public configuration variable is missing, builds/tests use the retained
static reference with a server-side warning. Once configured, database errors
surface rather than silently displaying stale reference data. No secret key or
privileged credential is used. No client component or browser database query was
introduced, and no authentication/admin UI or write operation was added.

## Verification

- Real anonymous SSR reads: 37 cards, six impact factors and hero `40+`.
- Full React-rendered page HTML equals the Phase 2C committed static baseline.
- Actual Next production HTTP response's entire main element equals that baseline
  (ignoring only React's invisible hydration comments). This covers text, order,
  indexing/impact-factor badges, links, pending messages, counts and all sections.
- CSS, public assets, static data, navigation and Citations are unchanged.
- Regression tests additionally cover DOI-only links, article URL precedence,
  supplied proof URLs, NULL optional values, zero impact factor, configuration
  absence and configured database errors.
- All 20 live database authorization assertions and all 13 local tests passed.
- Lint, TypeScript and configured/unconfigured production builds passed. Lint has
  only the two existing `img` warnings in `app/page.tsx`.

Repeat local checks with `node --test tests/*.test.mjs`. For real reads and exact
render comparison, run `node scripts/verify-publications-render.mjs`. Optionally
pass the URL of a running production server as its argument to compare the HTTP
response too. Existing Phase 2C field verification and RLS commands remain valid.

The baseline comparison is pinned to Phase 2C commit
`112840e2d5aabbd516279533db6dde8ed08c1235`. The committed publication source is
retained unchanged as the migration/reference baseline. No other module switched
to Supabase, and admin implementation awaits separate approval.
