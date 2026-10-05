import { requireAdminPage } from "../../../../lib/auth/admin-page";
import SubjectTaughtForm from "../subject-form";
import styles from "../../admin.module.css";

export default async function NewSubjectTaught() {
  await requireAdminPage();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Add subject</h1><SubjectTaughtForm /></section></main>;
}
