"use client";

import { useEffect, useRef, useState } from "react";

const sessionKey = "pk-profile-visit-counted";

export default function ProfileVisitCounter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    try {
      if (window.sessionStorage.getItem(sessionKey)) return;
      window.sessionStorage.setItem(sessionKey, "1");
    } catch {
      // Continue with one request when browser storage is unavailable.
    }

    void fetch("/api/profile-visits", { method: "POST", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json() as { count?: unknown };
        if (typeof result.count === "number" && Number.isSafeInteger(result.count) && result.count >= 0) {
          setCount(result.count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <p className="profile-visit-counter" aria-live="polite">
      <span className="profile-visit-dot" aria-hidden="true" />
      <span>Profile visits</span>
      <strong>{count.toLocaleString("en-IN")}</strong>
    </p>
  );
}
