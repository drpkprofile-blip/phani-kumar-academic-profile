import "server-only";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "../supabase/config";
import type { createClient } from "../supabase/server";

export async function clearAdminSession(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) console.warn("Supabase sign-out failed; clearing the local session.");
  } catch {
    console.warn("Supabase sign-out unavailable; clearing the local session.");
  }
  // Also expire every chunk locally if remote revocation is unavailable.
  const { url } = getSupabaseConfig();
  const storageKey = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  const store = await cookies();
  for (const { name } of store.getAll()) {
    if (name === storageKey || name.startsWith(`${storageKey}.`) || name === `${storageKey}-code-verifier`) {
      store.set(name, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: url.startsWith("https:") });
    }
  }
}
