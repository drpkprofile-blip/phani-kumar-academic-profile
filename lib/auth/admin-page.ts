import "server-only";
import { redirect } from "next/navigation";
import { AdminAccessError, requirePublicationsAdmin } from "./admin";

export async function requireAdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/admin/login?error=unavailable");
  }
  try {
    return await requirePublicationsAdmin();
  } catch (error) {
    if (!(error instanceof AdminAccessError)) throw error;
    redirect(error.reason === "anonymous" ? "/admin/login" : "/admin/login?error=denied");
  }
}
