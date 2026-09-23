import { CheckCircle2, XCircle } from "lucide-react";

import type { GradeResult } from "@/lib/portal-api";

export function TestResultsPanel({ result }: { result: GradeResult | null }) {
  if (!result) {
    return <p className="px-3 py-2 text-xs text-zinc-400">Click "Run Tests" to check your code against this question's test cases.</p>;
  }

  return (
    <div className="h-full space-y-2 overflow-auto px-3 py-2 text-xs">
      <p className="font-medium text-zinc-700 dark:text-zinc-200">
        {result.passed} / {result.total} test cases passed
      </p>
      {result.results.map((r, i) => (
        <div
          key={i}
          className={`rounded-md border p-2 ${
            r.passed
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20"
              : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20"
          }`}
        >
          <div className="flex items-center gap-1.5">
            {r.passed ? (
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="size-3.5 text-red-600 dark:text-red-400" />
            )}
            <span className="font-medium">
              Test case {i + 1}
              {r.locked ? " (hidden)" : ""}
            </span>
          </div>
          {!r.locked && (
            <div className="mt-1.5 space-y-0.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
              <p>Input: {r.input}</p>
              <p>Expected: {r.expected_output}</p>
              <p>Got: {r.actual_output}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
