import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/render-profile.mjs";

function reader(result) {
  const calls = [];
  const client = { from(table) {
    calls.push(["from", table]);
    return { select(columns) {
      calls.push(["select", columns]);
      return { order(field, options) {
        calls.push(["order", field, options]);
        return Promise.resolve(result);
      } };
    } };
  } };
  return { ...loadModule("lib/subjects-taught.ts", { "./supabase/server": { createClient: async () => client } }), calls };
}

async function withConfiguration(callback) {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const prior = names.map((name) => process.env[name]);
  names.forEach((name) => { process.env[name] = "configured-test-value"; });
  try { await callback(); } finally {
    names.forEach((name, index) => prior[index] === undefined ? delete process.env[name] : process.env[name] = prior[index]);
  }
}

const row = {
  id: 18, subject_name: "Heat Transfer", course_code: "ME401", program: "B.Tech", branch: "Mechanical",
  semester: "VII", academic_year: "2026-27", subject_type: "Theory", proof_url: "https://example.test/proof?keep=1",
  source_order: null, display_order: 2, created_at: "2026-10-05T00:00:00Z", updated_at: "2026-10-05T00:00:00Z",
};

test("configured public reader orders strictly by display_order and maps all fields", async () => {
  await withConfiguration(async () => {
    const helper = reader({ data: [row], error: null });
    assert.deepEqual(await helper.getPublicSubjectsTaught(), [{
      id: 18, displayOrder: 2, subjectName: "Heat Transfer", courseCode: "ME401", program: "B.Tech",
      branch: "Mechanical", semester: "VII", academicYear: "2026-27", subjectType: "Theory",
      proofUrl: "https://example.test/proof?keep=1",
    }]);
    assert.deepEqual(helper.calls, [["from", "subjects_taught"], ["select", "*"], ["order", "display_order", { ascending: true }]]);
  });
});

test("database NULL values become undefined and read failures remain visible", async () => {
  await withConfiguration(async () => {
    const helper = reader({ data: [Object.fromEntries(Object.entries(row).map(([key, value]) => [key,
      ["course_code", "program", "branch", "semester", "academic_year", "subject_type", "proof_url"].includes(key) ? null : value]))], error: null });
    const [mapped] = await helper.getPublicSubjectsTaught();
    for (const key of ["courseCode", "program", "branch", "semester", "academicYear", "subjectType", "proofUrl"]) assert.equal(mapped[key], undefined);
    await assert.rejects(reader({ data: null, error: new Error("unavailable") }).getPublicSubjectsTaught(), /Unable to read public Subjects Taught/);
  });
});

test("missing Supabase configuration returns the zero-row empty state without creating a client", async () => {
  await withConfiguration(async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const helper = reader({ data: [], error: null });
    assert.deepEqual(await helper.getPublicSubjectsTaught(), []);
    assert.deepEqual(helper.calls, []);
  });
});
