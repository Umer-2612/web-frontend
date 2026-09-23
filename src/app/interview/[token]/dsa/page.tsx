"use client";

import Editor from "@monaco-editor/react";
import { ChevronLeft, Loader2, Play, Send, Terminal } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { AiLoader } from "@/components/ui/ai-loader";
import { Button } from "@/components/ui/button";
import { DSA_EDITOR_OPTIONS, DSA_LANGUAGES, getDsaLanguage } from "@/lib/dsa-constants";
import { PortalApiError, portalApi, type DsaRoundView } from "@/lib/portal-api";

type OutputLine = { type: "log" | "error" | "warn" | "result"; content: string };

function getStarterCode(question: DsaRoundView["question"], languageId: string): string {
  return question.starter_code[languageId] ?? "// Write your solution here\n";
}

function buildOutputLines(result: Awaited<ReturnType<typeof portalApi.execute>>): OutputLine[] {
  if (!result.success) {
    return [{ type: "error", content: result.error ?? "Execution failed" }];
  }

  const lines: OutputLine[] = [];
  if (result.compileOutput) lines.push({ type: "error", content: result.compileOutput.trimEnd() });
  if (result.stdout) result.stdout.split("\n").forEach((line) => lines.push({ type: "log", content: line }));
  if (result.stderr) result.stderr.split("\n").filter(Boolean).forEach((line) => lines.push({ type: "error", content: line }));

  const description = result.status?.description;
  if (description && description !== "Accepted") lines.push({ type: "warn", content: `Status: ${description}` });
  if (result.time || result.memory) lines.push({ type: "result", content: `Finished in ${result.time ?? "?"}s, ${result.memory ?? "?"}KB` });

  return lines.length > 0 ? lines : [{ type: "log", content: "(No output)" }];
}

export default function DsaRoundPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [view, setView] = useState<DsaRoundView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    portalApi
      .getDsaRound(token)
      .then((data) => {
        setView(data);
        if (data.round.submission) {
          setLanguage(data.round.submission.language);
          setCode(data.round.submission.code);
          setSubmitted(true);
        } else {
          const firstLanguage = DSA_LANGUAGES.find((lang) => data.question.starter_code[lang.id])?.id ?? "javascript";
          setLanguage(firstLanguage);
          setCode(getStarterCode(data.question, firstLanguage));
        }
      })
      .catch((err) => setLoadError(err instanceof PortalApiError ? err.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, [token]);

  const changeLanguage = (nextLanguage: string) => {
    if (submitted || !view) return;
    setLanguage(nextLanguage);
    setCode(getStarterCode(view.question, nextLanguage));
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput([{ type: "log", content: "Running…" }]);
    try {
      const result = await portalApi.execute(getDsaLanguage(language).judge0Id, code, stdin);
      setOutput(buildOutputLines(result));
    } catch {
      setOutput([{ type: "error", content: "Could not reach the code execution service" }]);
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (!window.confirm("Submit your final code? You won't be able to change it after this.")) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await portalApi.submitDsaRound(token, code, language);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof PortalApiError ? err.message : "Submission failed, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <AiLoader fullScreen label="Loading the DSA round" />;

  if (loadError || !view) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">This round isn&apos;t available</p>
        <p className="max-w-sm text-sm text-zinc-500">{loadError ?? "Something went wrong."}</p>
      </div>
    );
  }

  const { question } = view;

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        <Link
          href={`/interview/${token}`}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ChevronLeft className="size-4" /> Back
        </Link>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">DSA Round</span>
        {submitted ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Submitted
          </span>
        ) : (
          <span className="w-16" />
        )}
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col overflow-y-auto border-b border-zinc-200 p-5 lg:border-r lg:border-b-0 dark:border-zinc-800">
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{question.title}</h1>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {question.difficulty}
            </span>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">{question.prompt}</p>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              disabled={submitted}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {DSA_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={runCode} disabled={isRunning || submitted}>
                {isRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />} Run
              </Button>
              <Button size="sm" onClick={submitCode} disabled={isSubmitting || submitted}>
                <Send className="size-3.5" /> {submitted ? "Submitted" : isSubmitting ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-[3]">
            <Editor
              height="100%"
              language={getDsaLanguage(language).monaco}
              value={code}
              onChange={(value) => !submitted && setCode(value ?? "")}
              theme="vs-dark"
              options={{ ...DSA_EDITOR_OPTIONS, readOnly: submitted }}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col border-t border-zinc-200 dark:border-zinc-800">
            <div className="grid min-h-0 flex-1 grid-cols-2">
              <div className="flex min-h-0 flex-col border-r border-zinc-200 dark:border-zinc-800">
                <div className="border-b border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:border-zinc-800">
                  Input
                </div>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="stdin passed to your program…"
                  disabled={submitted}
                  className="min-h-0 flex-1 resize-none bg-transparent px-3 py-2 font-mono text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none dark:text-zinc-300"
                />
              </div>
              <div className="flex min-h-0 flex-col">
                <div className="flex items-center gap-1.5 border-b border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:border-zinc-800">
                  <Terminal className="size-3.5" /> Output
                </div>
                <div className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-xs">
                  {output.length === 0 ? (
                    <p className="text-zinc-400">Run your code to see output here.</p>
                  ) : (
                    output.map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.type === "error"
                            ? "text-red-500"
                            : line.type === "warn"
                              ? "text-amber-500"
                              : line.type === "result"
                                ? "text-emerald-500"
                                : "text-zinc-600 dark:text-zinc-300"
                        }
                      >
                        {line.content}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {submitError && <p className="border-t border-zinc-200 px-3 py-2 text-xs text-red-600 dark:border-zinc-800">{submitError}</p>}
        </div>
      </div>
    </div>
  );
}
