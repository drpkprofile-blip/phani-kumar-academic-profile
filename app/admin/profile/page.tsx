import Link from "next/link";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { mapProfileSettingsRow } from "../../../lib/profile-settings";
import { logout } from "../actions";
import styles from "../admin.module.css";
import ProfileEditor from "./profile-editor";
import { uploadCitationImage, uploadProfilePhoto } from "./actions";

export default async function AdminProfileSettings({ searchParams }: { searchParams: Promise<{ success?: string; photo?: string; citations?: string }> }) {
  const { user, supabase } = await requireAdminPage();
  const { data, error } = await supabase.from("profile_settings").select("*").eq("singleton", true).single();
  if (error || !data) throw new Error("Unable to load profile settings.");
  const { profile, experienceCounterText } = mapProfileSettingsRow(data);
  const query = await searchParams;
  const initial = {
    name: profile.name, first_name: profile.firstName, last_name: profile.lastName,
    qualifications: profile.qualifications, designation: profile.designation,
    department: profile.department, institution: profile.institution,
    profile_label: profile.profileLabel, description: profile.description,
    email: profile.email, phone: profile.phone,
    experience_counter_text: experienceCounterText,
    google_scholar_citations_text: profile.googleScholarMetrics.citationsText,
    google_scholar_h_index_text: profile.googleScholarMetrics.hIndexText,
    google_scholar_i10_index_text: profile.googleScholarMetrics.i10IndexText,
    youtube_title: profile.youtubeChannel.title, youtube_href: profile.youtubeChannel.href,
    youtube_image: profile.youtubeChannel.image,
    technical_tools: profile.technicalTools, skills: profile.skills,
    research_interests: profile.researchInterests,
    academic_identity: profile.academicIdentity, profile_links: profile.profileLinks,
  };
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.management}`} aria-labelledby="profile-settings-title">
    <h1 id="profile-settings-title">Profile &amp; Links</h1><p className={styles.email}>{user.email}</p>
    <div className={styles.toolbar}><Link className={styles.secondary} href="/admin">Admin Dashboard</Link><Link className={styles.secondary} href="/" prefetch={false}>Back to Public Website</Link><form action={logout}><button className={styles.secondary} type="submit">Logout</button></form></div>
    {query.success === "saved" && <p role="status" className={styles.success}>Profile settings saved.</p>}
    {query.photo === "saved" && <p role="status" className={styles.success}>Profile photo updated.</p>}
    {query.photo === "invalid" && <p role="alert" className={styles.error}>Choose a valid PNG, JPEG or WebP image under 8 MB.</p>}
    {query.photo === "error" && <p role="alert" className={styles.error}>Unable to update the profile photo. Please try again.</p>}
    {query.citations === "saved" && <p role="status" className={styles.success}>Google Scholar citation image updated.</p>}
    {query.citations === "invalid" && <p role="alert" className={styles.error}>Choose a valid PNG, JPEG or WebP image under 8 MB.</p>}
    {query.citations === "error" && <p role="alert" className={styles.error}>Unable to update the citation image. Please try again.</p>}
    <section className={styles.module} aria-labelledby="profile-photo-title">
      <h2 id="profile-photo-title">Profile photo</h2>
      <p>Current photo: <a href={profile.photo} target="_blank" rel="noopener noreferrer">View image</a></p>
      <form action={uploadProfilePhoto} className={styles.form}>
        <label className={styles.field} htmlFor="profile-photo-upload">Upload replacement (PNG, JPEG or WebP; max 8 MB)
          <input id="profile-photo-upload" name="photo" type="file" accept="image/png,image/jpeg,image/webp" required />
        </label>
        <button className={styles.button} type="submit">Update profile photo</button>
      </form>
    </section>
    <section className={styles.module} aria-labelledby="citation-image-title">
      <h2 id="citation-image-title">Google Scholar citations image</h2>
      <p>Current image: <a href={profile.citationsImageUrl} target="_blank" rel="noopener noreferrer">View citation screenshot</a></p>
      <form action={uploadCitationImage} className={styles.form}>
        <label className={styles.field} htmlFor="citation-image-upload">Upload replacement (PNG, JPEG or WebP; max 8 MB)
          <input id="citation-image-upload" name="citationImage" type="file" accept="image/png,image/jpeg,image/webp" required />
        </label>
        <button className={styles.button} type="submit">Update citations image</button>
      </form>
    </section>
    <h2>Public profile information</h2>
    <ProfileEditor initial={initial} />
  </section></main>;
}
