"use client";

import { useEffect, useState } from "react";

type NavigationItem = { href: string; label: string };

export default function PrimaryNavigation({ items }: { items: NavigationItem[] }) {
  const [activeHref, setActiveHref] = useState("#top");

  useEffect(() => {
    const updateCurrentSection = () => {
      const navHeight = document.querySelector(".navbar")?.getBoundingClientRect().height ?? 76;
      const activeLine = navHeight + 16;
      const current = items
        .filter((item) => item.href !== "#top")
        .map((item) => ({ item, section: document.getElementById(item.href.slice(1)) }))
        .filter((entry): entry is { item: NavigationItem; section: HTMLElement } => Boolean(entry.section))
        .map((entry) => ({ ...entry, top: entry.section.getBoundingClientRect().top }))
        .filter((entry) => entry.top <= activeLine)
        .sort((left, right) => right.top - left.top)[0];

      setActiveHref(current?.item.href ?? "#top");
    };

    const nav = document.querySelector<HTMLElement>(".navbar");
    const updateNavHeight = () => {
      if (nav) {
        document.documentElement.style.setProperty("--primary-nav-height", `${Math.ceil(nav.getBoundingClientRect().height)}px`);
      }
    };
    const resizeObserver = nav && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
        updateNavHeight();
        updateCurrentSection();
      })
      : undefined;
    if (nav && resizeObserver) resizeObserver.observe(nav);
    updateNavHeight();

    updateCurrentSection();
    window.addEventListener("scroll", updateCurrentSection, { passive: true });
    window.addEventListener("hashchange", updateCurrentSection);
    return () => {
      window.removeEventListener("scroll", updateCurrentSection);
      window.removeEventListener("hashchange", updateCurrentSection);
      resizeObserver?.disconnect();
      document.documentElement.style.removeProperty("--primary-nav-height");
    };
  }, [items]);

  return (
    <nav className="nav-links" aria-label="Primary navigation">
      {items.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          aria-current={activeHref === href ? "location" : undefined}
          onClick={() => setActiveHref(href)}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
