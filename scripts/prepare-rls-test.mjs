import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { root } from "./publication-seed.mjs";

// Collect every TAP assertion because CLI db query returns only the last result set.
// The original authorization tests and their rollback are preserved.
let sql = readFileSync(`${root}/supabase/tests/publications_rls.sql`, "utf8");
sql = sql.replace("select plan(20);", "create temporary table phase2c_tap (result text);\ngrant select, insert on table phase2c_tap to anon, authenticated;\ninsert into phase2c_tap select plan(20);");
sql = sql.replace(/^select (is\(|throws_ok\(|lives_ok\()/gm, (_, call) => `insert into phase2c_tap select ${call}`);
sql = sql.replace("select * from finish();", "reset role;\ninsert into phase2c_tap select * from finish();\nselect jsonb_agg(result order by ctid) as tap_results from phase2c_tap;");
mkdirSync(`${root}/supabase/.temp`, { recursive: true });
writeFileSync(`${root}/supabase/.temp/publications-rls-validation.sql`, sql);
console.log("Prepared ignored transactional RLS test output aggregation.");
