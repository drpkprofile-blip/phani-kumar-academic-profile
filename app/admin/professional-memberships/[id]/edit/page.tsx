import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import ProfessionalMembershipForm from "../../membership-form";
import styles from "../../../admin.module.css";

export default async function EditProfessionalMembership({ params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await requireAdminPage();
  const { id: rawId } = await params;
  if (!/^[1-9]\d*$/.test(rawId)) notFound();
  const id = Number(rawId);
  const { data, error } = await supabase.from("professional_memberships").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Edit professional membership</h1><p className={styles.email}>{user.email}</p>
    <ProfessionalMembershipForm id={data.id} updatedAt={data.updated_at} initial={{
      organization_name: data.organization_name, membership_type: data.membership_type ?? "", membership_number: data.membership_number ?? "",
      date_text: data.date_text ?? "", validity_text: data.validity_text ?? "", designation: data.designation ?? "",
      chapter: data.chapter ?? "", proof_url: data.proof_url ?? "",
    }} /></section></main>;
}
