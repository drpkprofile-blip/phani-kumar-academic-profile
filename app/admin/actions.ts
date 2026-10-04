"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { AdminAccessError, requirePublicationsAdmin } from "../../lib/auth/admin";
import { clearAdminSession } from "../../lib/auth/logout";

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" || !password || password.length > 4096) {
    redirect("/admin/login?error=credentials");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/admin/login?error=unavailable");
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) redirect("/admin/login?error=credentials");

  let denied = false;
  try {
    await requirePublicationsAdmin(supabase);
  } catch (error) {
    await clearAdminSession(supabase);
    if (!(error instanceof AdminAccessError)) throw error;
    denied = true;
  }
  if (denied) redirect("/admin/login?error=denied");
  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await clearAdminSession(supabase);
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
