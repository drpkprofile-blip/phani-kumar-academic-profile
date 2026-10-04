import assert from "node:assert/strict";

const origin = process.argv[2] ?? "http://localhost:3107";
for (const headers of [{}, { Cookie: "sb-ngexzjhsacwugpmvmxrg-auth-token=forged-invalid-session" }]) {
  const response = await fetch(`${origin}/admin`, { redirect: "manual", headers });
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location"), origin).pathname, "/admin/login");
  assert.ok(response.headers.get("cache-control")?.includes("no-store"));
  assert.ok(!(await response.text()).includes("Admin Dashboard"));
}
const login = await fetch(`${origin}/admin/login`);
assert.equal(login.status, 200);
const html = await login.text();
assert.ok(html.includes("Admin Login"));
assert.ok(html.includes('type="password"'));
assert.ok(!/sign.?up|register/i.test(html));
assert.ok(login.headers.get("cache-control")?.includes("no-store"));
assert.equal((await fetch(`${origin}/admin/signup`)).status, 404);
console.log("Production checks passed: anonymous/forged sessions redirected, no dashboard leak, no-store headers, password-only login and no signup route.");
