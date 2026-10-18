import { AdminAccessError, requirePublicationsAdmin } from "../../../../lib/auth/admin";
import { renderResumePdf } from "../../../../lib/resume/pdf";
import { loadResumeModel } from "../../../../lib/resume/data";
import { loadResumeImages } from "../../../../lib/resume/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePublicationsAdmin();

    const model = await loadResumeModel();
    const images = await loadResumeImages(model.profile);
    const pdf = await renderResumePdf(model, images);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Phani-Kumar-Simhadri-Academic-CV.pdf"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Vary": "Cookie",
      },
    });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return new Response("Administrator access required.", {
        status: error.reason === "anonymous" ? 401 : 403,
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    return new Response("Unable to generate the resume right now.", {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
