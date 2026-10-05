import Link from "next/link";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { logout } from "../actions";
import { moveProfessionalMembership } from "./actions";
import styles from "../admin.module.css";

const successes: Record<string, string> = { added: "Membership added.", saved: "Membership saved.", deleted: "Membership deleted.", reordered: "Membership order updated." };
const errors: Record<string, string> = { stale: "The membership list changed. Reload and try again.", operation: "Unable to complete the operation. Please try again.", confirmation: "Deletion requires explicit confirmation.", position: "Choose a valid membership position." };

export default async function ProfessionalMembershipsAdmin({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { user, supabase } = await requireAdminPage();
  const { data: records, error } = await supabase.from("professional_memberships").select("*").order("display_order", { ascending: true });
  if (error || !records) throw new Error("Unable to load Professional Bodies management.");
  const { success, error: errorCode } = await searchParams;
  const order = JSON.stringify(records.map((record) => record.id));
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.management}`} aria-labelledby="professional-memberships-title">
    <h1 id="professional-memberships-title">Professional Bodies ({records.length})</h1><p className={styles.email}>{user.email}</p>
    <div className={styles.toolbar}><Link className={styles.secondary} href="/admin">Admin Dashboard</Link><Link className={styles.secondary} href="/" prefetch={false}>Back to Public Website</Link>
      <form action={logout}><button className={styles.secondary} type="submit">Logout</button></form><Link className={styles.button} href="/admin/professional-memberships/new">Add membership</Link></div>
    {success && Object.hasOwn(successes, success) && <p role="status" className={styles.success}>{successes[success]}</p>}
    {errorCode && Object.hasOwn(errors, errorCode) && <p role="alert" className={styles.error}>{errors[errorCode]}</p>}
    <div className={styles.list}>{records.map((record, index) => <article className={styles.record} key={record.id}>
      <div className={styles.badges}><span>#{String(record.display_order).padStart(2, "0")}</span>{record.membership_type && <span>{record.membership_type}</span>}</div>
      <h2>{record.organization_name}</h2>
      {[record.membership_number && `Membership no.: ${record.membership_number}`, record.date_text, record.validity_text, record.designation, record.chapter]
        .filter(Boolean).map((detail) => <p key={detail}>{detail}</p>)}
      {record.proof_url ? <p><a href={record.proof_url} target="_blank" rel="noopener noreferrer">Proof ↗</a></p> : <p className={styles.note}>Proof URL not supplied</p>}
      <div className={styles.controls}><Link className={styles.secondary} href={`/admin/professional-memberships/${record.id}/edit`}>Edit</Link>
        <Link className={styles.danger} href={`/admin/professional-memberships/${record.id}/delete`}>Delete</Link>
        <form action={moveProfessionalMembership} className={styles.reorder} aria-label={`Reorder membership: ${record.organization_name}`}>
          <input type="hidden" name="id" value={record.id} /><input type="hidden" name="order" value={order} />
          <button className={styles.secondary} name="direction" value="up" disabled={index === 0} aria-label="Move up">↑</button>
          <button className={styles.secondary} name="direction" value="down" disabled={index === records.length - 1} aria-label="Move down">↓</button>
          <label htmlFor={`membership-position-${record.id}`}>Position</label><input id={`membership-position-${record.id}`} name="position" type="number" min="1" max={records.length} defaultValue={index + 1} required />
          <button className={styles.secondary} type="submit">Move</button>
        </form>
      </div>
    </article>)}{records.length === 0 && <p>No professional memberships yet.</p>}</div>
  </section></main>;
}
