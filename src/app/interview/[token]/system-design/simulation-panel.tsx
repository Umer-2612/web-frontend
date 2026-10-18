"use client";

import { Loader2, Play, Sparkles } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

import { AiHints, FindingsList, ResultSummary } from "@/components/system-design/simulation-results";
import { Button } from "@/components/ui/button";
import { PortalApiError, portalApi } from "@/lib/portal-api";
import { SCENARIOS, type AiHint, type Board, type Scenario, type SimulationResult } from "@/lib/system-design/types";

type AiStatus = "off" | "pending" | "done" | "not_configured" | "limit_reached" | "unavailable";

const AI_NOTE: Partial<Record<AiStatus, string>> = {
  limit_reached: "You've used all your AI hints. Load tests still run.",
  unavailable: "The AI reviewer couldn't be reached this time. The load test above is still accurate.",
};

function SimulationPanelView({
  token,
  getBoard,
  structureKey,
  result,
  resultKey,
  aiEnabled,
  runsUsed: initialRunsUsed,
  runsMax,
  disabled,
  nodeLabel,
  onFocusNode,
  onResult,
}: {
  token: string;
  /** Read at click time, so this panel's props stay stable while the candidate drags nodes around. */
  getBoard: () => Board;
  structureKey: string;
  result: SimulationResult | null;
  resultKey: string | null;
  aiEnabled: boolean;
  runsUsed: number;
  runsMax: number;
  disabled?: boolean;
  nodeLabel: (id: string) => string;
  onFocusNode: (id: string) => void;
  onResult: (result: SimulationResult, key: string) => void;
}) {
  const [scenario, setScenario] = useState<Scenario>("steady");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState<AiHint[]>([]);
  const [aiStatus, setAiStatus] = useState<AiStatus>("off");
  const [runsUsed, setRunsUsed] = useState(initialRunsUsed);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const stale = result !== null && resultKey !== structureKey;
  const shownScenario = SCENARIOS.find((s) => s.id === result?.scenario);

  const run = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setError(null);
    setHints([]);
    setAiStatus(aiEnabled ? "pending" : "off");

    try {
      await portalApi.simulate(
        token,
        getBoard(),
        scenario,
        (event) => {
          if (event.type === "engine") onResult(event.result, structureKey);
          else if (event.type === "ai_hint") {
            setHints(event.hints);
            setAiStatus("done");
            setRunsUsed(event.runs_used);
          } else if (event.type === "ai_skipped") setAiStatus(event.reason);
          else if (event.type === "done") setRunsUsed(event.runs_used);
          else if (event.type === "error") setError(event.message);
        },
        controller.signal,
      );
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof PortalApiError ? err.message : "The load test couldn't run. Try again.");
      setAiStatus("off");
    } finally {
      if (abortRef.current === controller) setRunning(false);
    }
  };

  return (
    <div className="space-y-5 p-4">
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Load test</legend>
        {SCENARIOS.map((s) => (
          <label
            key={s.id}
            className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500 ${
              scenario === s.id ? "border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40" : "border-zinc-200 hover:bg-white dark:border-zinc-800 dark:hover:bg-zinc-900"
            }`}
          >
            <input type="radio" name="scenario" value={s.id} checked={scenario === s.id} onChange={() => setScenario(s.id)} disabled={running} className="mt-1 accent-indigo-600" />
            <span>
              <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.label}</span>
              <span className="block text-xs text-zinc-500">{s.hint}</span>
            </span>
          </label>
        ))}
        <Button onClick={() => void run()} disabled={running || disabled} className="w-full">
          {running ? <Loader2 className="animate-spin" /> : <Play />}
          {running ? "Running…" : result ? "Run again" : "Run load test"}
        </Button>
        {aiEnabled && (
          <p className="text-xs text-zinc-500">
            AI hints used: {runsUsed} of {runsMax}
          </p>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {shownScenario?.label}: {result.offered_rps.toLocaleString("en-US")} requests/s
            </h3>
            {stale && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">You've changed the board since this run. Run again to refresh the results.</p>}
          </div>
          <ResultSummary result={result} nodeLabel={nodeLabel} />

          {aiStatus === "pending" && (
            <p className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="size-4 animate-spin" /> The AI reviewer is looking at your design…
            </p>
          )}
          {hints.length > 0 && (
            <section aria-label="AI hints" className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden /> Reviewer hints
              </h3>
              <AiHints hints={hints} nodeLabel={nodeLabel} onFocusNode={onFocusNode} />
            </section>
          )}
          {AI_NOTE[aiStatus] && <p className="text-xs text-zinc-500">{AI_NOTE[aiStatus]}</p>}

          <section aria-label="Findings" className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">What the test found</h3>
            <FindingsList findings={result.findings} nodeLabel={nodeLabel} onFocusNode={onFocusNode} />
          </section>
        </div>
      )}

      {!result && !running && <p className="text-sm text-zinc-500">Build a design, then run a load test to see where it breaks. Components turn green, amber or red on the board.</p>}
    </div>
  );
}

/** Memoised: it would otherwise re-render on every frame of a node drag while hidden behind another tab. */
export const SimulationPanel = memo(SimulationPanelView);
