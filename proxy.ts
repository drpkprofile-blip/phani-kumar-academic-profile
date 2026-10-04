import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only future authentication/admin routes; public pages and assets are excluded.
export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
