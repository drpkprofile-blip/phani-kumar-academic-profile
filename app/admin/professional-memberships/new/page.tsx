import { requireAdminPage } from "../../../../lib/auth/admin-page";
import ProfessionalMembershipForm from "../membership-form";
import styles from "../../admin.module.css";

export default async function NewProfessionalMembership() {
  await requireAdminPage();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Add professional membership</h1><ProfessionalMembershipForm /></section></main>;
}
