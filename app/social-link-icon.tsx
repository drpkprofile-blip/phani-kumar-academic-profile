type SocialLinkIconProps = { label: string };

export default function SocialLinkIcon({ label }: SocialLinkIconProps) {
  const name = label.toLowerCase();

  if (name.includes("linkedin")) {
    return <svg className="profile-social-icon profile-social-icon--linkedin" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 8.6H2V22h3.2V8.6ZM3.6 2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM22 13.9c0-4-2.1-5.9-4.9-5.9a4.2 4.2 0 0 0-3.8 2.1V8.6h-3.2V22h3.2v-7.1c0-1.9.4-3.8 2.8-3.8s2.5 2.2 2.5 3.9V22H22v-8.1Z" /></svg>;
  }

  if (name.includes("instagram")) {
    return <svg className="profile-social-icon profile-social-icon--instagram" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2.2"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2.2"/><circle cx="17.6" cy="6.7" r="1.2" fill="currentColor"/></svg>;
  }

  if (name.includes("facebook")) {
    return <svg className="profile-social-icon profile-social-icon--facebook" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-9.1h3.1l.5-3.6h-3.6V7c0-1 .3-1.7 1.8-1.7h1.9V2.1c-.9-.1-1.9-.2-2.8-.2-2.8 0-4.7 1.7-4.7 4.9v2.5H6.6v3.6h3.1V22h3.8Z"/></svg>;
  }

  if (name.includes("scholar")) {
    return <svg className="profile-social-icon profile-social-icon--scholar" viewBox="0 0 24 24" aria-hidden="true"><path d="m1.5 9 10.5-6L22.5 9 12 15 1.5 9Z"/><path d="M5 11.2v5.1c3.8 3.1 10.2 3.1 14 0v-5.1l-7 4-7-4Z"/><path d="M22 9v6" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="22" cy="16.5" r="1.4"/></svg>;
  }

  if (name.includes("researchgate")) {
    return <svg className="profile-social-icon profile-social-icon--researchgate" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/><text x="12" y="16" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" fill="currentColor">RG</text></svg>;
  }

  if (name.includes("irins")) {
    return <svg className="profile-social-icon profile-social-icon--irins" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8 8h8M12 8v9M8 17h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><circle cx="12" cy="5" r="1" fill="currentColor"/></svg>;
  }

  if (name.includes("web of science")) {
    return <svg className="profile-social-icon profile-social-icon--wos" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/><text x="12" y="15.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill="currentColor">WoS</text></svg>;
  }

  return <svg className="profile-social-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="2"/></svg>;
}
