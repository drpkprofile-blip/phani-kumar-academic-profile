"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { parsePublicationForm, positiveInteger, type PublicationFormState } from "../../../lib/admin/publication-form";

function success(status: string): never {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  redirect(`/admin?success=${status}`);
}

function failed(code?: string): never {
  redirect(`/admin?error=${code === "P0001" ? "stale" : "operation"}`);
}

export async function savePublication(_previous: PublicationFormState, form: FormData): Promise<PublicationFormState> {
  const { supabase } = await requireAdminPage();
  const parsed = parsePublicationForm(form);
  if (Object.keys(parsed.errors).length) return { message: "Please check the highlighted fields.", errors: parsed.errors, values: parsed.values };
  const rawId = form.get("id");
  const id = rawId === "" ? null : positiveInteger(rawId);
  const expected = form.get("updated_at");
  const timestamp = typeof expected === "string" ? expected : undefined;
  if ((rawId !== "" && id === null) || (id !== null && (!timestamp || !Number.isFinite(Date.parse(timestamp))))) {
    return { message: "Invalid record reference. Reload this page.", values: parsed.values };
  }
  const { error } = await supabase.rpc("admin_save_publication", {
    p_publication: parsed.data,
    ...(id === null ? {} : { p_id: id, p_expected_updated_at: timestamp }),
  });
  if (error) return { message: error.code === "P0001" ? "This publication changed or was removed. Reload before saving." : "Unable to save this publication. Please try again.", values: parsed.values };
  success(id === null ? "added" : "saved");
}

export async function deletePublication(form: FormData) {
  const { supabase } = await requireAdminPage();
  const id = positiveInteger(form.get("id"));
  const expected = form.get("updated_at");
  if (!id || form.get("confirmed") !== "yes" || typeof expected !== "string" || !Number.isFinite(Date.parse(expected))) {
    redirect("/admin?error=confirmation");
  }
  const { error } = await supabase.rpc("admin_delete_publication", { p_id: id, p_expected_updated_at: expected, p_confirmed: true });
  if (error) failed(error.code);
  success("deleted");
}

export async function movePublication(form: FormData) {
  const { supabase } = await requireAdminPage();
  const id = positiveInteger(form.get("id"));
  let order: number[];
  try {
    order = JSON.parse(String(form.get("order")));
    if (!Array.isArray(order) || order.length === 0 || order.some((value) => !Number.isInteger(value) || value <= 0) || new Set(order).size !== order.length) throw new Error();
  } catch { redirect("/admin?error=stale"); }
  const index = order.indexOf(id ?? -1);
  const direction = form.get("direction");
  const position = direction === "up" ? index : direction === "down" ? index + 2 : positiveInteger(form.get("position"));
  if (!id || index < 0 || !position || position < 1 || position > order.length) redirect("/admin?error=position");
  const { error } = await supabase.rpc("admin_move_publication", { p_id: id, p_position: position, p_expected_order: order });
  if (error) failed(error.code);
  success("reordered");
}

export async function updateHeroCounter(form: FormData) {
  const { supabase } = await requireAdminPage();
  const value = form.get("hero_publications");
  const expected = form.get("previous_counter");
  if (typeof value !== "string" || !value.trim() || value.length > 64 || typeof expected !== "string") redirect("/admin?error=counter");
  const { data, error } = await supabase.from("publication_settings").update({ hero_publications: value }).eq("id", true).eq("hero_publications", expected).select("hero_publications").single();
  if (error || !data) failed(error?.code === "PGRST116" ? "P0001" : error?.code);
  success("counter");
}
