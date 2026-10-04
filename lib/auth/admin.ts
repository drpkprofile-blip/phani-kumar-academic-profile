import "server-only";

import { createClient } from "../supabase/server";

// Call inside every future protected action/handler, not only a layout or proxy.
// RLS independently enforces the same authorization at the database boundary.
export class AdminAccessError extends Error {
  constructor(public readonly reason: "anonymous" | "denied") {
    super(reason === "anonymous" ? "Authentication required." : "Publications admin access required.");
  }
}

export async function requirePublicationsAdmin(client?: Awaited<ReturnType<typeof createClient>>) {
  const supabase = client ?? await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new AdminAccessError("anonymous");
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_publications_admin");
  if (adminError || isAdmin !== true) {
    throw new AdminAccessError("denied");
  }

  return { supabase, user };
}
