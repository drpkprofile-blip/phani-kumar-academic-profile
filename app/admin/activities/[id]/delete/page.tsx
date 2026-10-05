import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { deleteActivity } from "../../actions";
import styles from "../../../admin.module.css";

export default async function ConfirmDelete({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound();
  const { data: activity, error } = await supabase.from("activities").select("id,title,year,updated_at").eq("id", Number(id)).maybeSingle();
  if (error) throw new Error("Unable to read this activity.");
  if (!activity) notFound();
  return <main className={styles.shell}><section className={styles.panel}>
    <h1>Delete activity?</h1>
    <p>{activity.year} — {activity.title}</p>
    <p>This permanently removes this activity from the public website.</p>
    <form action={deleteActivity} className={styles.form}>
      <input type="hidden" name="id" value={activity.id} />
      <input type="hidden" name="updated_at" value={activity.updated_at} />
      <label><input type="checkbox" name="confirmed" value="yes" required /> Yes, delete this activity.</label>
      <div className={styles.controls}>
        <button className={styles.danger} type="submit">Confirm deletion</button>
        <a className={styles.secondary} href="/admin/activities">Cancel</a>
      </div>
    </form>
  </section></main>;
}
