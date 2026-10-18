import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import { loadModule, compareProfile } from "./helpers/render-profile.mjs";

const section = (html) => html.match(/<section id="gallery".*?<\/section>/s)?.[0];
const helper = loadModule("lib/admin/gallery-form.ts");
const base = { publications: [], heroPublications: "43+" };

function form(values = {}) {
  const result = new FormData();
  for (const [key, value] of Object.entries({ description: "Conference workshop with students", id: "", updated_at: "", ...values })) result.set(key, value);
  return result;
}

function actionHarness({ denied = false, rpcError = null } = {}) {
  const calls = [];
  const redirect = (path) => { throw Object.assign(new Error("Redirect"), { path }); };
  const supabase = {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { storage_path: "gallery/old.jpg" }, error: null }) }) }) }),
    rpc: async (name, args) => { calls.push({ name, args }); return { data: name === "admin_delete_gallery_item" ? "gallery/old.jpg" : 12, error: rpcError }; },
    storage: { from: () => ({ upload: async () => ({ error: null }), remove: async (paths) => { calls.push({ remove: paths }); return { error: null }; } }) },
  };
  return {
    calls,
    ...loadModule("app/admin/gallery/actions.ts", {
      "../../../lib/auth/admin-page": { requireAdminPage: async () => {
        if (denied) redirect("/admin/login");
        return { supabase };
      } },
      "next/navigation": { redirect },
      "next/cache": { revalidatePath: () => {} },
    }),
  };
}

const redirected = (callback, path) => assert.rejects(callback, (error) => error.path === path);

test("gallery description is required and preserved as a caption", () => {
  assert.equal(helper.parseGalleryDescription(form({ description: "   " })), null);
  assert.deepEqual(helper.parseGalleryDescription(form({ description: " Conference with students " })), { description: "Conference with students" });
});

test("gallery upload accepts only matching JPEG, PNG, and WebP signatures within 8 MB", () => {
  const jpeg = new File([Uint8Array.from([0xff, 0xd8, 0xff, 0x00])], "x.jpg", { type: "image/jpeg" });
  const fake = new File(["not an image"], "x.jpg", { type: "image/jpeg" });
  assert.equal(helper.validGalleryImage(jpeg, new Uint8Array([0xff, 0xd8, 0xff, 0x00])), true);
  assert.equal(helper.validGalleryImage(fake, new Uint8Array(Buffer.from("not an image"))), false);
  assert.match(helper.galleryStoragePath(jpeg), /^gallery\/[0-9a-f-]+\.jpg$/);
});

test("all gallery mutations verify the allowlisted admin", async () => {
  const denied = actionHarness({ denied: true });
  await redirected(() => denied.saveGalleryItem(form()), "/admin/login");
  await redirected(() => denied.moveGalleryItem(form({ id: "1", order: "[1]", position: "1" })), "/admin/login");
  await redirected(() => denied.deleteGalleryItem(form({ id: "1", updated_at: "2026-10-01T00:00:00Z", confirmed: "yes" })), "/admin/login");
});

test("new gallery photos upload and save without a caller-controlled position", async () => {
  const action = actionHarness();
  const photo = new File([Uint8Array.from([0xff, 0xd8, 0xff, 0x00])], "photo.jpg", { type: "image/jpeg" });
  const data = form(); data.delete("id"); data.set("photo", photo); data.set("display_order", "1"); data.set("source_order", "1");
  await redirected(() => action.saveGalleryItem(data), "/admin/gallery?success=added");
  const call = action.calls.find((entry) => entry.name === "admin_save_gallery_item");
  assert.equal(call.args.p_description, "Conference workshop with students");
  assert.match(call.args.p_storage_path, /^gallery\/[0-9a-f-]+\.jpg$/);
  assert.equal("p_id" in call.args, false);
});

test("gallery edit preserves record position and replaces the old object only after saving", async () => {
  const action = actionHarness();
  const data = form({ id: "7", updated_at: "2026-10-01T00:00:00Z", display_order: "1", description: "Updated caption" });
  const photo = new File([Uint8Array.from([0xff, 0xd8, 0xff, 0x00])], "replacement.jpg", { type: "image/jpeg" }); data.set("photo", photo);
  await redirected(() => action.saveGalleryItem(data), "/admin/gallery?success=saved");
  const call = action.calls.find((entry) => entry.name === "admin_save_gallery_item");
  assert.equal(call.args.p_id, 7);
  assert.equal(call.args.p_expected_updated_at, "2026-10-01T00:00:00Z");
  assert.equal("display_order" in call.args, false);
  assert.deepEqual(action.calls.at(-1), { remove: ["gallery/old.jpg"] });
});

