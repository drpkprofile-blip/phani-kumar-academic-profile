import "server-only";

import { createClient } from "../supabase/server";

// Call inside every future protected action/handler, not only a layout or proxy.
// RLS independently enforces the same authorization at the database boundary.
export async function requirePublicationsAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Authentication required.");
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_publications_admin");
  if (adminError || isAdmin !== true) {
    throw new Error("Publications admin access required.");
  }

  return { supabase, user };
}
