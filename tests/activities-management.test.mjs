import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/render-profile.mjs";
import { mapActivities,readCommittedActivities } from "../scripts/activity-seed.mjs";
const source=readCommittedActivities();
const {parseActivityForm}=loadModule("lib/admin/activity-form.ts");
function form(extra={}) {const f=new FormData();for(const [k,v] of Object.entries({id:"",updated_at:"",year:"2098",title:"TEMP TEST",activity_type:"FDP",institution:"Test only",...extra}))f.set(k,v);return f;}
function actions({denied=false,error=null}={}) {
  const calls=[],invalidated=[];
  const redirect=path=>{throw Object.assign(new Error("Redirect"),{path});};
  const supabase={from:()=>({select:()=>({order:async()=>({data:source.categories.map(label=>({label})),error:null})})}),rpc:async(name,args)=>{calls.push({name,args});return {data:123,error};}};
  return {calls,invalidated,...loadModule("app/admin/activities/actions.ts",{
    "../../../lib/auth/admin-page":{requireAdminPage:async()=>{if(denied)redirect("/admin/login");return {supabase};}},
    "next/navigation":{redirect},"next/cache":{revalidatePath:(...args)=>invalidated.push(args)},
  })};
}
const redirected=(fn,path)=>assert.rejects(fn,e=>e.path===path);
test("Activity forms preserve every original field and exact proof query string",()=>{
  for(const row of mapActivities(source.activities)) {
    const {id,source_order,display_order,...expected}=row;void id;void source_order;void display_order;
    const parsed=parseActivityForm(form(Object.fromEntries(Object.entries(expected).map(([k,v])=>[k,v??""]))),source.categories);
    assert.deepEqual(parsed.errors,{});assert.deepEqual(parsed.data,expected);
  }
});
test("Activity validation preserves free text, makes empty optionals NULL, rejects unsafe URL and unlisted category",()=>{
  const parsed=parseActivityForm(form({date_text:"  ",duration_text:"Two-week Value-Added Course",details:" Exact words ",institution:" Exact host "}),source.categories);
  assert.equal(parsed.data.date_text,null);assert.equal(parsed.data.proof_url,null);assert.equal(parsed.data.details," Exact words ");assert.equal(parsed.data.institution," Exact host ");
  const invalid=parseActivityForm(form({year:"26",title:" ",institution:"",activity_type:"Invented",proof_url:"javascript:alert(1)"}),source.categories);
  assert.equal(Object.keys(invalid.errors).length,5);
});
test("All Activities mutations authorize before access",async()=>{
  for(const method of ["saveActivity","deleteActivity","moveActivity"]) {
    const a=actions({denied:true});await redirected(()=>method==="saveActivity"?a[method]({},form()):a[method](form()),"/admin/login");assert.deepEqual(a.calls,[]);
  }
});
test("Admin Activity add ignores forged positions and revalidates public data",async()=>{
  const a=actions();await redirected(()=>a.saveActivity({},form({display_order:"999",source_order:"999"})),"/admin/activities?success=added");
  assert.equal(a.calls[0].name,"admin_save_activity");assert.ok(!("display_order" in a.calls[0].args.p_activity));assert.ok(!("p_id" in a.calls[0].args));assert.deepEqual(a.invalidated,[["/"],["/admin","layout"]]);
});
test("Admin Activity edit passes year and optimistic timestamp and retains errors",async()=>{
  const a=actions();await redirected(()=>a.saveActivity({},form({id:"47",updated_at:"2026-10-04T00:00:00Z",year:"2099"})),"/admin/activities?success=saved");
  assert.equal(a.calls[0].args.p_activity.year,"2099");assert.equal(a.calls[0].args.p_id,47);assert.equal(a.calls[0].args.p_expected_updated_at,"2026-10-04T00:00:00Z");
  const failed=await actions({error:{code:"P0001"}}).saveActivity({},form());assert.match(failed.message,/Reload/);assert.equal(failed.values.title,"TEMP TEST");
});
test("Activity delete requires explicit confirmation",async()=>{
  const a=actions();const f={id:"47",updated_at:"2026-10-04T00:00:00Z"};
  await redirected(()=>a.deleteActivity(form(f)),"/admin/activities?error=confirmation");assert.equal(a.calls.length,0);
  await redirected(()=>a.deleteActivity(form({...f,confirmed:"yes"})),"/admin/activities?success=deleted");assert.equal(a.calls[0].args.p_confirmed,true);
});
test("Activity reorder sends same-year snapshot and rejects malformed positions",async()=>{
  const a=actions();await redirected(()=>a.moveActivity(form({id:"48",year:"2098",order:"[47,48]",direction:"up"})),"/admin/activities?success=reordered");
  assert.deepEqual(a.calls[0],{name:"admin_move_activity",args:{p_id:48,p_year:"2098",p_position:1,p_expected_order:[47,48]}});
  const invalid=actions();await redirected(()=>invalid.moveActivity(form({id:"48",order:"[48,48]",position:"1"})),"/admin/activities?error=stale");assert.equal(invalid.calls.length,0);
});
