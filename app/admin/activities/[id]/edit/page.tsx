import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import ActivityForm from "../../activity-form";
import styles from "../../../admin.module.css";
export default async function EditActivity({params}:{params:Promise<{id:string}>}) {
  const {supabase}=await requireAdminPage();const {id}=await params;
  if(!/^[1-9]\d*$/.test(id)||Number(id)>2147483647) notFound();
  const [record,categories]=await Promise.all([
    supabase.from("activities").select("*").eq("id",Number(id)).maybeSingle(),
    supabase.from("activity_categories").select("label").order("display_order"),
  ]);
  if(record.error||categories.error||!categories.data) throw new Error("Unable to load this activity.");
  if(!record.data) notFound();const a=record.data;
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Edit activity</h1>
    <ActivityForm id={a.id} updatedAt={a.updated_at} categories={categories.data.map(c=>c.label)} initial={{year:a.year,title:a.title,activity_type:a.activity_type,institution:a.institution,date_text:a.date_text??"",duration_text:a.duration_text??"",details:a.details??"",proof_url:a.proof_url??""}}/>
  </section></main>;
}
