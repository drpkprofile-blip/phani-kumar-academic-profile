import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../supabase/migrations/20261006000100_publications_new_records_first.sql", import.meta.url), "utf8");

test("publication inserts transactionally take position one without changing existing relative order", () => {
  assert.match(migration, /public\.is_publications_admin\(\) is distinct from true/);
  assert.match(migration, /lock table public\.publications in exclusive mode/);
  assert.match(migration, /set constraints public\.publications_display_order_unique deferred/);
  assert.match(migration, /where year = p_publication->>'year'/);
  assert.match(migration, /update public\.publications set display_order = display_order \+ 1 where display_order >= position/);
  assert.match(migration, /impact_factor,display_order\)[\s\S]*?values\([\s\S]*?,position\)/);
  assert.match(migration, /set constraints public\.publications_display_order_unique immediate/);
  assert.match(migration, /grant execute on function public\.admin_save_publication\(integer,jsonb,timestamptz\) to authenticated/);
  assert.doesNotMatch(migration, /source_order\s*=|delete from public\.publications/i);
});
