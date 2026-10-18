"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError, type SystemDesignProblem } from "@/lib/api";
import { formatRps } from "@/lib/system-design/format";
import { ProblemFormDialog } from "./problem-form-dialog";

const DIFFICULTY_STYLE: Record<SystemDesignProblem["difficulty"], string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

/** The problem bank for the system design round: built-in presets (read-only) plus the company's own. */
const SystemDesignProblemsPage = () => {
  const [problems, setProblems] = useState<SystemDesignProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ problem: SystemDesignProblem | null } | null>(null);

  const load = useCallback(async () => {
    try {
      setProblems(await api.listSystemDesignProblems());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const remove = async (problem: SystemDesignProblem) => {
    setError(null);
    try {
      await api.deleteSystemDesignProblem(problem.id);
      setProblems((prev) => prev.filter((p) => p.id !== problem.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete the problem");
    }
  };

  if (loading) return <AiSpinner />;

  const own = problems.filter((p) => p.company_id !== null);
  const presets = problems.filter((p) => p.company_id === null);

  const renderRow = (problem: SystemDesignProblem) => {
    const isPreset = problem.company_id === null;
    return (
      <tr key={problem.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
        <td className="px-5 py-4">
          <button type="button" onClick={() => setDialog({ problem })} className="text-left font-medium text-zinc-900 hover:text-indigo-600 focus-visible:underline focus-visible:outline-none dark:text-zinc-100 dark:hover:text-indigo-400">
            {problem.title}
          </button>
        </td>
        <td className="px-5 py-4">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_STYLE[problem.difficulty]}`}>{problem.difficulty}</span>
        </td>
        <td className="px-5 py-4 text-zinc-500 tabular-nums">{formatRps(problem.requirements.target_rps)} req/s</td>
        <td className="px-5 py-4">{isPreset ? <Badge variant="secondary">Preset</Badge> : <span className="text-zinc-500">Your company</span>}</td>
        <td className="px-5 py-4 text-right">
          {!isPreset && (
            <Button variant="ghost" size="icon" aria-label={`Delete ${problem.title}`} onClick={() => void remove(problem)}>
              <Trash2 className="size-4 text-zinc-500" />
            </Button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-zinc-500">Pick one of these when you schedule an interview to add a system design round. Candidates draw their design on a board and see where it breaks under load.</p>
        <Button onClick={() => setDialog({ problem: null })}>
          <Plus /> New problem
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="max-w-full overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
              {["Problem", "Difficulty", "Target load", "Source"].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {h}
                </th>
              ))}
              <th className="px-5 py-3.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {own.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-zinc-400">
                  You haven&apos;t written a problem yet. Use New problem, or start from a preset below.
                </td>
              </tr>
            )}
            {own.map(renderRow)}
            {presets.map(renderRow)}
          </tbody>
        </table>
      </div>

      <ProblemFormDialog
        open={dialog !== null}
        problem={dialog?.problem ?? null}
        readOnly={dialog?.problem?.company_id === null}
        readOnlyReason="This is a preset, so it can't be edited. Create your own problem to change the wording or the load."
        onClose={() => setDialog(null)}
        onSaved={(saved) => {
          setProblems((prev) => (prev.some((p) => p.id === saved.id) ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]));
          setDialog(null);
        }}
      />
    </div>
  );
};

export default SystemDesignProblemsPage;
