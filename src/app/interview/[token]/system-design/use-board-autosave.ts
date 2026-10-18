"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { portalApi } from "@/lib/portal-api";
import type { Board } from "@/lib/system-design/types";

export type SaveState = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 1200;
const RETRY_MS = 5000;

/** Saves the board a moment after the candidate stops editing, so a refresh or a crashed tab
 * never loses the diagram. Saves never overlap, and `flush` pushes the latest board right now
 * (used just before submitting). */
export function useBoardAutosave(token: string, board: Board, enabled: boolean) {
  const [state, setState] = useState<SaveState>("idle");
  const boardRef = useRef(board);
  boardRef.current = board;
  const lastSavedKey = useRef(JSON.stringify(board));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void>>(Promise.resolve());

  const save = useCallback((): Promise<void> => {
    const next = boardRef.current;
    const key = JSON.stringify(next);
    if (key === lastSavedKey.current) return inFlight.current;

    inFlight.current = inFlight.current.then(async () => {
      setState("saving");
      try {
        await portalApi.saveBoard(token, next);
        lastSavedKey.current = key;
        setState("saved");
      } catch {
        setState("error");
        // Try again soon; the next edit also reschedules a save.
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void save(), RETRY_MS);
      }
    });
    return inFlight.current;
  }, [token]);

  useEffect(() => {
    if (!enabled) return;
    if (JSON.stringify(board) === lastSavedKey.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [board, enabled, save]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await save();
  }, [save]);

  return { state, flush };
}
