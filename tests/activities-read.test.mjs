import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { root, readCommittedPublications } from "../scripts/publication-seed.mjs";
import { mapActivities, readCommittedActivities } from "../scripts/activity-seed.mjs";
import { loadModule, compareProfile } from "./helpers/render-profile.mjs";

const source = readCommittedActivities();
const rows = mapActivities(source.activities);
const categories = source.categories.map((label,i)=>({label,display_order:i+1}));
const section = html => html.match(/<section id="activities".*?<\/section>/s)[0];
function reader(records={data:rows,error:null}, labels={data:categories,error:null}) {
  const calls=[];
  const client={from(table) {calls.push(table);return {select(){const query={order(field,options){calls.push([table,field,options]);return query;},then(resolve,reject){return Promise.resolve(table==="activities"?records:labels).then(resolve,reject);}};return query;}};}};
  return {...loadModule("lib/activities.ts",{"./supabase/server":{createClient:async()=>client}}),calls};
}
async function configured(fn) {
  const names=["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const old=names.map(n=>process.env[n]);names.forEach(n=>process.env[n]="test-configured");
  try {await fn();} finally {names.forEach((n,i)=>{if(old[i]===undefined) delete process.env[n];else process.env[n]=old[i];});}
}
const render = async data => section((await compareProfile({publications:readCommittedPublications(),heroPublications:"40+"},data)).current);

test("Activities queries enforce year/position and category order; exact baseline render",async()=>{
  await configured(async()=>{
    const helper=reader();const data=await helper.getPublicActivities();
    assert.deepEqual(helper.calls,["activities",["activities","year",{ascending:false}],["activities","display_order",{ascending:true}],"activity_categories",["activity_categories","display_order",{ascending:true}]]);
    const html=await render(data);
    const baselineHtml=JSON.parse(readFileSync(`${root}/supabase/baselines/activities.json`,"utf8")).sectionHtml;
    const comparableHtml=html
      .replace(/<div class="activity-filter-note"[^>]*>/,"<div class=\"activity-filter-note\">")
      .replace(/<button[^>]*>(.*?)<\/button>/g,"<span>$1</span>")
      .replace('<div class="activity-years" aria-live="polite">','<div class="activity-years">');
    assert.equal(comparableHtml,baselineHtml);
    assert.equal((html.match(/class="activity-card"/g)||[]).length,46);
    assert.equal((html.match(/Proof link will be updated soon/g)||[]).length,45);
    assert.equal((html.match(/Certificate \/ Proof/g)||[]).length,1);
    for(const [field,count] of [["date",41],["duration",38],["details",11]]) assert.equal((html.match(new RegExp(`class="activity-${field}"`,"g"))||[]).length,count);
  });
});
test("Activities NULLs map to undefined while supplied strings and full proof URL survive",()=>{
  const {mapActivity}=reader();
  for(const [i,row] of rows.entries()) {
    const mapped=mapActivity(row),original=source.activities[i];
    for(const key of ["year","title","type","institution","date","duration","details","proofUrl"]) assert.equal(mapped[key],original[key]);
  }
});
test("Activities present categories follow database order; counts and numbering use returned rows",async()=>{
  await configured(async()=>{
    const data=await reader({data:[rows[0],rows[2]],error:null},{data:[categories[1],categories[0],categories[2]],error:null}).getPublicActivities();
    assert.deepEqual(data.activityTypes,["FDP","Conference"]);assert.deepEqual(data.activityYears,["2026"]);
    const html=await render(data);assert.ok(html.includes("<strong>2</strong>"));assert.ok(html.includes("2 activities"));
    assert.ok(html.includes('class="activity-index">01'));assert.ok(html.includes('class="activity-index">02'));
    const empty=await reader({data:[],error:null}).getPublicActivities();assert.deepEqual(empty,{activities:[],activityTypes:[],activityYears:[]});
  });
});
test("Configured Activities errors fail clearly instead of replacing live content with fallback",async()=>{
  await configured(async()=>{
    await assert.rejects(reader({data:null,error:{}}).getPublicActivities(),/Unable to read public Activities/);
    await assert.rejects(reader(undefined,{data:null,error:{}}).getPublicActivities(),/categories/);
    await assert.rejects(reader(undefined,{data:[],error:null}).getPublicActivities(),/category order/);
  });
});
test("Missing Activities configuration renders exact fallback with no client calls",async()=>{
  await configured(async()=>{
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;const helper=reader();
    const html=await render(await helper.getPublicActivities());assert.deepEqual(helper.calls,[]);
    const comparableHtml=html
      .replace(/<div class="activity-filter-note"[^>]*>/,"<div class=\"activity-filter-note\">")
      .replace(/<button[^>]*>(.*?)<\/button>/g,"<span>$1</span>")
      .replace('<div class="activity-years" aria-live="polite">','<div class="activity-years">');
    assert.equal(comparableHtml,JSON.parse(readFileSync(`${root}/supabase/baselines/activities.json`,"utf8")).sectionHtml);
  });
});
