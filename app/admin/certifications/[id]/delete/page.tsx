import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { deleteCertification } from "../../actions";
import styles from "../../../admin.module.css";

export default async function ConfirmDeleteCertification({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound();
  const { data: certification, error } = await supabase.from("certifications")
    .select("id,title,updated_at").eq("id", Number(id)).maybeSingle();
  if (error) throw new Error("Unable to read this certification.");
  if (!certification) notFound();
  return <main className={styles.shell}><section className={styles.panel}>
    <h1>Delete certification?</h1>
    <p>{certification.title}</p>
    <p>This permanently removes this certification from the public website.</p>
    <form action={deleteCertification} className={styles.form}>
      <input type="hidden" name="id" value={certification.id} />
      <input type="hidden" name="updated_at" value={certification.updated_at} />
      <label><input type="checkbox" name="confirmed" value="yes" required /> Yes, delete this certification.</label>
      <div className={styles.controls}>
        <button className={styles.danger} type="submit">Confirm deletion</button>
        <a className={styles.secondary} href="/admin/certifications">Cancel</a>
      </div>
    </form>
  </section></main>;
}
