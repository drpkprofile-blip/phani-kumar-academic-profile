import { getPublicProfileSettings } from "../../../lib/profile-settings";
import { loadResumeImages } from "../../../lib/resume/media";
import { renderJournalBioDocx } from "../../../lib/journal-bio/docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getPublicProfileSettings();
    const { profilePhoto } = await loadResumeImages(settings.profile);
    const document = await renderJournalBioDocx(settings, profilePhoto);
    return new Response(new Uint8Array(document), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="Phani-Kumar-Simhadri-Journal-Biography.docx"',
        "Cache-Control": "public, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[journal-bio] generation failed", error);
    return new Response("Unable to generate the journal biography right now.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
