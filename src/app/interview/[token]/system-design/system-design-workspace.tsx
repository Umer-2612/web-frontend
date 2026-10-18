"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { AlertTriangle, Check, Loader2, Maximize2, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group as PanelGroup, Panel } from "react-resizable-panels";

import { BoardCanvas, type FocusRequest } from "@/components/system-design/board-canvas";
import { ComponentSidebar } from "@/components/system-design/component-sidebar";
import { NodeConfigPanel } from "@/components/system-design/node-config-panel";
import { useBoardState } from "@/components/system-design/use-board-state";
import { Button } from "@/components/ui/button";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { PortalApiError, portalApi, type SubmitSystemDesignEvent, type SystemDesignRoundView } from "@/lib/portal-api";
import { getComponent, type ComponentType } from "@/lib/system-design/catalog";
import type { SimulationResult } from "@/lib/system-design/types";
import { useFocusLossProctoring } from "../dsa/use-focus-loss-proctoring";
import { formatRemaining, useRoundTimer } from "../dsa/use-round-timer";
import { ProblemPanel } from "./problem-panel";
import { SimulationPanel } from "./simulation-panel";
import { SubmitDesignDialog } from "./submit-design-dialog";
import { useBoardAutosave, type SaveState } from "./use-board-autosave";

type Tab = "problem" | "config" | "simulation";
const TABS: { id: Tab; label: string }[] = [
  { id: "problem", label: "Problem" },
  { id: "config", label: "Settings" },
  { id: "simulation", label: "Load test" },
];

const SAVE_LABEL: Record<SaveState, string> = { idle: "", saving: "Saving…", saved: "Saved", error: "Couldn't save, retrying" };

export function SystemDesignWorkspace({ token, initialView, onRoundComplete }: { token: string; initialView: SystemDesignRoundView; onRoundComplete: () => void }) {
  return (
    <ReactFlowProvider>
      <Workspace token={token} initialView={initialView} onRoundComplete={onRoundComplete} />
    </ReactFlowProvider>
  );
}