test("reorder is transactional through the complete snapshot RPC; delete requires confirmation", async () => {
  const action = actionHarness();
  await redirected(() => action.moveGalleryItem(form({ id: "2", order: "[1,2,3]", position: "1" })), "/admin/gallery?success=reordered");
  assert.deepEqual(action.calls[0], { name: "admin_move_gallery_item", args: { p_id: 2, p_position: 1, p_expected_order: [1, 2, 3] } });
  await redirected(() => action.deleteGalleryItem(form({ id: "2", updated_at: "2026-10-01T00:00:00Z" })), "/admin/gallery?error=confirmation");
  await redirected(() => action.deleteGalleryItem(form({ id: "2", updated_at: "2026-10-01T00:00:00Z", confirmed: "yes" })), "/admin/gallery?success=deleted");
  assert.ok(action.calls.some((entry) => entry.name === "admin_delete_gallery_item"));
});

test("gallery has no seeded photos and its migration grants public read but admin-only writes", () => {
  const migration = readFileSync(`${root}/supabase/migrations/20261006000400_public_gallery.sql`, "utf8");
  assert.match(migration, /create table public\.gallery_items/);
  assert.match(migration, /for select to anon, authenticated using \(true\)/);
  assert.match(migration, /is_publications_admin\(\)/);
  assert.match(migration, /unique \(display_order\) deferrable initially immediate/);
  assert.match(migration, /admin_move_gallery_item[\s\S]*?set constraints gallery_items_display_order_key deferred/);
  assert.doesNotMatch(migration.slice(0, migration.indexOf("create function public.admin_save_gallery_item")), /insert into public\.gallery_items/i);
  assert.match(readFileSync(`${root}/supabase/tests/gallery_authorization.sql`, "utf8"), /rollback/i);
  for (const path of ["app/admin/gallery/page.tsx", "app/admin/gallery/new/page.tsx", "app/admin/gallery/[id]/edit/page.tsx", "app/admin/gallery/[id]/delete/page.tsx"]) assert.ok(existsSync(`${root}/${path}`), path);
});

test("zero photos show a clean public empty state with no fake images", async () => {
  const html = section((await compareProfile(base, undefined, undefined, undefined, undefined, [], [], true, undefined, [], true)).current);
  assert.match(html, /class="gallery-empty-state" role="status">Photos will be added to the gallery soon\./);
  assert.equal((html.match(/class="gallery-card"/g) ?? []).length, 0);
});

test("temporary gallery cards render captions, image links, and ordered records", async () => {
  const items = [
    { id: 41, description: "First academic event", imageUrl: "https://images.example.test/first.jpg", displayOrder: 1 },
    { id: 42, description: "Second laboratory visit", imageUrl: "https://images.example.test/second.webp", displayOrder: 2 },
  ];
  const html = section((await compareProfile(base, undefined, undefined, undefined, undefined, [], [], true, undefined, items, true)).current);
  assert.equal((html.match(/class="gallery-card"/g) ?? []).length, 2);
  assert.ok(html.indexOf("First academic event") < html.indexOf("Second laboratory visit"));
  assert.match(html, /href="https:\/\/images\.example\.test\/first\.jpg"/);
  assert.match(html, /<figcaption>First academic event<\/figcaption>/);
  assert.doesNotMatch(html, /gallery-empty-state/);
});

test("public gallery reader orders by display position and maps public storage URLs", async () => {
  const previous = [process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY];
  process.env.NEXT_PUBLIC_SUPABASE_URL = "configured-test-url";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "configured-test-key";
  const calls = [];
  const client = {
    from(table) { calls.push(["from", table]); return { select(columns) { calls.push(["select", columns]); return { order: async (field, options) => {
      calls.push(["order", field, options]);
      return { data: [{ id: 2, description: "A caption", storage_path: "gallery/photo.jpg", source_order: null, display_order: 1, created_at: "2026-01-01", updated_at: "2026-01-01" }], error: null };
    } }; } }; },
    storage: { from(bucket) { calls.push(["bucket", bucket]); return { getPublicUrl(path) { return { data: { publicUrl: `https://cdn.example/${path}` } }; } }; } },
  };
  try {
    const { getPublicGalleryItems } = loadModule("lib/gallery.ts", { "./supabase/server": { createClient: async () => client } });
    const items = await getPublicGalleryItems();
    assert.deepEqual(items, [{ id: 2, description: "A caption", imageUrl: "https://cdn.example/gallery/photo.jpg", displayOrder: 1, updatedAt: "2026-01-01" }]);
    assert.deepEqual(calls.slice(0, 3), [["from", "gallery_items"], ["select", "*"], ["order", "display_order", { ascending: true }]]);
  } finally {
    if (previous[0] === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = previous[0];
    if (previous[1] === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previous[1];
  }
});

test("public gallery safely remains empty if its new table has not reached the schema cache", async () => {
  const previous = [process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY];
  process.env.NEXT_PUBLIC_SUPABASE_URL = "configured-test-url";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "configured-test-key";
  const client = { from: () => ({ select: () => ({ order: async () => ({ data: null, error: { code: "PGRST205" } }) }) }) };
  try {
    const { getPublicGalleryItems } = loadModule("lib/gallery.ts", { "./supabase/server": { createClient: async () => client } });
    assert.deepEqual(await getPublicGalleryItems(), []);
  } finally {
    if (previous[0] === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = previous[0];
    if (previous[1] === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previous[1];
  }
});\n