"use client";

import { useEffect, useState } from "react";

export default function ServiceWorker() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
      return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

    navigator.serviceWorker
      .register(`${base}/sw.js`)
      .then((reg) => {
        if (reg.waiting) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            // A new worker is installed and an old one controls the page.
            if (next.state === "installed" && navigator.serviceWorker.controller)
              setWaiting(next);
          });
        });
      })
      .catch(() => {});

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  if (!waiting) return null;

  return (
    <div className="update-toast">
      <span>A new version is available.</span>
      <button onClick={() => waiting.postMessage("SKIP_WAITING")}>Reload</button>
    </div>
  );
}
