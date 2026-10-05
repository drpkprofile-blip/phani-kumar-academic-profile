"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { parseProjectGuidedForm, positiveProjectGuidedInteger, type ProjectGuidedFormState } from "../../../lib/admin/project-guided-form";

function success(status: string): never {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  redirect(`/admin/projects-guided?success=${status}`);
}

export async function saveProjectGuided(_previous: ProjectGuidedFormState, form: FormData): Promise<ProjectGuidedFormState> {
  const { supabase } = await requireAdminPage();
  const parsed = parseProjectGuidedForm(form);
  if (Object.keys(parsed.errors).length) return { message: "Please check the highlighted fields.", errors: parsed.errors, values: parsed.values };
  const rawId = form.get("id");
  const id = rawId === "" ? null : positiveProjectGuidedInteger(rawId);
  const expected = form.get("updated_at");
  const timestamp = typeof expected === "string" ? expected : undefined;
  if ((rawId !== "" && id === null) || (id !== null && (!timestamp || !Number.isFinite(Date.parse(timestamp))))) {
    return { message: "Invalid record reference. Reload this page.", values: parsed.values };
  }
  const { error } = await supabase.rpc("admin_save_project_guided", {
    p_project: parsed.data,
    ...(id === null ? {} : { p_id: id, p_expected_updated_at: timestamp }),
  });
  if (error) return { message: error.code === "P0001" ? "This project changed or was removed. Reload before saving." : "Unable to save this project. Please try again.", values: parsed.values };
  success(id === null ? "added" : "saved");
}

export async function deleteProjectGuided(form: FormData) {
  const { supabase } = await requireAdminPage();
  const id = positiveProjectGuidedInteger(form.get("id"));
  const expected = form.get("updated_at");
  if (!id || form.get("confirmed") !== "yes" || typeof expected !== "string" || !Number.isFinite(Date.parse(expected))) {
    redirect("/admin/projects-guided?error=confirmation");
  }
  const { error } = await supabase.rpc("admin_delete_project_guided", { p_id: id, p_expected_updated_at: expected, p_confirmed: true });
  if (error) redirect(`/admin/projects-guided?error=${error.code === "P0001" ? "stale" : "operation"}`);
  success("deleted");
}

export async function moveProjectGuided(form: FormData) {
  const { supabase } = await requireAdminPage();
  const id = positiveProjectGuidedInteger(form.get("id"));
  let order: number[];
  try {
    order = JSON.parse(String(form.get("order")));
    if (!Array.isArray(order) || !order.length || order.some((value) => !Number.isInteger(value) || value <= 0) || new Set(order).size !== order.length) throw new Error();
  } catch {
    redirect("/admin/projects-guided?error=stale");
  }
  const index = order.indexOf(id ?? -1);
  const direction = form.get("direction");
  const position = direction === "up" ? index : direction === "down" ? index + 2 : positiveProjectGuidedInteger(form.get("position"));
  if (!id || index < 0 || !position || position < 1 || position > order.length) redirect("/admin/projects-guided?error=position");
  const { error } = await supabase.rpc("admin_move_project_guided", { p_id: id, p_position: position, p_expected_order: order });
  if (error) redirect(`/admin/projects-guided?error=${error.code === "P0001" ? "stale" : "operation"}`);
  success("reordered");
}
