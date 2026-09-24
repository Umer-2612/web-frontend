"use client";

import Editor from "@monaco-editor/react";
import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, Maximize2, Play, Send, Square, Terminal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Group as PanelGroup, Panel } from "react-resizable-panels";

import { Button } from "@/components/ui/button";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { DSA_EDITOR_OPTIONS, DSA_LANGUAGES, getDsaLanguage } from "@/lib/dsa-constants";
import { PortalApiError, portalApi, type DsaQuestion, type DsaRoundView, type DsaSubmission } from "@/lib/portal-api";
import { ConsolePanel } from "./console-panel";
import { TestResultsPanel, type LiveTestRun } from "./test-results-panel";
import type { OutputLine } from "./types";
import { formatRemaining, useRoundTimer } from "./use-round-timer";

interface QuestionState {
  code: string;
  language: string;
  stdin: string;
  output: OutputLine[];
  testRun: LiveTestRun | null;
  submission: DsaSubmission | null;
  submitError: string | null;
}

function getStarterCode(question: DsaQuestion, languageId: string): string {
  return question.starter_code[languageId] ?? "// Write your solution here\n";
}

function initialLanguageFor(question: DsaQuestion): string {
  return question.submission?.language ?? DSA_LANGUAGES.find((lang) => question.starter_code[lang.id])?.id ?? "javascript";
}

function initQuestionStates(view: DsaRoundView): Record<string, QuestionState> {
  const states: Record<string, QuestionState> = {};
  for (const question of view.questions) {
    const language = initialLanguageFor(question);
    states[question.id] = {
      code: question.submission?.code ?? getStarterCode(question, language),
      language,
      stdin: "",
      output: [],
      testRun: null,
      submission: question.submission,
      submitError: null,
    };
  }
  return states;
}

function buildOutputLines(result: Awaited<ReturnType<typeof portalApi.execute>>): OutputLine[] {
  if (!result.success) return [{ type: "error", content: result.error ?? "Execution failed" }];

  const lines: OutputLine[] = [];
  if (result.compileOutput) lines.push({ type: "error", content: result.compileOutput.trimEnd() });
  if (result.stdout) result.stdout.split("\n").forEach((line) => lines.push({ type: "log", content: line }));
  if (result.stderr) result.stderr.split("\n").filter(Boolean).forEach((line) => lines.push({ type: "error", content: line }));

  const description = result.status?.description;
  if (description && description !== "Accepted") lines.push({ type: "warn", content: `Status: ${description}` });
  if (result.time || result.memory) lines.push({ type: "result", content: `Finished in ${result.time ?? "?"}s, ${result.memory ?? "?"}KB` });

  return lines.length > 0 ? lines : [{ type: "log", content: "(No output)" }];
}

