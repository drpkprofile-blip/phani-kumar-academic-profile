import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { positiveInteger } from "../../../../../lib/admin/achievement-form";
import AchievementForm from "../../achievement-form";
import styles from "../../../admin.module.css";

export default async function EditAchievement({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const id = positiveInteger((await params).id);
  if (!id) notFound();
  const { data, error } = await supabase.from("achievements").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load achievement.");
  if (!data) notFound();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}>
    <h1>Edit achievement</h1>
    <AchievementForm id={data.id} updatedAt={data.updated_at} initial={{
      title: data.title, description: data.description,
      proof_url: data.proof_url ?? "", extra_proof_url: data.extra_proof_url ?? "",
    }} />
  </section></main>;
}
