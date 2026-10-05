import { requireAdminPage } from "../../../../lib/auth/admin-page";
import ProjectGuidedForm from "../project-form";
import styles from "../../admin.module.css";

export default async function NewGuidedProject() {
  await requireAdminPage();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Add guided project</h1><ProjectGuidedForm /></section></main>;
}
