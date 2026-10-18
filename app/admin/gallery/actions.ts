"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { galleryStoragePath, parseGalleryDescription, positiveGalleryId, validGalleryImage, GALLERY_MAX_IMAGE_BYTES } from "../../../lib/admin/gallery-form";

function back(status: string): never {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  redirect(`/admin/gallery?${status.startsWith("error=") ? status : `success=${status}`}`);
}

export async function saveGalleryItem(form: FormData): Promise<void> {
  const { supabase } = await requireAdminPage();
  const values = parseGalleryDescription(form);
  const rawId = form.get("id");
  const id = rawId === null || rawId === "" ? null : positiveGalleryId(rawId);
  const updatedAt = form.get("updated_at");
  const formRoute = id === null ? "/admin/gallery/new" : `/admin/gallery/${id}/edit`;
  if (!values) redirect(`${formRoute}?error=description`);
  if ((rawId !== null && rawId !== "" && id === null) || (id !== null && (typeof updatedAt !== "string" || !Number.isFinite(Date.parse(updatedAt))))) redirect("/admin/gallery?error=stale");

  const { data: previous, error: lookupError } = id === null
    ? { data: null, error: null }
    : await supabase.from("gallery_items").select("storage_path").eq("id", id).maybeSingle();
  if (lookupError || (id !== null && !previous)) redirect("/admin/gallery?error=stale");

  const fileValue = form.get("photo");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  if (id === null && !file) redirect("/admin/gallery/new?error=photo");
  let storagePath = previous?.storage_path ?? "";
  let uploadedPath: string | null = null;
  if (file) {
    if (file.size > GALLERY_MAX_IMAGE_BYTES) redirect(`${formRoute}?error=size`);
    const candidate = galleryStoragePath(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!candidate || !validGalleryImage(file, bytes)) redirect(`${formRoute}?error=photo`);
    const { error } = await supabase.storage.from("profile-assets").upload(candidate, bytes, {
      contentType: file.type, cacheControl: "31536000", upsert: false,
    });
    if (error) redirect("/admin/gallery?error=upload");
    storagePath = candidate;
    uploadedPath = candidate;
  }

  const { error } = await supabase.rpc("admin_save_gallery_item", {
    p_description: values.description,
    p_storage_path: storagePath,
    ...(id === null ? {} : { p_id: id, p_expected_updated_at: updatedAt as string }),
  });
  if (error) {
    if (uploadedPath) await supabase.storage.from("profile-assets").remove([uploadedPath]);
    back(error.code === "P0001" ? "error=stale" : "error=save");
  }
  if (uploadedPath && previous?.storage_path) await supabase.storage.from("profile-assets").remove([previous.storage_path]);
  back(id === null ? "added" : "saved");
}

export async function deleteGalleryItem(form: FormData): Promise<void> {
  const { supabase } = await requireAdminPage();
  const id = positiveGalleryId(form.get("id"));
  const updatedAt = form.get("updated_at");
  if (!id || form.get("confirmed") !== "yes" || typeof updatedAt !== "string" || !Number.isFinite(Date.parse(updatedAt))) back("error=confirmation");
  const { data: path, error } = await supabase.rpc("admin_delete_gallery_item", { p_id: id, p_expected_updated_at: updatedAt, p_confirmed: true });
  if (error || !path) back(error?.code === "P0001" ? "error=stale" : "error=delete");
  const { error: storageError } = await supabase.storage.from("profile-assets").remove([path]);
  if (storageError) back("error=storage-cleanup");
  back("deleted");
}

export async function moveGalleryItem(form: FormData): Promise<void> {
  const { supabase } = await requireAdminPage();
  const id = positiveGalleryId(form.get("id"));
  let order: number[];
  try {
    order = JSON.parse(String(form.get("order")));
    if (!Array.isArray(order) || !order.length || order.some((value) => !Number.isSafeInteger(value) || value <= 0) || new Set(order).size !== order.length) throw new Error();
  } catch { back("error=stale"); }
  const index = order.indexOf(id ?? -1);
  const direction = form.get("direction");
  const rawPosition = form.get("position");
  const position = direction === "up" ? index : direction === "down" ? index + 2 : typeof rawPosition === "string" && /^[1-9]\d*$/.test(rawPosition) ? Number(rawPosition) : NaN;
  if (!id || index < 0 || !Number.isSafeInteger(position) || position < 1 || position > order.length) back("error=position");
  const { error } = await supabase.rpc("admin_move_gallery_item", { p_id: id, p_position: position, p_expected_order: order });
  if (error) back(error.code === "P0001" ? "error=stale" : "error=reorder");
  back("reordered");
}
