import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { loadModule } from "./helpers/render-profile.mjs";
import { root } from "../scripts/publication-seed.mjs";

function redirect(path) { throw Object.assign(new Error("Redirect"), { path }); }
const expectRedirect = (action, path) => assert.rejects(action, (error) => error.path === path);

async function configured(callback) {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const previous = names.map((name) => process.env[name]);
  process.env[names[0]] = "https://test-project.supabase.co";
  process.env[names[1]] = "sb_publishable_test";
  try { await callback(); } finally { names.forEach((name,i) => { if (previous[i] === undefined) delete process.env[name]; else process.env[name] = previous[i]; }); }
}

function session({ admin = false, signedIn = false, authFailure = false, rpcFailure = false, logoutFailure = false } = {}) {
  const cookieName = "sb-test-project-auth-token.0";
  const jar = new Map([["unrelated-cookie", "keep"]]);
  if (signedIn) jar.set(cookieName, "test-session");
  const expired = [];
  let signInCalls = 0;
  const client = {
    auth: {
      getUser: async () => ({ data: { user: jar.has(cookieName) ? { id: "test-uuid", email: "admin@example.com", user_metadata: { admin: true } } : null }, error: null }),
      signInWithPassword: async ({ email, password }) => {
        signInCalls++;
        assert.equal(email, "admin@example.com");
        assert.equal(password, " test-input-only ", "Password must not be trimmed");
        if (authFailure) return { error: {} };
        jar.set(cookieName, "test-session");
        return { error: null };
      },
      signOut: async (options) => {
        assert.deepEqual(options, { scope: "local" });
        // Leave cookies for the actual local expiration helper to clear.
        if (logoutFailure) throw new Error("Test network failure");
        return { error: null };
      },
    },
    rpc: async (name) => { assert.equal(name, "is_publications_admin"); return { data: admin, error: rpcFailure ? {} : null }; },
  };
  const authorization = loadModule("lib/auth/admin.ts", { "../supabase/server": { createClient: async () => client } });
  const clearing = loadModule("lib/auth/logout.ts", {
    "next/headers": { cookies: async () => ({
      getAll: () => [...jar.keys()].map((name) => ({ name })),
      set: (name, value, options) => {
        assert.equal(value, ""); assert.equal(options.maxAge, 0);
        assert.equal(options.httpOnly, true); assert.equal(options.sameSite, "lax");
        expired.push(name); jar.delete(name);
      },
    }) },
  });
  const guard = loadModule("lib/auth/admin-page.ts", { "./admin": authorization, "next/navigation": { redirect } });
  const actions = loadModule("app/admin/actions.ts", {
    "../../lib/supabase/server": { createClient: async () => client },
    "../../lib/auth/admin": authorization,
    "../../lib/auth/logout": clearing,
    "next/navigation": { redirect },
    "next/cache": { revalidatePath: (path, type) => { assert.equal(path, "/admin"); assert.equal(type, "layout"); } },
  });
  return { ...guard, ...actions, jar, expired, signInCalls: () => signInCalls };
}

function credentials() {
  const data = new FormData();
  data.set("email", " admin@example.com ");
  data.set("password", " test-input-only ");
  return data;
}

test("anonymous dashboard access redirects to login", async () => configured(async () => {
  await expectRedirect(session().requireAdminPage, "/admin/login");
}));

test("authenticated non-admin and membership errors deny dashboard access", async () => configured(async () => {
  for (const options of [{ signedIn: true }, { signedIn: true, admin: true, rpcFailure: true }]) {
    await expectRedirect(session(options).requireAdminPage, "/admin/login?error=denied");
  }
}));

test("allowlisted admin accepted after password login and fresh server checks", async () => configured(async () => {
  const helper = session({ admin: true });
  await expectRedirect(() => helper.login(credentials()), "/admin");
  assert.equal((await helper.requireAdminPage()).user.email, "admin@example.com");
}));

test("ordinary password login clears the newly created session and denies access", async () => configured(async () => {
  const helper = session();
  await expectRedirect(() => helper.login(credentials()), "/admin/login?error=denied");
  await expectRedirect(helper.requireAdminPage, "/admin/login");
}));

test("invalid input and failed passwords never grant access", async () => configured(async () => {
  const invalid = session();
  await expectRedirect(() => invalid.login(new FormData()), "/admin/login?error=credentials");
  assert.equal(invalid.signInCalls(), 0);
  const failed = session({ authFailure: true, admin: true });
  await expectRedirect(() => failed.login(credentials()), "/admin/login?error=credentials");
  await expectRedirect(failed.requireAdminPage, "/admin/login");
}));

test("logout expires only Auth cookies and subsequent protected access is denied, including network failure", async () => configured(async () => {
  for (const logoutFailure of [false, true]) {
    const helper = session({ signedIn: true, admin: true, logoutFailure });
    helper.jar.set("sb-test-project-auth-token.1", "test-second-chunk");
    helper.jar.set("sb-test-project-auth-token-code-verifier", "test-verifier");
    await helper.requireAdminPage();
    await expectRedirect(helper.logout, "/admin/login");
    assert.deepEqual(helper.expired, ["sb-test-project-auth-token.0", "sb-test-project-auth-token.1", "sb-test-project-auth-token-code-verifier"]);
    assert.equal(helper.jar.get("unrelated-cookie"), "keep");
    await expectRedirect(helper.requireAdminPage, "/admin/login");
  }
}));

test("missing configuration denies admin access safely", async () => configured(async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  const helper = session({ signedIn: true, admin: true });
  await expectRedirect(helper.requireAdminPage, "/admin/login?error=unavailable");
  await expectRedirect(() => helper.login(credentials()), "/admin/login?error=unavailable");
}));

test("login UI has password sign-in only; no public signup route or signup action exists", async () => {
  const Page = loadModule("app/admin/login/page.tsx", { "../actions": { login: async () => {} }, "../admin.module.css": { default: {} } }).default;
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
  assert.ok(html.includes('type="password"'));
  assert.ok(html.includes("Sign in"));
  assert.ok(!/sign.?up|register/i.test(html));
  assert.ok(!readdirSync(`${root}/app`, { recursive: true }).some((name) => /sign.?up|register/i.test(String(name))));
  assert.ok(!readFileSync(`${root}/app/admin/actions.ts`, "utf8").includes("signUp"));
  const unknownError = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ error: "constructor" }) }));
  assert.ok(!unknownError.includes('role="alert"'));
});

test("protected dashboard renders the verified email, Publications controls and logout", async () => {
  let checks = 0;
  const supabase = { from(table) { assert.ok(["publications", "publication_settings"].includes(table)); return { select() { return {
    order: async () => ({ data: [], error: null }),
    eq: () => ({ single: async () => ({ data: { hero_publications: "40+" }, error: null }) }),
  }; } }; } };
  const Page = loadModule("app/admin/page.tsx", {
    "../../lib/auth/admin-page": { requireAdminPage: async () => { checks++; return { user: { email: "admin@example.com" }, supabase }; } },
    "./actions": { logout: async () => {} },
    "./publications/actions": { movePublication: async () => {}, updateHeroCounter: async () => {} },
    "./admin.module.css": { default: {} },
  }).default;
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
  assert.equal(checks, 1);
  assert.ok(html.includes("Admin Dashboard"));
  assert.ok(html.includes("admin@example.com"));
  assert.ok(html.includes("Publications (0)"));
  assert.ok(html.includes("Add publication"));
  assert.ok(html.includes("View public website"));
  assert.ok(html.includes("Google Scholar reference"));
  assert.ok(html.includes("Logout"));
});
