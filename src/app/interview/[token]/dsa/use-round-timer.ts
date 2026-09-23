"use client";

import { useEffect, useRef, useState } from "react";

/** Counts down from `startedAt + durationMinutes`, computed fresh each tick rather than
 * tracked client-side from zero, so a page reload mid-round shows the correct remaining
 * time instead of resetting the clock. `onExpire` is read from a ref, not a dependency,
 * so passing a fresh closure every render doesn't restart the interval. */
export function useRoundTimer(startedAt: string | null, durationMinutes: number, onExpire: () => void) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!startedAt) {
      setRemainingSeconds(null);
      return;
    }

    const deadline = new Date(startedAt).getTime() + durationMinutes * 60_000;
    let hasFiredExpire = false;

    const tick = () => {
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0 && !hasFiredExpire) {
        hasFiredExpire = true;
        onExpireRef.current();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, durationMinutes]);

  return remainingSeconds;
}

export function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
