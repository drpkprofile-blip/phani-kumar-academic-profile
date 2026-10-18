import Link from "next/link";
import Image from "next/image";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { logout } from "../actions";
import { moveGalleryItem } from "./actions";
import styles from "../admin.module.css";

const successes: Record<string, string> = { added: "Photo added to the public gallery.", saved: "Gallery photo saved.", deleted: "Gallery photo deleted.", reordered: "Gallery order updated." };
const errors: Record<string, string> = { stale: "The gallery changed. Reload and try again.", save: "Unable to save the gallery item.", photo: "Choose a valid JPG, PNG, or WebP image.", size: "Images must be 8 MB or smaller.", upload: "The image could not be uploaded.", delete: "Unable to delete this gallery item.", confirmation: "Deletion requires explicit confirmation.", position: "Choose a valid gallery position.", reorder: "Unable to update the gallery order.", "storage-cleanup": "The gallery entry was deleted, but its image cleanup needs attention." };

export default async function GalleryAdmin({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { user, supabase } = await requireAdminPage();
  const { data: records, error } = await supabase.from("gallery_items").select("*").order("display_order", { ascending: true });
  if (error || !records) throw new Error("Unable to load gallery management.");
  const { success, error: errorCode } = await searchParams;
  const order = JSON.stringify(records.map((record) => record.id));
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.management}`} aria-labelledby="gallery-admin-title">
    <h1 id="gallery-admin-title">Photo Gallery ({records.length})</h1><p className={styles.email}>{user.email}</p>
    <div className={styles.toolbar}><Link className={styles.secondary} href="/admin">Admin Dashboard</Link><Link className={styles.secondary} href="/" prefetch={false}>Back to Public Website</Link><form action={logout}><button className={styles.secondary} type="submit">Logout</button></form><Link className={styles.button} href="/admin/gallery/new">Add photo</Link></div>
    {success && Object.hasOwn(successes, success) && <p role="status" className={styles.success}>{successes[success]}</p>}
    {errorCode && Object.hasOwn(errors, errorCode) && <p role="alert" className={styles.error}>{errors[errorCode]}</p>}
    <p className={styles.note}>Upload JPG, PNG, or WebP images up to 8 MB. Add a caption for visitors; photos appear publicly in the order shown here.</p>
    <div className={styles.list}>{records.map((item, index) => {
      const { data: url } = supabase.storage.from("profile-assets").getPublicUrl(item.storage_path);
      return <article className={styles.record} key={item.id}>
        <div className={styles.badges}><span>#{String(item.display_order).padStart(2, "0")}</span></div>
        {/* Admin thumbnail is the same public object visitors see. */}
        <Image src={url.publicUrl} alt="" width={560} height={420} unoptimized style={{ display: "block", width: "min(100%, 280px)", height: "auto", borderRadius: 10, marginTop: 12 }} />
        <p>{item.description}</p>
        <div className={styles.controls}><Link className={styles.secondary} href={`/admin/gallery/${item.id}/edit`}>Edit</Link><Link className={styles.danger} href={`/admin/gallery/${item.id}/delete`}>Delete</Link>
          <form action={moveGalleryItem} className={styles.reorder} aria-label={`Reorder gallery photo: ${item.description}`}>
            <input type="hidden" name="id" value={item.id} /><input type="hidden" name="order" value={order} />
            <button className={styles.secondary} name="direction" value="up" disabled={index === 0} aria-label="Move up">↑</button><button className={styles.secondary} name="direction" value="down" disabled={index === records.length - 1} aria-label="Move down">↓</button>
            <label htmlFor={`gallery-position-${item.id}`}>Position</label><input id={`gallery-position-${item.id}`} name="position" type="number" min="1" max={records.length} defaultValue={index + 1} required /><button className={styles.secondary} type="submit">Move</button>
          </form>
        </div>
      </article>;
    })}{records.length === 0 && <p>No gallery photos yet. Add photos whenever you are ready.</p>}</div>
  </section></main>;
}
