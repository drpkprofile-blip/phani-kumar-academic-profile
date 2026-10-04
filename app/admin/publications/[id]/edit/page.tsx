import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import PublicationForm from "../../publication-form";
import styles from "../../../admin.module.css";

export default async function EditPublication({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound();
  const { data: publication, error } = await supabase.from("publications").select("*").eq("id", Number(id)).maybeSingle();
  if (error) throw new Error("Unable to read this publication.");
  if (!publication) notFound();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}>
    <h1>Edit publication</h1>
    <PublicationForm id={publication.id} updatedAt={publication.updated_at} initial={{
      title: publication.title, year: publication.year, journal: publication.journal,
      indexing: publication.indexing.join("\n"), doi: publication.doi ?? "",
      article_url: publication.article_url ?? "", proof_url: publication.proof_url ?? "",
      publication_type: publication.publication_type ?? "", impact_factor: publication.impact_factor?.toString() ?? "",
    }} />
  </section></main>;
}
