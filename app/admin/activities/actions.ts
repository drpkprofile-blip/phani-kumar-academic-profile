"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { positiveInteger } from "../../../lib/admin/publication-form";
import { parseActivityForm, type ActivityFormState } from "../../../lib/admin/activity-form";

function success(status: string): never {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  redirect(`/admin/activities?success=${status}`);
}

function failed(code?: string): never {
  redirect(`/admin/activities?error=${code === "P0001" ? "stale" : "operation"}`);
}

export async function saveActivity(_previous: ActivityFormState, form: FormData): Promise<ActivityFormState> {
  const { supabase } = await requireAdminPage();
  const categories = await supabase.from("activity_categories").select("label").order("display_order");
  if (categories.error || !categories.data) return { message: "Unable to load activity categories. Try again." };
  const parsed = parseActivityForm(form, categories.data.map(category => category.label));
  if (Object.keys(parsed.errors).length) return { message: "Please check the highlighted fields.", errors: parsed.errors, values: parsed.values };
  const rawId = form.get("id");
  const id = rawId === "" ? null : positiveInteger(rawId);
  const expected = form.get("updated_at");
  const timestamp = typeof expected === "string" ? expected : undefined;
  if ((rawId !== "" && id === null) || (id !== null && (!timestamp || !Number.isFinite(Date.parse(timestamp))))) {
    return { message: "Invalid record reference. Reload this page.", values: parsed.values };
  }
  const { error } = await supabase.rpc("admin_save_activity", {
    p_activity: parsed.data,
    ...(id === null ? {} : { p_id: id, p_expected_updated_at: timestamp }),
  });
  if (error) return { message: error.code === "P0001" ? "This activity changed or was removed. Reload before saving." : "Unable to save this activity. Please try again.", values: parsed.values };
  success(id === null ? "added" : "saved");
}

export async function deleteActivity(form: FormData) {
  const { supabase } = await requireAdminPage();
  const id = positiveInteger(form.get("id"));
  const expected = form.get("updated_at");
  if (!id || form.get("confirmed") !== "yes" || typeof expected !== "string" || !Number.isFinite(Date.parse(expected))) {
    redirect("/admin/activities?error=confirmation");
  }
  const { error } = await supabase.rpc("admin_delete_activity", { p_id: id, p_expected_updated_at: expected, p_confirmed: true });
  if (error) failed(error.code);
  success("deleted");
}

export async function moveActivity(form: FormData) {
  const { supabase } = await requireAdminPage();
  const id = positiveInteger(form.get("id"));
  let order: number[];
  try {
    order = JSON.parse(String(form.get("order")));
    if (!Array.isArray(order) || order.length === 0 || order.some((value) => !Number.isInteger(value) || value <= 0) || new Set(order).size !== order.length) throw new Error();
  } catch { redirect("/admin/activities?error=stale"); }
  const year = form.get("year");
  if (typeof year !== "string" || !/^\d{4}$/.test(year)) redirect("/admin/activities?error=position");
  const index = order.indexOf(id ?? -1);
  const direction = form.get("direction");
  const position = direction === "up" ? index : direction === "down" ? index + 2 : positiveInteger(form.get("position"));
  if (!id || index < 0 || !position || position < 1 || position > order.length) redirect("/admin/activities?error=position");
  const { error } = await supabase.rpc("admin_move_activity", { p_id: id, p_year: year, p_position: position, p_expected_order: order });
  if (error) failed(error.code);
  success("reordered");
}

