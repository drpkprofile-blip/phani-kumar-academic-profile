import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import SubjectTaughtForm from "../../subject-form";
import styles from "../../../admin.module.css";

export default async function EditSubjectTaught({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id: rawId } = await params;
  if (!/^[1-9]\d*$/.test(rawId)) notFound();
  const { data, error } = await supabase.from("subjects_taught").select("*").eq("id", Number(rawId)).maybeSingle();
  if (error || !data) notFound();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Edit subject</h1>
    <SubjectTaughtForm id={data.id} updatedAt={data.updated_at} initial={{
      subject_name: data.subject_name, course_code: data.course_code ?? "", program: data.program ?? "", branch: data.branch ?? "",
      semester: data.semester ?? "", academic_year: data.academic_year ?? "", subject_type: data.subject_type ?? "", proof_url: data.proof_url ?? "",
    }} /></section></main>;
}
