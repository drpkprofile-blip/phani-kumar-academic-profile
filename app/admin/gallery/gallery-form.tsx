import Link from "next/link";
import { saveGalleryItem } from "./actions";
import styles from "../admin.module.css";

export default function GalleryForm({ initial, id, updatedAt, error }: { initial?: { description: string }; id?: number; updatedAt?: string; error?: string }) {
  const errors: Record<string, string> = { description: "Enter a caption or description.", photo: "Choose a JPG, PNG, or WebP image.", size: "The image must be 8 MB or smaller." };
  return <form action={saveGalleryItem} className={styles.form} encType="multipart/form-data">
    {id !== undefined && <><input type="hidden" name="id" value={id} /><input type="hidden" name="updated_at" value={updatedAt} /></>}
    {error && errors[error] && <p role="alert" className={styles.error}>{errors[error]}</p>}
    <label className={styles.field} htmlFor="gallery-description">Photo description / caption
      <textarea id="gallery-description" name="description" rows={4} defaultValue={initial?.description ?? ""} maxLength={1200} required />
    </label>
    <label className={styles.field} htmlFor="gallery-photo">{id === undefined ? "Photo" : "Replace photo (optional)"}
      <input id="gallery-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required={id === undefined} />
    </label>
    <p className={styles.note}>JPG, PNG, or WebP; maximum 8 MB. The description will appear with the public photo.</p>
    <div className={styles.controls}><button className={styles.button} type="submit">{id === undefined ? "Add photo" : "Save changes"}</button><Link className={styles.secondary} href="/admin/gallery">Cancel</Link></div>
  </form>;
}
