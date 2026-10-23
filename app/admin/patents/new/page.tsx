import { requireAdminPage } from "../../../../lib/auth/admin-page";
import PatentForm from "../patent-form";
import styles from "../../admin.module.css";

export default async function NewPatent() {
  await requireAdminPage();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}>
    <h1>Add patent</h1><PatentForm />
  </section></main>;
}
