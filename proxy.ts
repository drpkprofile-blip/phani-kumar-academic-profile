import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Authentication/admin routes only; public pages and assets are excluded.
export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
