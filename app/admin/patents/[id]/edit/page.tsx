import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { positivePatentId } from "../../../../../lib/admin/patent-form";
import PatentForm from "../../patent-form";
import styles from "../../../admin.module.css";

export default async function EditPatent({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const id = positivePatentId((await params).id);
  if (!id) notFound();
  const { data, error } = await supabase.from("patents").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load patent.");
  if (!data) notFound();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}>
    <h1>Edit patent</h1>
    <PatentForm id={data.id} updatedAt={data.updated_at} initial={{
      application_number: data.application_number, filing_date: data.filing_date,
      publication_date: data.publication_date, title: data.title,
      journal_number: data.journal_number, page_number: data.page_number, proof_url: data.proof_url ?? "",
    }} />
  </section></main>;
}
