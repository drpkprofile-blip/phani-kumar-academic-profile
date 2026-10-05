import Link from "next/link";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { logout } from "../actions";
import { moveAchievement } from "./actions";
import styles from "../admin.module.css";

const successes: Record<string, string> = {
  added: "Achievement added.", saved: "Achievement saved.", deleted: "Achievement deleted.", reordered: "Achievement order updated.",
};
const errors: Record<string, string> = {
  stale: "The achievement list changed. Reload and try again.", operation: "Unable to complete the operation. Please try again.",
  confirmation: "Deletion requires explicit confirmation.", position: "Choose a valid achievement position.",
};

export default async function AchievementsManagement({ searchParams }: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { user, supabase } = await requireAdminPage();
  const { data: achievements, error } = await supabase
    .from("achievements")
    .select("*")
    .order("display_order", { ascending: true });
  if (error || !achievements) throw new Error("Unable to load Achievements management.");
  const { success, error: errorCode } = await searchParams;
  const order = JSON.stringify(achievements.map((record) => record.id));

  return (
    <main className={styles.shell}>
      <section className={`${styles.panel} ${styles.management}`} aria-labelledby="achievements-title">
        <h1 id="achievements-title">Achievements / Awards ({achievements.length})</h1>
        <p className={styles.email}>{user.email}</p>
        <div className={styles.toolbar}>
          <Link className={styles.secondary} href="/admin">Admin Dashboard</Link>
          <Link className={styles.secondary} href="/" prefetch={false}>Back to Public Website</Link>
          <form action={logout}><button className={styles.secondary} type="submit">Logout</button></form>
          <Link className={styles.button} href="/admin/achievements/new">Add achievement</Link>
        </div>
        {success && Object.hasOwn(successes, success) && <p role="status" className={styles.success}>{successes[success]}</p>}
        {errorCode && Object.hasOwn(errors, errorCode) && <p role="alert" className={styles.error}>{errors[errorCode]}</p>}
        <div className={styles.list}>
          {achievements.map((achievement, index) => (
            <article key={achievement.id} className={styles.record}>
              <div className={styles.badges}><span>#{String(achievement.display_order).padStart(2, "0")}</span><span>ACHIEVEMENT</span></div>
              <h2>{achievement.title}</h2>
              <p>{achievement.description}</p>
              {achievement.proof_url
                ? <p><a href={achievement.proof_url} target="_blank" rel="noopener noreferrer">Proof ↗</a></p>
                : <p className={styles.note}>Proof link will be updated soon</p>}
              {achievement.extra_proof_url && <p><a href={achievement.extra_proof_url} target="_blank" rel="noopener noreferrer">Event Proof ↗</a></p>}
              <div className={styles.controls}>
                <Link className={styles.secondary} href={`/admin/achievements/${achievement.id}/edit`}>Edit</Link>
                <Link className={styles.danger} href={`/admin/achievements/${achievement.id}/delete`}>Delete</Link>
                <form action={moveAchievement} className={styles.reorder} aria-label={`Reorder achievement: ${achievement.title}`}>
                  <input type="hidden" name="id" value={achievement.id} />
                  <input type="hidden" name="order" value={order} />
                  <button className={styles.secondary} name="direction" value="up" disabled={index === 0} aria-label="Move up">↑</button>
                  <button className={styles.secondary} name="direction" value="down" disabled={index === achievements.length - 1} aria-label="Move down">↓</button>
                  <label htmlFor={`achievement-position-${achievement.id}`}>Position</label>
                  <input id={`achievement-position-${achievement.id}`} name="position" type="number" min="1" max={achievements.length} defaultValue={index + 1} required />
                  <button className={styles.secondary} type="submit">Move</button>
                </form>
              </div>
            </article>
          ))}
          {achievements.length === 0 && <p>No achievements yet.</p>}
        </div>
      </section>
    </main>
  );
}
