import { recordProfileVisit } from "../../../lib/profile-visits";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }

  try {
    const count = await recordProfileVisit();
    return Response.json({ count }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Profile visit count is not available" }, { status: 503 });
  }
}
