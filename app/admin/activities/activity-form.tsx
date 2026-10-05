"use client";
import { useActionState } from "react";
import { saveActivity } from "./actions";
import { activityFields, type ActivityValues, type ActivityFormState } from "../../../lib/admin/activity-form";
import styles from "../admin.module.css";

const labels:ActivityValues={year:"Year",title:"Title",activity_type:"Activity Type",institution:"Institution / Organizer",date_text:"Date text",duration_text:"Duration text",details:"Details",proof_url:"Proof / Certificate URL"};
export default function ActivityForm({id,updatedAt,initial,categories}:{id?:number;updatedAt?:string;initial?:Partial<ActivityValues>;categories:string[]}) {
  const [state,action,pending]=useActionState<ActivityFormState,FormData>(saveActivity,{});
  return <form action={action} className={styles.form}>
    <input type="hidden" name="id" value={id??""}/><input type="hidden" name="updated_at" value={updatedAt??""}/>
    {state.message&&<p role="alert" className={styles.error}>{state.message}</p>}
    {activityFields.map(name=>{
      const required=["year","title","activity_type","institution"].includes(name);
      const error=state.errors?.[name];
      const props={id:name,name,required,defaultValue:state.values?.[name]??initial?.[name]??"","aria-invalid":!!error,"aria-describedby":error?`${name}-error`:undefined};
      return <label key={name} className={styles.field} htmlFor={name}>{labels[name]} ({required?"required":"optional"})
        {name==="activity_type"?<select {...props}><option value="">Choose category</option>{categories.map(label=><option key={label} value={label}>{label}</option>)}</select>
          :["title","institution","details"].includes(name)?<textarea {...props} rows={3}/>
          :name==="year"?<input {...props} pattern="[0-9]{4}" maxLength={4} inputMode="numeric"/>
          :<input {...props} type={name==="proof_url"?"url":"text"}/>}
        {error&&<span id={`${name}-error`} className={styles.error}>{error}</span>}
      </label>;
    })}
    <p className={styles.note}>Leave missing information blank. Dates and durations are kept as entered. New activities and year changes append to the selected year.</p>
    <div className={styles.controls}><button className={styles.button} disabled={pending}>{pending?"Saving…":id?"Save activity":"Add activity"}</button><a className={styles.secondary} href="/admin/activities">Cancel</a></div>
  </form>;
}
