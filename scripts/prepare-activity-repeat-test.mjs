import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { root } from "./publication-seed.mjs";
import { migrationPath } from "./activity-seed.mjs";

// Reapply the exact generated seed, checking complete rows including timestamps.
const tables = ["activities", "activity_categories", "publications", "publication_settings"];
let sql = readFileSync(`${root}/${migrationPath}`, "utf8");
sql = sql.replace("begin;", `begin;\n${tables.map(t=>`create temporary table repeat_${t} as select * from public.${t};`).join("\n")}`);
sql = sql.replace("commit;", () => `do $$ begin\n${tables.map(t=>`if exists ((select to_jsonb(x) from public.${t} x except select to_jsonb(x) from repeat_${t} x) union all (select to_jsonb(x) from repeat_${t} x except select to_jsonb(x) from public.${t} x)) then raise exception 'Repeat changed ${t}'; end if;`).join("\n")}\nend; $$;\nselect 'PASS: repeat preserved all activity/category/publication/settings rows including timestamps' as result;\ncommit;`);
mkdirSync(`${root}/supabase/.temp`, {recursive:true});
writeFileSync(`${root}/supabase/.temp/activities-repeat-validation.sql`, sql);
console.log("Prepared ignored repeat-seed verification SQL.");
