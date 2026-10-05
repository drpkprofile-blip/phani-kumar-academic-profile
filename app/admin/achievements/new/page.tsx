import { requireAdminPage } from "../../../../lib/auth/admin-page";
import AchievementForm from "../achievement-form";
import styles from "../../admin.module.css";

export default async function NewAchievement() {
  await requireAdminPage();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}>
    <h1>Add achievement</h1><AchievementForm />
  </section></main>;
}
