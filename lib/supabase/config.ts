export function getSupabaseConfig() {
  // Keep explicit property reads: Next.js inlines these in browser builds.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured. Set the public project URL and publishable key in .env.local.");
  }

  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Supabase requires a publishable key; privileged and legacy keys are not accepted here.");
  }

  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname))) {
    throw new Error("Supabase URL must use HTTPS, except for local development.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Supabase URL must not contain credentials.");
  }

  return { url, publishableKey };
}
