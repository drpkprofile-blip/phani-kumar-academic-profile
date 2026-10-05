import { requireAdminPage } from "../../../lib/auth/admin-page";
import { logout } from "../actions";
import { moveActivity } from "./actions";
import styles from "../admin.module.css";
import Link from "next/link";
const successes:Record<string,string>={added:"Activity added.",saved:"Activity saved.",deleted:"Activity deleted.",reordered:"Activity order updated."};
const errors:Record<string,string>={stale:"The activity or year order changed. Reload and try again.",operation:"Unable to complete the operation. Please try again.",confirmation:"Deletion requires explicit confirmation.",position:"Choose a valid position within this year."};
export default async function ActivitiesManagement({searchParams}:{searchParams:Promise<{success?:string;error?:string}>}) {
  const {user,supabase}=await requireAdminPage();
  const records=await supabase.from("activities").select("*").order("year",{ascending:false}).order("display_order",{ascending:true});
  if(records.error||!records.data) throw new Error("Unable to load Activities management.");
  const activities=records.data;const years=[...new Set(activities.map(a=>a.year))];const {success,error}=await searchParams;
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.management}`}>
    <h1>Activities management ({activities.length})</h1><p className={styles.email}>{user.email}</p>
    <div className={styles.toolbar}><Link className={styles.secondary} href="/admin">Admin Dashboard</Link><Link className={styles.secondary} href="/" prefetch={false}>Back to Public Website</Link><form action={logout}><button className={styles.secondary}>Logout</button></form><Link className={styles.button} href="/admin/activities/new">Add activity</Link></div>
    {success&&Object.hasOwn(successes,success)&&<p role="status" className={styles.success}>{successes[success]}</p>}
    {error&&Object.hasOwn(errors,error)&&<p role="alert" className={styles.error}>{errors[error]}</p>}
    {years.map(year=>{const group=activities.filter(a=>a.year===year);const order=JSON.stringify(group.map(a=>a.id));return <section key={year} aria-label={`Activities ${year}`}>
      <h2>{year} ({group.length})</h2><div className={styles.list}>{group.map((a,index)=><article key={a.id} className={styles.record}>
        <div className={styles.badges}><span>#{index+1}</span><span>{a.activity_type}</span></div><h3>{a.title}</h3><p>{a.institution}</p>
        {a.date_text&&<p>{a.date_text}</p>}{a.duration_text&&<p>{a.duration_text}</p>}{a.details&&<details><summary>Activity details</summary><p>{a.details}</p></details>}
        {a.proof_url?<a href={a.proof_url} target="_blank" rel="noopener noreferrer">Certificate / Proof ↗</a>:<p className={styles.note}>Proof link will be updated soon</p>}
        <div className={styles.controls}><Link className={styles.secondary} href={`/admin/activities/${a.id}/edit`}>Edit</Link><Link className={styles.danger} href={`/admin/activities/${a.id}/delete`}>Delete</Link>
          <form action={moveActivity} className={styles.reorder} aria-label={`Reorder activity: ${a.title}`}>
            <input type="hidden" name="id" value={a.id}/><input type="hidden" name="year" value={year}/><input type="hidden" name="order" value={order}/>
            <button className={styles.secondary} name="direction" value="up" disabled={index===0} aria-label="Move up">↑</button><button className={styles.secondary} name="direction" value="down" disabled={index===group.length-1} aria-label="Move down">↓</button>
            <label htmlFor={`activity-position-${a.id}`}>Position</label><input id={`activity-position-${a.id}`} type="number" name="position" min="1" max={group.length} defaultValue={index+1} required/><button className={styles.secondary}>Move</button>
          </form>
        </div>
      </article>)}</div>
    </section>;})}
    {activities.length===0&&<p>No activities yet.</p>}
  </section></main>;
}
