"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { parsePatentForm, positivePatentId, type PatentFormState } from "../../../lib/admin/patent-form";

function success(status: string): never {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  redirect(`/admin/patents?success=${status}`);
}

export async function savePatent(_previous: PatentFormState, form: FormData): Promise<PatentFormState> {
  const { supabase } = await requireAdminPage();
  const parsed = parsePatentForm(form);
  if (Object.keys(parsed.errors).length) {
    return { message: "Please check the highlighted fields.", errors: parsed.errors, values: parsed.values };
  }

  const rawId = form.get("id");
  const id = rawId === "" ? null : positivePatentId(rawId);
  const expected = form.get("updated_at");
  const timestamp = typeof expected === "string" ? expected : undefined;
  if ((rawId !== "" && id === null) || (id !== null && (!timestamp || !Number.isFinite(Date.parse(timestamp))))) {
    return { message: "Invalid record reference. Reload this page.", values: parsed.values };
  }

  const { error } = await supabase.rpc("admin_save_patent", {
    p_patent: parsed.data,
    ...(id === null ? {} : { p_id: id, p_expected_updated_at: timestamp }),
  });
  if (error) {
    return {
      message: error.code === "P0001"
        ? "This patent changed or was removed. Reload before saving."
        : error.code === "23505" ? "That application number already exists."
          : "Unable to save this patent. Please check the details and try again.",
      values: parsed.values,
    };
  }
  success(id === null ? "added" : "saved");
}

export async function deletePatent(form: FormData) {
  const { supabase } = await requireAdminPage();
  const id = positivePatentId(form.get("id"));
  const expected = form.get("updated_at");
  if (!id || form.get("confirmed") !== "yes" || typeof expected !== "string" || !Number.isFinite(Date.parse(expected))) {
    redirect("/admin/patents?error=confirmation");
  }
  const { error } = await supabase.rpc("admin_delete_patent", {
    p_id: id, p_expected_updated_at: expected, p_confirmed: true,
  });
  if (error) redirect(`/admin/patents?error=${error.code === "P0001" ? "stale" : "operation"}`);
  success("deleted");
}
