import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import nextEnv from "@next/env";
import { createServerClient } from "@supabase/ssr";
import { root, readCommittedPublications } from "./publication-seed.mjs";
import { loadModule, compareProfile } from "../tests/helpers/render-profile.mjs";

nextEnv.loadEnvConfig(root);
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(key?.startsWith("sb_publishable_"));
const client=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,key,{cookies:{getAll:()=>[],setAll:()=>{}}});
const {getPublicActivities}=loadModule("lib/activities.ts",{"./supabase/server":{createClient:async()=>client}});
const data=await getPublicActivities();
const baseline=JSON.parse(readFileSync(`${root}/supabase/baselines/activities.json`,"utf8"));
assert.equal(data.activities.length,46);assert.deepEqual(data.activityTypes,baseline.categories);assert.deepEqual(data.activityYears,baseline.years);
for(const [i,a] of data.activities.entries()) for(const key of ["year","title","type","institution","date","duration","details","proofUrl"]) assert.equal(a[key],baseline.activities[i][key]);
const section=html=>html.match(/<section id="activities".*?<\/section>/s)?.[0].replace(/<!--.*?-->/gs,"");
const html=await compareProfile({publications:readCommittedPublications(),heroPublications:"40+"},data);
assert.equal(section(html.current),baseline.sectionHtml);
if(process.argv[2]) {const response=await fetch(process.argv[2]);assert.equal(response.status,200);assert.equal(section(await response.text()),baseline.sectionHtml);}
console.log("Anonymous SSR Activities render passed: all 46 cards, exact fields/order/categories/year groups/numbering, 1 proof and 45 missing-proof messages equal Phase 3C baseline.");
