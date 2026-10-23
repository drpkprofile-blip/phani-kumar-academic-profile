import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { positivePatentId } from "../../../../../lib/admin/patent-form";
import { deletePatent } from "../../actions";
import styles from "../../../admin.module.css";

export default async function DeletePatent({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const id = positivePatentId((await params).id);
  if (!id) notFound();
  const { data, error } = await supabase.from("patents").select("id,title,updated_at").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load patent.");
  if (!data) notFound();
  return <main className={styles.shell}><section className={styles.panel}>
    <h1>Delete patent?</h1><p>{data.title}</p>
    <p className={styles.note}>This removes this patent record from the public profile.</p>
    <form action={deletePatent} className={styles.form}>
      <input type="hidden" name="id" value={data.id} />
      <input type="hidden" name="updated_at" value={data.updated_at} />
      <label className={styles.field}><span><input type="checkbox" name="confirmed" value="yes" required /> Confirm deletion</span></label>
      <div className={styles.controls}>
        <button className={styles.danger} type="submit">Delete patent</button>
        <a className={styles.secondary} href="/admin/patents">Cancel</a>
      </div>
    </form>
  </section></main>;
}
