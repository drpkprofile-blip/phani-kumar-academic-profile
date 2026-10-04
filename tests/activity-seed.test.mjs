import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { root } from "../scripts/publication-seed.mjs";
import {readCommittedActivities,mapActivities,buildActivityMigration,migrationPath} from "../scripts/activity-seed.mjs";

test("Activities seed retains exact supplied values, missing states and within-year positions",()=>{
  const source=readCommittedActivities();const rows=mapActivities(source.activities);
  for(const [i,row] of rows.entries()) {
    const a=source.activities[i];
    assert.deepEqual([row.id,row.source_order,row.year,row.title,row.activity_type,row.institution,row.date_text,row.duration_text,row.details,row.proof_url],
      [i+1,i+1,a.year,a.title,a.type,a.institution,a.date??null,a.duration??null,a.details??null,a.proofUrl??null]);
    assert.equal(row.display_order,source.activities.slice(0,i+1).filter(x=>x.year===a.year).length);
  }
  assert.equal(rows.filter(a=>a.proof_url!==null).length,1);
  assert.ok(rows.find(a=>a.proof_url)?.proof_url.endsWith("?usp=drive_link"));
  assert.throws(()=>mapActivities(source.activities.slice(1)));
});
test("Generated Activities migration is reproducible and guards conflicting rows",()=>{
  const source=readCommittedActivities();const sql=buildActivityMigration(mapActivities(source.activities),source.categories);
  assert.equal(readFileSync(`${root}/${migrationPath}`,"utf8").replaceAll("\r\n","\n"),sql);
  assert.ok(sql.includes("is distinct from to_jsonb(e)"));
  assert.ok(!/update public\.activities|delete from public\.activities/i.test(sql));
  assert.ok(sql.includes("where not exists"));
});
