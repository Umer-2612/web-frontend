"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";

import type { InterviewRound } from "@/lib/api";
import { SCENARIOS, type Board, type EvaluationResult, type FindingSeverity, type Scenario, type SystemDesignSubmission } from "@/lib/system-design/types";
import { getComponent } from "@/lib/system-design/catalog";
import { BoardCanvas, type FocusRequest } from "./board-canvas";
import { FindingsList, ResultSummary } from "./simulation-results";
import { useBoardState } from "./use-board-state";

const SCORE_LABELS: [keyof EvaluationResult["scores"], string][] = [
  ["scalability", "Scalability"],
  ["reliability", "Reliability"],
  ["security", "Security"],
  ["observability", "Observability"],
  ["cost_efficiency", "Cost efficiency"],
];

const SEVERITY_TONE: Record<FindingSeverity, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  info: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const tone = value >= 7 ? "bg-emerald-500" : value >= 4 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{value}/10</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="img" aria-label={`${label} ${value} out of 10`}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

function Evaluation({ evaluation, nodeLabel }: { evaluation: EvaluationResult; nodeLabel: (id: string) => string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{evaluation.overall}</span>
        <span className="text-sm text-zinc-500">out of 10 overall</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {SCORE_LABELS.map(([key, label]) => (
          <ScoreBar key={key} label={label} value={evaluation.scores[key]} />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{evaluation.summary}</p>

      {evaluation.failure_points.length > 0 && (
        <section aria-label="Failure points">
          <h4 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Where it breaks</h4>
          <ul className="space-y-2">
            {evaluation.failure_points.map((f, i) => (
              <li key={i} className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SEVERITY_TONE[f.severity]}`}>{f.severity}</span>
                  <div className="min-w-0">
                    <p className="text-zinc-900 dark:text-zinc-100">
                      {f.issue}
                      {f.node_id && <span className="text-zinc-500"> ({nodeLabel(f.node_id)})</span>}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Fix: {f.suggested_fix}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {evaluation.strengths.length > 0 && (
        <section aria-label="Strengths">
          <h4 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">What works</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            {evaluation.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ReviewBoard({ board, submission }: { board: Board; submission: SystemDesignSubmission | null }) {
  const state = useBoardState(board);
  const [scenario, setScenario] = useState<Scenario>("steady");
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const result = submission?.engine_results[scenario] ?? null;

  const nodeLabel = useCallback(
    (id: string) => {
      const node = state.nodes.find((n) => n.id === id);
      return node ? node.data.label || getComponent(node.data.type).label : "that component";
    },
    [state.nodes],
  );
  const focusNode = useCallback((id: string) => setFocus((prev) => ({ id, n: (prev?.n ?? 0) + 1 })), []);

  return (
    <div className="space-y-4">
      {submission && (
        <div role="tablist" aria-label="Load test scenario" className="flex flex-wrap gap-1">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={scenario === s.id}
              onClick={() => setScenario(s.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                scenario === s.id ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="h-[420px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <ReactFlowProvider>
          <BoardCanvas state={state} readOnly result={result} focus={focus} />
        </ReactFlowProvider>
      </div>

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{result.offered_rps.toLocaleString("en-US")} requests/s</h4>
            <ResultSummary result={result} nodeLabel={nodeLabel} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">What the test found</h4>
            <FindingsList findings={result.findings} nodeLabel={nodeLabel} onFocusNode={focusNode} />
          </div>
        </div>
      )}
    </div>
  );
}

const EVALUATION_NOTE: Record<SystemDesignSubmission["evaluation_status"], string | null> = {
  ok: null,
  unavailable: "The AI evaluation couldn't be generated for this submission. The load test results below are still accurate.",
  skipped: "No AI evaluation: the board was empty or AI review isn't configured. The load test results below are still accurate.",
};

/** A hiring manager's view of one system design round: AI score and notes, plus the candidate's board
 * painted with each load test scenario. Falls back to the autosaved board while the round is unfinished. */
export function SystemDesignReview({ round }: { round: InterviewRound }) {
  const submission = useMemo(() => {
    const raw = round.submissions as unknown as Partial<SystemDesignSubmission> | null;
    return raw && raw.board && raw.engine_results ? (raw as SystemDesignSubmission) : null;
  }, [round.submissions]);

  const board: Board | null = submission?.board ?? round.board ?? null;

  const labelFor = useCallback(
    (id: string) => {
      const node = board?.nodes.find((n) => n.id === id);
      return node ? node.label || getComponent(node.type).label : "that component";
    },
    [board],
  );

  return (
    <details className="mt-2 text-sm" open>
      <summary className="cursor-pointer font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">
        System design {submission ? "submission" : round.status === "completed" ? "(no board saved)" : "(in progress)"}
      </summary>
      <div className="mt-3 space-y-5">
        {!board || board.nodes.length === 0 ? (
          <p className="text-zinc-500">{round.status === "completed" ? "The candidate submitted an empty board." : "The candidate hasn't added anything to the board yet."}</p>
        ) : (
          <>
            {submission && (
              <>
                {submission.evaluation ? <Evaluation evaluation={submission.evaluation} nodeLabel={labelFor} /> : <p className="text-zinc-500">{EVALUATION_NOTE[submission.evaluation_status]}</p>}
                {submission.evaluation && EVALUATION_NOTE[submission.evaluation_status] && <p className="text-zinc-500">{EVALUATION_NOTE[submission.evaluation_status]}</p>}
              </>
            )}
            {!submission && <p className="text-zinc-500">Not submitted yet. This is the board as last autosaved.</p>}
            <ReviewBoard board={board} submission={submission} />
          </>
        )}
      </div>
    </details>
  );
}
