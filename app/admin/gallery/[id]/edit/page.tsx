import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import GalleryForm from "../../gallery-form";
import styles from "../../../admin.module.css";

export default async function EditGalleryItem({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id: rawId } = await params;
  if (!/^[1-9]\d*$/.test(rawId)) notFound();
  const { data, error } = await supabase.from("gallery_items").select("id,description,updated_at").eq("id", Number(rawId)).maybeSingle();
  if (error || !data) notFound();
  const query = await searchParams;
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}><h1>Edit gallery photo</h1><GalleryForm id={data.id} updatedAt={data.updated_at} initial={{ description: data.description }} error={query.error} /></section></main>;
}