export function DsaWorkspace({
  token,
  initialView,
  onRoundComplete,
}: {
  token: string;
  initialView: DsaRoundView;
  onRoundComplete: () => void;
}) {
  const [questions] = useState(initialView.questions);
  const [activeIndex, setActiveIndex] = useState(0);
  const [states, setStates] = useState<Record<string, QuestionState>>(() => initQuestionStates(initialView));
  const [bottomTab, setBottomTab] = useState<"console" | "tests">("console");
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));

  const statesRef = useRef(states);
  statesRef.current = states;
  const testRunAbortRef = useRef<AbortController | null>(null);

  const activeQuestion = questions[activeIndex]!;
  const activeState = states[activeQuestion.id]!;
  const isSubmitted = activeState.submission !== null;
  const allSubmitted = questions.every((q) => states[q.id]?.submission);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (allSubmitted) onRoundComplete();
  }, [allSubmitted, onRoundComplete]);

  const submitQuestion = useCallback(
    async (questionId: string) => {
      const state = statesRef.current[questionId];
      if (!state || state.submission) return;
      try {
        const submission = await portalApi.submitDsaQuestion(token, questionId, state.code, state.language);
        setStates((prev) => ({ ...prev, [questionId]: { ...prev[questionId]!, submission, submitError: null } }));
      } catch (err) {
        // Surfaced on the manual-submit path so the candidate isn't left staring
        // at a button that silently reverted with no explanation. Also reached
        // from the timer-expiry auto-submit, where nobody's around to read it,
        // that's fine, it just never gets shown.
        setStates((prev) => ({
          ...prev,
          [questionId]: {
            ...prev[questionId]!,
            submitError: err instanceof PortalApiError ? err.message : "Submission failed, please try again",
          },
        }));
      }
    },
    [token],
  );

  const handleExpire = useCallback(() => {
    Object.keys(statesRef.current).forEach((questionId) => {
      if (!statesRef.current[questionId]?.submission) void submitQuestion(questionId);
    });
  }, [submitQuestion]);

  const remainingSeconds = useRoundTimer(initialView.started_at, initialView.duration_minutes, handleExpire);
  const isTimeCritical = remainingSeconds !== null && remainingSeconds <= 300;

  const updateState = (questionId: string, patch: Partial<QuestionState>) => {
    setStates((prev) => ({ ...prev, [questionId]: { ...prev[questionId]!, ...patch } }));
  };

  const changeLanguage = (language: string) => {
    if (isSubmitted) return;
    updateState(activeQuestion.id, { language, code: getStarterCode(activeQuestion, language) });
  };

  const runCode = async () => {
    setIsRunning(true);
    setBottomTab("console");
    updateState(activeQuestion.id, { output: [{ type: "log", content: "Running…" }] });
    try {
      const result = await portalApi.execute(getDsaLanguage(activeState.language).judge0Id, activeState.code, activeState.stdin);
      updateState(activeQuestion.id, { output: buildOutputLines(result) });
    } catch {
      updateState(activeQuestion.id, { output: [{ type: "error", content: "Could not reach the code execution service" }] });
    } finally {
      setIsRunning(false);
    }
  };

  const applyTestRunEvent = (questionId: string, patch: (current: LiveTestRun) => LiveTestRun) => {
    setStates((prev) => {
      const current = prev[questionId]?.testRun ?? { results: [], isRunning: true, error: null };
      return { ...prev, [questionId]: { ...prev[questionId]!, testRun: patch(current) } };
    });
  };

  const runTests = async () => {
    const questionId = activeQuestion.id;
    setIsTesting(true);
    setBottomTab("tests");
    updateState(questionId, { testRun: { results: [], isRunning: true, error: null } });

    const controller = new AbortController();
    testRunAbortRef.current = controller;

    try {
      await portalApi.runDsaTests(
        token,
        questionId,
        activeState.code,
        activeState.language,
        (event) => {
          if (event.type === "result") {
            applyTestRunEvent(questionId, (current) => ({
              ...current,
              results: [...current.results, { index: event.index, result: event.result }],
            }));
          } else if (event.type === "done") {
            applyTestRunEvent(questionId, (current) => ({ ...current, isRunning: false }));
          } else {
            applyTestRunEvent(questionId, (current) => ({ ...current, isRunning: false, error: event.message }));
          }
        },
        controller.signal,
      );
    } catch (err) {
      // Stopping mid-run isn't a failure, keep whatever results already streamed
      // in and just mark it no longer running, no scary red error for that case.
      const isStopped = err instanceof DOMException && err.name === "AbortError";
      applyTestRunEvent(questionId, (current) => ({
        ...current,
        isRunning: false,
        error: isStopped ? null : err instanceof PortalApiError ? err.message : "Could not run tests",
      }));
    } finally {
      setIsTesting(false);
      testRunAbortRef.current = null;
    }
  };

  const stopTests = () => {
    testRunAbortRef.current?.abort();
  };

  const submitActiveQuestion = async () => {
    if (!window.confirm(`Submit "${activeQuestion.title}"? You won't be able to change it after this.`)) return;
    setIsSubmitting(true);
    await submitQuestion(activeQuestion.id);
    setIsSubmitting(false);
  };

  const reenterFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      {!isFullscreen && (
        <button
          onClick={reenterFullscreen}
          className="flex items-center justify-center gap-2 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
        >
          <Maximize2 className="size-3.5" /> You've left fullscreen, click to re-enter
        </button>
      )}

      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          {questions.map((q, i) => {
            const submitted = Boolean(states[q.id]?.submission);
            return (
              <button
                key={q.id}
                onClick={() => setActiveIndex(i)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  i === activeIndex
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                Question {i + 1}
                {submitted && <CheckCircle2 className="size-3.5 text-emerald-500" />}
              </button>
            );
          })}
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isTimeCritical
              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          {remainingSeconds !== null ? formatRemaining(remainingSeconds) : "--:--"}
        </div>
      </header>

      <PanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <Panel defaultSize={40} minSize={25} className="flex flex-col overflow-y-auto">
          <div className="p-5">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{activeQuestion.title}</h1>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {activeQuestion.difficulty}
              </span>
              {activeQuestion.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">{activeQuestion.prompt}</p>

            <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <ClipboardList className="size-3.5" /> {activeQuestion.total_test_cases} test cases (
              {activeQuestion.open_test_cases.length} shown below, rest hidden)
            </div>
            {activeQuestion.open_test_cases.map((tc, i) => (
              <div key={i} className="mt-2 rounded-md border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-800">
                <p className="text-zinc-500">Input: {tc.input}</p>
                <p className="text-zinc-500">Output: {tc.expected_output}</p>
              </div>
            ))}

            {isSubmitted && (
              <div className="mt-5 flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <CheckCircle2 className="size-3.5" /> Submitted ({activeState.submission?.test_results.passed}/
                {activeState.submission?.test_results.total} test cases passed)
              </div>
            )}
          </div>
        </Panel>

        <ResizeHandle />

        <Panel defaultSize={60} minSize={35} className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <select
              value={activeState.language}
              onChange={(e) => changeLanguage(e.target.value)}
              disabled={isSubmitted}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {DSA_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={runCode} disabled={isRunning || isSubmitted}>
                {isRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />} Run
              </Button>
              {isTesting ? (
                <Button variant="outline" size="sm" onClick={stopTests}>
                  <Square className="size-3.5" /> Stop
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={runTests} disabled={isSubmitted}>
                  <ClipboardList className="size-3.5" /> Run Tests
                </Button>
              )}
              <Button size="sm" onClick={submitActiveQuestion} disabled={isSubmitting || isSubmitted}>
                <Send className="size-3.5" /> {isSubmitted ? "Submitted" : isSubmitting ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </div>

          {activeState.submitError && (
            <p className="border-b border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              {activeState.submitError}
            </p>
          )}

          <PanelGroup orientation="vertical" className="min-h-0 flex-1">
            <Panel defaultSize={65} minSize={30}>
              <Editor
                height="100%"
                language={getDsaLanguage(activeState.language).monaco}
                value={activeState.code}
                onChange={(value) => !isSubmitted && updateState(activeQuestion.id, { code: value ?? "" })}
                theme="vs-dark"
                options={{ ...DSA_EDITOR_OPTIONS, readOnly: isSubmitted }}
              />
            </Panel>

            <ResizeHandle direction="vertical" />

            <Panel defaultSize={35} minSize={15} className="flex min-h-0 flex-col">
              <div className="flex h-8 shrink-0 items-center gap-1 border-b border-zinc-200 px-2 dark:border-zinc-800">
                <button
                  onClick={() => setBottomTab("console")}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                    bottomTab === "console" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" : "text-zinc-500"
                  }`}
                >
                  <Terminal className="size-3.5" /> Console
                </button>
                <button
                  onClick={() => setBottomTab("tests")}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                    bottomTab === "tests" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" : "text-zinc-500"
                  }`}
                >
                  <ClipboardList className="size-3.5" /> Test Results
                  {activeState.testRun && (
                    <span className="ml-0.5">
                      ({activeState.testRun.results.filter((r) => r.result.passed).length}/{activeState.testRun.results.length}
                      {activeState.testRun.isRunning ? "…" : ""})
                    </span>
                  )}
                </button>
              </div>
              <div className="min-h-0 flex-1">
                {bottomTab === "console" ? (
                  <ConsolePanel
                    stdin={activeState.stdin}
                    onStdinChange={(stdin) => updateState(activeQuestion.id, { stdin })}
                    output={activeState.output}
                    disabled={isSubmitted}
                  />
                ) : (
                  <TestResultsPanel testRun={activeState.testRun} totalTestCases={activeQuestion.total_test_cases} />
                )}
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>

      {isTimeCritical && (
        <div className="flex items-center justify-center gap-1.5 border-t border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-300">
          <AlertTriangle className="size-3.5" /> Under 5 minutes left, unsubmitted questions will auto-submit at zero.
        </div>
      )}
    </div>
  );
}
