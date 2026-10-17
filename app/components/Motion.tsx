"use client";

import { useEffect } from "react";

/**
 * Loads the scroll film after the page is interactive. Readers who ask for reduced motion
 * (or whose browser cannot run it) keep the plain, fully readable page.
 */
export function Motion() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    import("@/lib/motion/engine")
      .then(({ start }) => {
        if (!cancelled) stop = start();
      })
      .catch((err) => {
        document.documentElement.classList.remove("motion");
        console.error("motion disabled", err);
      });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
  return null;
}
