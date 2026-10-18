"use client";

import { AlertOctagon, AlertTriangle, Info, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/system-design/format";
import type { AiHint, Finding, FindingSeverity, SimulationResult } from "@/lib/system-design/types";

const SEVERITY: Record<FindingSeverity, { icon: typeof Info; tone: string; label: string }> = {
  critical: { icon: AlertOctagon, tone: "text-red-600 dark:text-red-400", label: "Critical" },
  warning: { icon: AlertTriangle, tone: "text-amber-600 dark:text-amber-400", label: "Warning" },
  info: { icon: Info, tone: "text-zinc-500", label: "Suggestion" },
};

function Metric({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={cn("text-lg font-semibold tabular-nums", ok === undefined ? "text-zinc-900 dark:text-zinc-100" : ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>{value}</p>
    </div>
  );
}

export function ResultSummary({ result, nodeLabel }: { result: SimulationResult; nodeLabel: (id: string) => string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Metric label="Requests served" value={formatPercent(result.success_rate, result.success_rate > 0.99 ? 2 : 1)} ok={result.slo.availability_ok} />
      <Metric label="Estimated p99 latency" value={result.est_p99_ms >= 10_000 ? "10 s+" : `${result.est_p99_ms} ms`} ok={result.slo.latency_ok} />
      <div className="col-span-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs text-zinc-500">First to give out</p>
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{result.bottleneck_node_id ? nodeLabel(result.bottleneck_node_id) : "Nothing is under pressure"}</p>
      </div>
    </div>
  );
}

export function FindingsList({ findings, nodeLabel, onFocusNode }: { findings: Finding[]; nodeLabel: (id: string) => string; onFocusNode?: (id: string) => void }) {
  if (findings.length === 0) return <p className="text-sm text-zinc-500">No problems found for this scenario.</p>;
  return (
    <ul className="space-y-2">
      {findings.map((f, i) => {
        const { icon: Icon, tone, label } = SEVERITY[f.severity];
        const body = (
          <>
            <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} aria-label={label} />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{f.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{f.detail}</span>
              {f.node_id && onFocusNode && <span className="mt-1 block text-xs font-medium text-indigo-600 dark:text-indigo-400">Show {nodeLabel(f.node_id)} on the board</span>}
            </span>
          </>
        );
        const cls = "flex w-full gap-2.5 rounded-lg border border-zinc-200 bg-white p-3 text-left dark:border-zinc-800 dark:bg-zinc-900";
        return (
          <li key={`${f.code}-${f.node_id ?? i}`}>
            {f.node_id && onFocusNode ? (
              <button type="button" onClick={() => onFocusNode(f.node_id!)} className={cn(cls, "transition-colors hover:border-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:hover:border-indigo-700")}>
                {body}
              </button>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function AiHints({ hints, nodeLabel, onFocusNode }: { hints: AiHint[]; nodeLabel: (id: string) => string; onFocusNode?: (id: string) => void }) {
  return (
    <ul className="space-y-2">
      {hints.map((h, i) => (
        <li key={i} className="flex gap-2.5 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
          <div className="min-w-0 text-sm text-zinc-800 dark:text-zinc-200">
            <p>{h.text}</p>
            {h.node_id && onFocusNode && (
              <button type="button" onClick={() => onFocusNode(h.node_id!)} className="mt-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Show {nodeLabel(h.node_id)}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
