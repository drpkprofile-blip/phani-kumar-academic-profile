import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import ProjectGuidedForm from "../../project-form";
import styles from "../../../admin.module.css";

export default async function EditGuidedProject({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id: rawId } = await params;
  if (!/^[1-9]\d*$/.test(rawId)) notFound();
  const { data, error } = await supabase.from("projects_guided").select("*").eq("id", Number(rawId)).maybeSingle();
  if (error || !data) notFound();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Edit guided project</h1>
    <ProjectGuidedForm id={data.id} updatedAt={data.updated_at} initial={{
      project_title: data.project_title, project_level: data.project_level ?? "", degree_program: data.degree_program ?? "",
      branch: data.branch ?? "", academic_year: data.academic_year ?? "", batch: data.batch ?? "",
      student_names: data.student_names?.join("\n") ?? "", guide_name: data.guide_name ?? "",
      co_guide_names: data.co_guide_names?.join("\n") ?? "", proof_url: data.proof_url ?? "",
    }} /></section></main>;
}
