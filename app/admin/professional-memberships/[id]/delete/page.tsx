import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { deleteProfessionalMembership } from "../../actions";
import styles from "../../../admin.module.css";

export default async function DeleteProfessionalMembership({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id: rawId } = await params;
  if (!/^[1-9]\d*$/.test(rawId)) notFound();
  const { data, error } = await supabase.from("professional_memberships").select("id,organization_name,updated_at").eq("id", Number(rawId)).maybeSingle();
  if (error || !data) notFound();
  return <main className={styles.shell}><section className={styles.panel}>
    <h1>Delete professional membership?</h1><p>{data.organization_name} This removes the record and compacts the public display order.</p>
    <form action={deleteProfessionalMembership} className={styles.form}><input type="hidden" name="id" value={data.id} /><input type="hidden" name="updated_at" value={data.updated_at} />
      <label><input type="checkbox" name="confirmed" value="yes" required /> Confirm deletion</label>
      <button className={styles.danger} type="submit">Delete membership</button><a className={styles.secondary} href="/admin/professional-memberships">Cancel</a>
    </form>
  </section></main>;
}