function Workspace({ token, initialView, onRoundComplete }: { token: string; initialView: SystemDesignRoundView; onRoundComplete: () => void }) {
  const state = useBoardState(initialView.board);
  const [tab, setTab] = useState<Tab>("problem");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const [run, setRun] = useState<{ result: SimulationResult; key: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<Extract<SubmitSystemDesignEvent, { type: "progress" }>["stage"] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const autosave = useBoardAutosave(token, state.board, !submitting);
  const focusLossCount = useFocusLossProctoring(token, true, "system-design");

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    handler();
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const present = useMemo(() => new Set<ComponentType>(state.nodes.map((n) => n.data.type)), [state.nodes]);
  const selectedNode = useMemo(() => state.nodes.find((n) => n.id === selectedId) ?? null, [state.nodes, selectedId]);

  const nodeLabel = useCallback(
    (id: string) => {
      const node = state.nodes.find((n) => n.id === id);
      return node ? node.data.label || getComponent(node.data.type).label : "that component";
    },
    [state.nodes],
  );

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) setTab("config");
  }, []);

  const handleFocusNode = useCallback((id: string) => setFocus((prev) => ({ id, n: (prev?.n ?? 0) + 1 })), []);
  const canAdd = useCallback((type: ComponentType) => type !== "users" || !present.has("users"), [present]);

  const handleAdd = (type: ComponentType) => {
    if (!canAdd(type)) return;
    const id = state.addNode(type);
    setSelectedId(id);
    setTab("config");
    handleFocusNode(id);
  };

  const submit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitStage(null);
    try {
      await autosave.flush();
      let failure: string | null = null;
      let finished = false;
      await portalApi.submitSystemDesign(token, state.board, (event) => {
        if (event.type === "progress") setSubmitStage(event.stage);
        else if (event.type === "done") finished = true;
        else failure = event.message;
      });
      if (failure) throw new Error(failure);
      if (!finished) throw new Error("The submission didn't finish. Try again.");
      onRoundComplete();
    } catch (err) {
      // A 409 means this round was already submitted (another tab, or the timer got there first).
      if (err instanceof PortalApiError && err.status === 409) return onRoundComplete();
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Try again.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [autosave, onRoundComplete, state.board, token]);

  const remainingSeconds = useRoundTimer(initialView.started_at, initialView.duration_minutes, () => {
    setConfirming(true);
    void submit();
  });
  const isTimeCritical = remainingSeconds !== null && remainingSeconds <= 300;

  const reenterFullscreen = () => void document.documentElement.requestFullscreen?.().catch(() => {});
  const saveLabel = SAVE_LABEL[autosave.state];
  const staleKey = run && run.key !== state.structureKey;

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <SubmitDesignDialog
        open={confirming || submitting}
        submitting={submitting}
        stage={submitStage}
        error={submitError}
        onCancel={() => {
          setConfirming(false);
          setSubmitError(null);
        }}
        onConfirm={() => void submit()}
      />

      {!isFullscreen && (
        <button onClick={reenterFullscreen} className="flex items-center justify-center gap-2 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300">
          <Maximize2 className="size-3.5" /> You&apos;ve left fullscreen, click to re-enter
        </button>
      )}

      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{initialView.problem.title}</h1>
          <span aria-live="polite" className="flex items-center gap-1 text-xs text-zinc-500">
            {autosave.state === "saving" && <Loader2 className="size-3 animate-spin" />}
            {autosave.state === "saved" && <Check className="size-3 text-emerald-500" />}
            {autosave.state === "error" && <AlertTriangle className="size-3 text-amber-500" />}
            {saveLabel}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {focusLossCount > 0 && (
            <div title="Leaving the screen during the round is logged and visible to the hiring manager." className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              <AlertTriangle className="size-3.5" /> Left screen {focusLossCount}x (logged)
            </div>
          )}
          <div className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${isTimeCritical ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"}`}>
            {remainingSeconds !== null ? formatRemaining(remainingSeconds) : "--:--"}
          </div>
          <Button size="sm" onClick={() => setConfirming(true)} disabled={submitting}>
            <Send /> Submit design
          </Button>
        </div>
      </header>

      <PanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <Panel defaultSize={17} minSize={13} className="min-h-0 border-r border-zinc-200 dark:border-zinc-800">
          <ComponentSidebar present={present} onAdd={handleAdd} />
        </Panel>
        <ResizeHandle />
        <Panel defaultSize={53} minSize={30} className="min-h-0">
          <BoardCanvas state={state} result={run?.result ?? null} stale={Boolean(staleKey)} focus={focus} onSelect={handleSelect} canAdd={canAdd} />
        </Panel>
        <ResizeHandle />
        <Panel defaultSize={30} minSize={20} className="flex min-h-0 flex-col">
          <div role="tablist" aria-label="Side panel" className="flex shrink-0 gap-1 border-b border-zinc-200 px-2 pt-2 dark:border-zinc-800">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                id={`sd-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="sd-tabpanel"
                onClick={() => setTab(t.id)}
                className={`rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  tab === t.id ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* All three stay mounted and are just hidden, so the load test keeps its scenario, hints and
              run count when the candidate flips to Settings and back. */}
          <div role="tabpanel" id="sd-tabpanel" aria-labelledby={`sd-tab-${tab}`} className="min-h-0 flex-1 overflow-y-auto">
            <div hidden={tab !== "problem"}>
              <ProblemPanel problem={initialView.problem} />
            </div>
            <div hidden={tab !== "config"}>
              <NodeConfigPanel
                node={selectedNode}
                onConfig={state.updateConfig}
                onLabel={state.updateLabel}
                onRemove={(id) => {
                  state.removeNode(id);
                  setSelectedId(null);
                }}
              />
            </div>
            <div hidden={tab !== "simulation"}>
              <SimulationPanel
                token={token}
                board={state.board}
                structureKey={state.structureKey}
                result={run?.result ?? null}
                resultKey={run?.key ?? null}
                aiEnabled={initialView.ai_enabled}
                runsUsed={initialView.runs_used}
                runsMax={initialView.runs_max}
                disabled={submitting}
                nodeLabel={nodeLabel}
                onFocusNode={handleFocusNode}
                onResult={(result, key) => setRun({ result, key })}
              />
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
