import { requireAdminPage } from "../../../../lib/auth/admin-page";
import GalleryForm from "../gallery-form";
import styles from "../../admin.module.css";

export default async function NewGalleryItem({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdminPage();
  const { error } = await searchParams;
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Add gallery photo</h1><GalleryForm error={error} /></section></main>;
}
