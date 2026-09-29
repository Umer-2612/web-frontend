"use client";

import { useEffect, useRef, useState } from "react";
import { portalApi } from "@/lib/portal-api";

/** Warn-and-log proctoring only: reports every time the tab loses and regains focus
 * or visibility (alt-tab, minimize, switching apps, closing fullscreen) while `active`
 * is true. Browsers have no API to block any of that, Cmd/Alt+Tab and minimize are
 * OS-level, so this never blocks the candidate or changes grading, it only logs each
 * occurrence server-side and returns a running count for a small honest warning.
 *
 * Deliberately built on `visibilitychange` rather than `window.blur`: blur also fires
 * for in-page focus changes (clicking the browser's own address bar) that aren't
 * really "leaving", visibilitychange only fires for genuine tab/app switches. */
export function useFocusLossProctoring(token: string, active: boolean): number {
  const [count, setCount] = useState(0);
  const leftAtRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        leftAtRef.current = new Date().toISOString();
        return;
      }
      const leftAt = leftAtRef.current;
      if (!leftAt) return;
      leftAtRef.current = null;
      const returnedAt = new Date().toISOString();

      portalApi
        .reportFocusLoss(token, leftAt, returnedAt)
        .then(({ count: total }) => setCount(total))
        .catch(() => {
          // Best-effort signal: a failed report shouldn't interrupt the candidate,
          // just fall back to counting it locally so the on-screen count stays honest.
          setCount((prev) => prev + 1);
        });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [token, active]);

  return count;
}
