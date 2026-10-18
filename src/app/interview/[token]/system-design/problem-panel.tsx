import { memo } from "react";

import type { SystemDesignRoundView } from "@/lib/portal-api";
import { formatRps } from "@/lib/system-design/format";

const DIFFICULTY_STYLE = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function ProblemPanelView({ problem }: { problem: SystemDesignRoundView["problem"] }) {
  const r = problem.requirements;
  const facts = [
    ["Target load", `${formatRps(r.target_rps)} requests/s`],
    ["Reads / writes", `${Math.round(r.read_ratio * 100)}% / ${Math.round((1 - r.read_ratio) * 100)}%`],
    ["Traffic spike", `${r.peak_multiplier}× the target`],
    ["Data to store", r.data_size_gb >= 1000 ? `${(r.data_size_gb / 1000).toFixed(r.data_size_gb % 1000 === 0 ? 0 : 1)} TB` : `${r.data_size_gb} GB`],
    ["Latency goal (p99)", `${r.latency_slo_ms} ms`],
    ["Availability goal", `${r.availability_slo}%`],
  ];

  return (
    <div className="space-y-5 p-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{problem.title}</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_STYLE[problem.difficulty]}`}>{problem.difficulty}</span>
        </div>
        <div className="mt-3 space-y-3 text-sm leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-300">{problem.prompt}</div>
      </div>

      <section aria-label="Requirements">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Your design is tested against</h3>
        <dl className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white text-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {facts.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 px-3 py-2">
              <dt className="text-zinc-500">{label}</dt>
              <dd className="font-medium text-zinc-900 tabular-nums dark:text-zinc-100">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

export const ProblemPanel = memo(ProblemPanelView);
