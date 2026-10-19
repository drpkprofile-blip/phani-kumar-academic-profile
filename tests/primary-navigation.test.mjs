import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { root } from "../scripts/publication-seed.mjs";
import { loadModule } from "./helpers/render-profile.mjs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const items = [
  { href: "#top", label: "Home" },
  { href: "#research", label: "Research" },
  { href: "#publications", label: "Publications" },
];

test("primary navigation renders accessible section links with the Home location active initially", () => {
  const Navigation = loadModule("app/primary-navigation.tsx").default;
  const html = renderToStaticMarkup(createElement(Navigation, { items }));
  assert.match(html, /aria-label="Primary navigation"/);
  assert.match(html, /href="#top" aria-current="location"/);
  assert.match(html, /href="#research"/);
  assert.match(html, /href="#publications"/);
  assert.match(readFileSync(`${root}/app/primary-navigation.tsx`, "utf8"), /onPointerDown=\{\(event\) =>/);
  assert.match(readFileSync(`${root}/app/primary-navigation.tsx`, "utf8"), /requestedHref\.current = href;\s*setActiveHref\(href\)/);
});

test("navigation uses clear sky-blue buttons, wraps across rows, and keeps Admin under the profile brand", () => {
  const css = readFileSync(`${root}/app/globals.css`, "utf8");
  const page = readFileSync(`${root}/app/page.tsx`, "utf8");
  assert.match(css, /\.nav-links a\s*\{[^}]*min-height:\s*38px;[^}]*border:\s*1px solid rgba\(99, 183, 222, 0\.52\)/s);
  assert.match(css, /\.nav-links a\s*\{[^}]*font-size:\s*12px;/s);
  assert.match(css, /\.nav-links\s*\{[^}]*flex-wrap:\s*wrap;/s);
  assert.match(css, /\.nav-brand\s*\{[^}]*grid-template-columns:\s*50px minmax\(0, 1fr\);/s);
  assert.match(css, /\.admin-shortcut\s*\{[^}]*grid-column:\s*2;/s);
  assert.match(page, /<div className="nav-brand">[\s\S]*?className="nav-title"[\s\S]*?className="admin-shortcut"/);
  assert.doesNotMatch(css, /\.admin-shortcut\s*\{[^}]*position:\s*fixed;/s);
  assert.match(css, /\.nav-links a\[aria-current="location"\]\s*\{[^}]*background:\s*#63c8f5/s);
  assert.match(css, /\.nav-links a\[aria-current="location"\]\s*\{[^}]*transition:\s*none/s);
  assert.match(css, /\.nav-links a:active\s*\{[^}]*background:\s*#63c8f5;[^}]*scale\(0\.96\)/s);
  assert.match(css, /\.nav-links a:focus-visible\s*\{[^}]*outline:/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.nav-links a\s*\{\s*transition:\s*none;/);
  const mobile = css.match(/@media \(max-width: 760px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(mobile, /\.navbar\s*\{[^}]*position:\s*sticky;/s);
  assert.match(mobile, /\.nav-links\s*\{[^}]*flex-wrap:\s*wrap;[^}]*overflow:\s*visible;/s);
  assert.match(mobile, /\.nav-title\s*\{[^}]*display:\s*block;/s);
  assert.match(mobile, /main\s*\{[^}]*padding-top:\s*0;/s);
  assert.match(css, /scroll-padding-top:\s*calc\(var\(--primary-nav-height, 92px\) \+ 12px\)/);
});
