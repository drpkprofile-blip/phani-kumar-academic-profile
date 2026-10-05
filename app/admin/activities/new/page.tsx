import { requireAdminPage } from "../../../../lib/auth/admin-page";
import ActivityForm from "../activity-form";
import styles from "../../admin.module.css";
export default async function NewActivity() {
  const {supabase}=await requireAdminPage();
  const categories=await supabase.from("activity_categories").select("label").order("display_order");
  if(categories.error||!categories.data) throw new Error("Unable to load activity categories.");
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Add activity</h1><ActivityForm categories={categories.data.map(c=>c.label)}/></section></main>;
}
