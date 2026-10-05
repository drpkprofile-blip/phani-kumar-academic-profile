import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import CertificationForm from "../../certification-form";
import styles from "../../../admin.module.css";

export default async function EditCertification({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound();
  const { data: certification, error } = await supabase.from("certifications").select("*").eq("id", Number(id)).maybeSingle();
  if (error) throw new Error("Unable to read this certification.");
  if (!certification) notFound();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}>
    <h1>Edit certification</h1>
    <CertificationForm id={certification.id} updatedAt={certification.updated_at} initial={{
      title: certification.title,
      certificate_url: certification.certificate_url ?? "",
      fdp_url: certification.fdp_url ?? "",
    }} />
  </section></main>;
}
