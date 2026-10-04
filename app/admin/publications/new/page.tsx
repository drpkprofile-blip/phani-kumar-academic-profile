import { requireAdminPage } from "../../../../lib/auth/admin-page";
import PublicationForm from "../publication-form";
import styles from "../../admin.module.css";

export default async function NewPublication() {
  await requireAdminPage();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}>
    <h1>Add publication</h1><PublicationForm />
  </section></main>;
}
