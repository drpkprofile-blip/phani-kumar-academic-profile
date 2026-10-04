import { login } from "../actions";
import styles from "../admin.module.css";

const messages: Record<string, string> = {
  credentials: "Unable to sign in. Check your email and password.",
  denied: "This account does not have admin access.",
  unavailable: "Admin sign-in is not configured yet.",
};

export default async function AdminLogin({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error && Object.hasOwn(messages, error) ? messages[error] : undefined;
  return (
    <main className={styles.shell}>
      <section className={styles.panel} aria-labelledby="admin-login-title">
        <h1 id="admin-login-title">Admin Login</h1>
        {message && <p className={styles.message} role="alert">{message}</p>}
        <form action={login} className={styles.form}>
          <label className={styles.field} htmlFor="email">Email
            <input id="email" name="email" type="email" autoComplete="username" maxLength={254} required />
          </label>
          <label className={styles.field} htmlFor="password">Password
            <input id="password" name="password" type="password" autoComplete="current-password" maxLength={4096} required />
          </label>
          <button className={styles.button} type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}
