import { requireAdminPage } from "../../lib/auth/admin-page";
import { logout } from "./actions";
import styles from "./admin.module.css";

export default async function AdminDashboard() {
  const { user } = await requireAdminPage();
  return (
    <main className={styles.shell}>
      <section className={styles.panel} aria-labelledby="admin-dashboard-title">
        <h1 id="admin-dashboard-title">Admin Dashboard</h1>
        <p className={styles.email}>{user.email}</p>
        <div className={styles.module}>Publications module — coming soon</div>
        <form action={logout}>
          <button className={styles.button} type="submit">Logout</button>
        </form>
      </section>
    </main>
  );
}
