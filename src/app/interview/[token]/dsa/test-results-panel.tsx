import type { GradedTestCase } from "@/lib/portal-api";

export interface LiveTestRun {
  results: { index: number; result: GradedTestCase }[];
  isRunning: boolean;
  error: string | null;
}

/** Terminal-style, line-by-line feed: each test case's PASS/FAIL appears the moment
 * it streams in from the server, not all at once after every case has finished.
 * Detail (input/expected/actual) only shows for a failed, unlocked case, same as a
 * typical test runner's output only explaining what went wrong. */
export function TestResultsPanel({ testRun, totalTestCases }: { testRun: LiveTestRun | null; totalTestCases: number }) {
  if (!testRun) {
    return (
      <p className="px-3 py-2 text-xs text-zinc-400">
        Click &quot;Run Tests&quot; to check your code against this question&apos;s test cases.
      </p>
    );
  }

  const { results, isRunning, error } = testRun;
  const passed = results.filter((r) => r.result.passed).length;

  return (
    <div className="h-full overflow-auto bg-zinc-950 px-3 py-2 font-mono text-xs">
      <p className="text-zinc-500">
        {isRunning
          ? `Running test cases… (${results.length}/${totalTestCases})`
          : error
            ? "Grading failed"
            : `${passed}/${results.length} passed`}
      </p>
      {results.map(({ index, result }) => (
        <div key={index} className="mt-1">
          <span className={result.passed ? "text-emerald-400" : "text-red-400"}>{result.passed ? "PASS" : "FAIL"}</span>{" "}
          <span className="text-zinc-400">
            Test {index + 1}
            {result.locked ? " (hidden)" : ""}
          </span>
          {!result.locked && !result.passed && (
            <div className="mt-0.5 space-y-0.5 pl-4 text-zinc-500">
              <div>input: {result.input}</div>
              <div>expected: {result.expected_output}</div>
              <div>got: {result.actual_output}</div>
            </div>
          )}
        </div>
      ))}
      {isRunning && <p className="mt-1 animate-pulse text-zinc-600">…</p>}
      {error && <p className="mt-2 text-red-400">Error: {error}</p>}
    </div>
  );
}
