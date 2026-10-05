import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { deleteProjectGuided } from "../../actions";
import styles from "../../../admin.module.css";

export default async function DeleteGuidedProject({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id: rawId } = await params;
  if (!/^[1-9]\d*$/.test(rawId)) notFound();
  const { data, error } = await supabase.from("projects_guided").select("id,project_title,updated_at").eq("id", Number(rawId)).maybeSingle();
  if (error || !data) notFound();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Delete guided project</h1>
    <p>Delete <strong>{data.project_title}</strong>? This action cannot be undone.</p>
    <form action={deleteProjectGuided} className={styles.form}>
      <input type="hidden" name="id" value={data.id} /><input type="hidden" name="updated_at" value={data.updated_at} />
      <label className={styles.field}><input type="checkbox" name="confirmed" value="yes" required /> I confirm deletion of this project.</label>
      <div className={styles.controls}><button className={styles.danger} type="submit">Delete project</button><Link className={styles.secondary} href="/admin/projects-guided">Cancel</Link></div>
    </form></section></main>;
}
