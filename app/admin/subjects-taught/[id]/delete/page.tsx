import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { deleteSubjectTaught } from "../../actions";
import styles from "../../../admin.module.css";

export default async function DeleteSubjectTaught({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id: rawId } = await params;
  if (!/^[1-9]\d*$/.test(rawId)) notFound();
  const { data, error } = await supabase.from("subjects_taught").select("id,subject_name,updated_at").eq("id", Number(rawId)).maybeSingle();
  if (error || !data) notFound();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Delete subject</h1>
    <p>Delete <strong>{data.subject_name}</strong>? This action cannot be undone.</p>
    <form action={deleteSubjectTaught} className={styles.form}><input type="hidden" name="id" value={data.id} /><input type="hidden" name="updated_at" value={data.updated_at} />
      <label className={styles.field}><input type="checkbox" name="confirmed" value="yes" required /> I confirm deletion of this subject.</label>
      <div className={styles.controls}><button className={styles.danger} type="submit">Delete subject</button><Link className={styles.secondary} href="/admin/subjects-taught">Cancel</Link></div>
    </form></section></main>;
}
