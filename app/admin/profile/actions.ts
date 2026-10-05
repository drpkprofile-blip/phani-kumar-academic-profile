"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { parseProfileSettingsForm, profileSettingsToRow, type ProfileSettingsErrors, type ProfileSettingsValues } from "../../../lib/admin/profile-settings-form";

export type ProfileFormState = { message?: string; errors?: ProfileSettingsErrors; values?: ProfileSettingsValues };

export async function saveProfileSettings(_previous: ProfileFormState, form: FormData): Promise<ProfileFormState> {
  const { supabase } = await requireAdminPage();
  const parsed = parseProfileSettingsForm(form);
  if (Object.keys(parsed.errors).length) return { message: "Please check the highlighted fields.", errors: parsed.errors, values: parsed.values };
  const { error } = await supabase.from("profile_settings").update(profileSettingsToRow(parsed.values)).eq("singleton", true);
  if (error) return { message: "Unable to save profile settings. Please reload and try again.", values: parsed.values };
  revalidatePath("/");
  revalidatePath("/admin/profile");
  redirect("/admin/profile?success=saved");
}

function validImage(file: File, bytes: Uint8Array): boolean {
  const png = file.type === "image/png" && bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const jpeg = file.type === "image/jpeg" && bytes.length >= 3
    && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = file.type === "image/webp" && bytes.length >= 12
    && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF"
    && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  return png || jpeg || webp;
}

export async function uploadProfilePhoto(form: FormData): Promise<void> {
  const { supabase } = await requireAdminPage();
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0 || file.size > 8 * 1024 * 1024
    || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    redirect("/admin/profile?photo=invalid");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validImage(file, bytes)) redirect("/admin/profile?photo=invalid");
  const { error: uploadError } = await supabase.storage.from("profile-assets").upload("profile/profile-photo", bytes, {
    contentType: file.type, cacheControl: "0", upsert: true,
  });
  if (uploadError) redirect("/admin/profile?photo=error");
  const { data } = supabase.storage.from("profile-assets").getPublicUrl("profile/profile-photo");
  const photoUrl = `${data.publicUrl}?v=${Date.now()}`;
  const { error: updateError } = await supabase.from("profile_settings").update({ photo_url: photoUrl }).eq("singleton", true);
  if (updateError) redirect("/admin/profile?photo=error");
  revalidatePath("/");
  revalidatePath("/admin/profile");
  redirect("/admin/profile?photo=saved");
}
