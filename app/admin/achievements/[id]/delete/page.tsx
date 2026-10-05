import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { positiveInteger } from "../../../../../lib/admin/achievement-form";
import { deleteAchievement } from "../../actions";
import styles from "../../../admin.module.css";

export default async function DeleteAchievement({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const id = positiveInteger((await params).id);
  if (!id) notFound();
  const { data, error } = await supabase.from("achievements").select("id,title,updated_at").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load achievement.");
  if (!data) notFound();
  return <main className={styles.shell}><section className={styles.panel}>
    <h1>Delete achievement?</h1><p>{data.title}</p>
    <p className={styles.note}>This removes the record and compacts the public display order.</p>
    <form action={deleteAchievement} className={styles.form}>
      <input type="hidden" name="id" value={data.id} />
      <input type="hidden" name="updated_at" value={data.updated_at} />
      <label className={styles.field}><span><input type="checkbox" name="confirmed" value="yes" required /> Confirm deletion</span></label>
      <div className={styles.controls}>
        <button className={styles.danger} type="submit">Delete achievement</button>
        <a className={styles.secondary} href="/admin/achievements">Cancel</a>
      </div>
    </form>
  </section></main>;
}
