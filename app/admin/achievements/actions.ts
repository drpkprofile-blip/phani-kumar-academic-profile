"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { parseAchievementForm, positiveInteger, type AchievementFormState } from "../../../lib/admin/achievement-form";

function success(status: string): never {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  redirect(`/admin/achievements?success=${status}`);
}

function failed(code?: string): never {
  redirect(`/admin/achievements?error=${code === "P0001" ? "stale" : "operation"}`);
}

export async function saveAchievement(_previous: AchievementFormState, form: FormData): Promise<AchievementFormState> {
  const { supabase } = await requireAdminPage();
  const parsed = parseAchievementForm(form);
  if (Object.keys(parsed.errors).length) {
    return { message: "Please check the highlighted fields.", errors: parsed.errors, values: parsed.values };
  }

  const rawId = form.get("id");
  const id = rawId === "" ? null : positiveInteger(rawId);
  const expected = form.get("updated_at");
  const timestamp = typeof expected === "string" ? expected : undefined;
  if ((rawId !== "" && id === null) || (id !== null && (!timestamp || !Number.isFinite(Date.parse(timestamp))))
    || (id === null && rawId !== "")) {
    return { message: "Invalid record reference. Reload this page.", values: parsed.values };
  }

  const { error } = await supabase.rpc("admin_save_achievement", {
    p_achievement: parsed.data,
    ...(id === null ? {} : { p_id: id, p_expected_updated_at: timestamp }),
  });
  if (error) {
    return {
      message: error.code === "P0001" ? "This achievement changed or was removed. Reload before saving." : "Unable to save this achievement. Please try again.",
      values: parsed.values,
    };
  }
  success(id === null ? "added" : "saved");
}

export async function deleteAchievement(form: FormData) {
  const { supabase } = await requireAdminPage();
  const id = positiveInteger(form.get("id"));
  const expected = form.get("updated_at");
  if (!id || form.get("confirmed") !== "yes" || typeof expected !== "string" || !Number.isFinite(Date.parse(expected))) {
    redirect("/admin/achievements?error=confirmation");
  }
  const { error } = await supabase.rpc("admin_delete_achievement", {
    p_id: id, p_expected_updated_at: expected, p_confirmed: true,
  });
  if (error) failed(error.code);
  success("deleted");
}

export async function moveAchievement(form: FormData) {
  const { supabase } = await requireAdminPage();
  const id = positiveInteger(form.get("id"));
  let order: number[];
  try {
    order = JSON.parse(String(form.get("order")));
    if (!Array.isArray(order) || order.length === 0
      || order.some((value) => !Number.isInteger(value) || value <= 0)
      || new Set(order).size !== order.length) throw new Error();
  } catch {
    redirect("/admin/achievements?error=stale");
  }
  const index = order.indexOf(id ?? -1);
  const direction = form.get("direction");
  const position = direction === "up" ? index : direction === "down" ? index + 2 : positiveInteger(form.get("position"));
  if (!id || index < 0 || !position || position < 1 || position > order.length) {
    redirect("/admin/achievements?error=position");
  }
  const { error } = await supabase.rpc("admin_move_achievement", {
    p_id: id, p_position: position, p_expected_order: order,
  });
  if (error) failed(error.code);
  success("reordered");
}
