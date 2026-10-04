import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import nextTesting from "next/experimental/testing/server.js";
// The installed 16.3.3 testing export retains the middleware name.
const { unstable_doesMiddlewareMatch } = nextTesting;

// Exercise the real helpers with isolated Auth/RPC doubles; no project or
// credentials are needed and no network requests are made.
function loadHelper(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  }).outputText;
  const exports = {};
  new Function("exports", "require", compiled)(exports, (name) => {
    if (name === "server-only") return {};
    if (name in dependencies) return dependencies[name];
    throw new Error(`Unexpected dependency: ${name}`);
  });
  return exports;
}

test("configuration fails safely without values and rejects privileged keys", () => {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const previous = names.map((name) => process.env[name]);
  const { getSupabaseConfig } = loadHelper("../lib/supabase/config.ts");
  try {
    names.forEach((name) => delete process.env[name]);
    assert.throws(getSupabaseConfig, /not configured/);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_secret_test_not_a_real_key";
    assert.throws(getSupabaseConfig, /publishable key/);
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_not_a_real_key";
    assert.equal(getSupabaseConfig().url, "https://example.supabase.co");
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://example.supabase.co";
    assert.throws(getSupabaseConfig, /HTTPS/);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://user:password@example.supabase.co";
    assert.throws(getSupabaseConfig, /credentials/);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    assert.equal(getSupabaseConfig().url, "http://127.0.0.1:54321");
  } finally {
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
});

function authorization(userResult, adminResult) {
  let rpcCalls = 0;
  const supabase = {
    auth: { getUser: async () => userResult },
    rpc: async (name) => {
      assert.equal(name, "is_publications_admin");
      rpcCalls++;
      return adminResult;
    },
  };
  const { requirePublicationsAdmin } = loadHelper("../lib/auth/admin.ts", {
    "../supabase/server": { createClient: async () => supabase },
  });
  return { requirePublicationsAdmin, supabase, rpcCalls: () => rpcCalls };
}

test("signed-out or invalid users cannot reach the admin membership check", async () => {
  for (const result of [
    { data: { user: null }, error: null },
    { data: { user: { id: "test-user" } }, error: new Error("Invalid session") },
  ]) {
    const helper = authorization(result, { data: true, error: null });
    await assert.rejects(helper.requirePublicationsAdmin, /Authentication required/);
    assert.equal(helper.rpcCalls(), 0);
  }
});

test("metadata cannot promote a user; membership errors fail closed", async () => {
  const user = { id: "test-user", user_metadata: { admin: true } };
  for (const adminResult of [
    { data: false, error: null },
    { data: null, error: null },
    { data: true, error: new Error("Database unavailable") },
  ]) {
    const helper = authorization({ data: { user }, error: null }, adminResult);
    await assert.rejects(helper.requirePublicationsAdmin, /admin access required/);
  }
});

test("only verified user plus positive live membership grants access", async () => {
  const user = { id: "test-admin" };
  const helper = authorization({ data: { user }, error: null }, { data: true, error: null });
  const result = await helper.requirePublicationsAdmin();
  assert.equal(result.user, user);
  assert.equal(result.supabase, helper.supabase);
  assert.equal(helper.rpcCalls(), 1);
});

test("session proxy excludes the existing public website and assets", () => {
  const { config } = loadHelper("../proxy.ts", {
    "./lib/supabase/proxy": { updateSession: async () => {} },
  });
  for (const url of ["/", "/google-scholar-citations.jpg", "/phani-photo.png", "/_next/static/test.js"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), false);
  }
  for (const url of ["/admin", "/admin/publications", "/auth/callback"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), true);
  }
});
