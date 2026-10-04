import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { deletePublication } from "../../actions";
import styles from "../../../admin.module.css";

export default async function ConfirmDelete({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound();
  const { data: publication, error } = await supabase.from("publications").select("id,title,year,updated_at").eq("id", Number(id)).maybeSingle();
  if (error) throw new Error("Unable to read this publication.");
  if (!publication) notFound();
  return <main className={styles.shell}><section className={styles.panel}>
    <h1>Delete publication?</h1>
    <p>{publication.year} — {publication.title}</p>
    <p>This permanently removes this publication from the public website.</p>
    <form action={deletePublication} className={styles.form}>
      <input type="hidden" name="id" value={publication.id} />
      <input type="hidden" name="updated_at" value={publication.updated_at} />
      <label><input type="checkbox" name="confirmed" value="yes" required /> Yes, delete this publication.</label>
      <div className={styles.controls}>
        <button className={styles.danger} type="submit">Confirm deletion</button>
        <a className={styles.secondary} href="/admin">Cancel</a>
      </div>
    </form>
  </section></main>;
}
