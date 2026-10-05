"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import {
  nonNegativeReviewCount,
  parsePeerReviewForm,
  positivePeerReviewInteger,
  type PeerReviewFormState,
} from "../../../lib/admin/peer-review-form";

function success(status: string): never {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  redirect(`/admin/peer-reviews?success=${status}`);
}

function failed(code?: string): never {
  redirect(`/admin/peer-reviews?error=${code === "P0001" ? "stale" : "operation"}`);
}

export async function savePeerReview(_previous: PeerReviewFormState, form: FormData): Promise<PeerReviewFormState> {
  const { supabase } = await requireAdminPage();
  const parsed = parsePeerReviewForm(form);
  if (Object.keys(parsed.errors ?? {}).length) {
    return { message: "Please check the review text.", errors: parsed.errors, values: parsed.values };
  }
  const rawId = form.get("id");
  const id = rawId === "" ? null : positivePeerReviewInteger(rawId);
  const expected = form.get("updated_at");
  const timestamp = typeof expected === "string" ? expected : undefined;
  if ((rawId !== "" && id === null) || (id !== null && (!timestamp || !Number.isFinite(Date.parse(timestamp))))) {
    return { message: "Invalid record reference. Reload this page.", values: parsed.values };
  }
  const { error } = await supabase.rpc("admin_save_peer_review", {
    p_review_text: parsed.data.review_text,
    ...(id === null ? {} : { p_id: id, p_expected_updated_at: timestamp }),
  });
  if (error) return {
    message: error.code === "P0001" ? "This review changed or was removed. Reload before saving." : "Unable to save this review. Please try again.",
    values: parsed.values,
  };
  success(id === null ? "added" : "saved");
}

export async function deletePeerReview(form: FormData) {
  const { supabase } = await requireAdminPage();
  const id = positivePeerReviewInteger(form.get("id"));
  const expected = form.get("updated_at");
  if (!id || form.get("confirmed") !== "yes" || typeof expected !== "string" || !Number.isFinite(Date.parse(expected))) {
    redirect("/admin/peer-reviews?error=confirmation");
  }
  const { error } = await supabase.rpc("admin_delete_peer_review", {
    p_id: id, p_expected_updated_at: expected, p_confirmed: true,
  });
  if (error) failed(error.code);
  success("deleted");
}

export async function movePeerReview(form: FormData) {
  const { supabase } = await requireAdminPage();
  const id = positivePeerReviewInteger(form.get("id"));
  let order: number[];
  try {
    order = JSON.parse(String(form.get("order")));
    if (!Array.isArray(order) || order.length === 0
      || order.some((value) => !Number.isInteger(value) || value <= 0)
      || new Set(order).size !== order.length) throw new Error();
  } catch {
    redirect("/admin/peer-reviews?error=stale");
  }
  const index = order.indexOf(id ?? -1);
  const direction = form.get("direction");
  const position = direction === "up" ? index : direction === "down" ? index + 2 : positivePeerReviewInteger(form.get("position"));
  if (!id || index < 0 || !position || position < 1 || position > order.length) {
    redirect("/admin/peer-reviews?error=position");
  }
  const { error } = await supabase.rpc("admin_move_peer_review", {
    p_id: id, p_position: position, p_expected_order: order,
  });
  if (error) failed(error.code);
  success("reordered");
}

export async function updatePeerReviewSettings(form: FormData) {
  const { supabase } = await requireAdminPage();
  const heroCounter = form.get("hero_counter_text");
  const completedCount = nonNegativeReviewCount(form.get("completed_reviews_count"));
  const expected = form.get("updated_at");
  if (typeof heroCounter !== "string" || !heroCounter.trim() || [...heroCounter].length > 64 || completedCount === null) {
    redirect("/admin/peer-reviews?error=counter");
  }
  if (typeof expected !== "string" || !Number.isFinite(Date.parse(expected))) {
    redirect("/admin/peer-reviews?error=stale");
  }
  const { error } = await supabase.rpc("admin_update_peer_review_settings", {
    p_hero_counter_text: heroCounter,
    p_completed_reviews_count: completedCount,
    p_expected_updated_at: expected,
  });
  if (error) failed(error.code);
  success("settings");
}
