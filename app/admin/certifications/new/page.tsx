import { requireAdminPage } from "../../../../lib/auth/admin-page";
import CertificationForm from "../certification-form";
import styles from "../../admin.module.css";

export default async function NewCertification() {
  await requireAdminPage();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}>
    <h1>Add certification</h1><CertificationForm />
  </section></main>;
}
