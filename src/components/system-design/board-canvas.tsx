"use client";

import { Background, BackgroundVariant, Controls, MarkerType, MiniMap, ReactFlow, useNodesInitialized, useReactFlow, useStore, type Edge, type OnSelectionChangeParams } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, type DragEvent } from "react";

import { DRAG_MIME, isComponentType } from "@/lib/system-design/catalog-guards";
import type { SimulationResult } from "@/lib/system-design/types";
import { AwsNode } from "./aws-node";
import type { AwsFlowNode, BoardState } from "./use-board-state";

const NODE_TYPES = { aws: AwsNode };
const EDGE_COLOR = { ok: "#6366f1", hot: "#f59e0b", failed: "#ef4444", idle: "#a1a1aa" };

export interface FocusRequest {
  id: string;
  /** Bumped on every request so asking for the same node twice still pans. */
  n: number;
}

export interface BoardCanvasProps {
  state: BoardState;
  readOnly?: boolean;
  result?: SimulationResult | null;
  /** The design changed since `result` was computed. */
  stale?: boolean;
  focus?: FocusRequest | null;
  onSelect?: (nodeId: string | null) => void;
  /** Blocks dropping a second Users node, etc. */
  canAdd?: (type: import("@/lib/system-design/catalog").ComponentType) => boolean;
}

/** The React Flow canvas. Must be rendered inside a <ReactFlowProvider>. */
export function BoardCanvas({ state, readOnly = false, result, stale = false, focus, onSelect, canAdd }: BoardCanvasProps) {
  const { screenToFlowPosition, setCenter, getNode, fitView } = useReactFlow<AwsFlowNode>();
  const nodesInitialized = useNodesInitialized();
  // Measured container size; fitting before it is known zooms all the way out.
  const hasSize = useStore((store) => store.width > 0 && store.height > 0);
  const hasFitted = useRef(false);
  const { resolvedTheme } = useTheme();

  const simById = useMemo(() => new Map(result?.nodes.map((n) => [n.node_id, n]) ?? []), [result]);

  const nodes = useMemo(
    () => state.nodes.map((n) => ({ ...n, data: { ...n.data, sim: simById.get(n.id), stale } })),
    [state.nodes, simById, stale],
  );

  // Arrows show where the load flows once a simulation has run: animated while traffic reaches the
  // target, red when the target is overloaded.
  const edges = useMemo<Edge[]>(
    () =>
      state.edges.map((e) => {
        const sim = simById.get(e.target);
        const tone = !sim || sim.status === "idle" ? "idle" : sim.status === "failed" ? "failed" : sim.status === "hot" ? "hot" : "ok";
        const live = Boolean(sim) && sim!.status !== "idle" && !stale;
        return {
          ...e,
          animated: live,
          markerEnd: { type: MarkerType.ArrowClosed, color: sim ? EDGE_COLOR[tone] : EDGE_COLOR.idle },
          style: { stroke: sim ? EDGE_COLOR[tone] : EDGE_COLOR.idle, strokeWidth: live ? 2.25 : 1.75, opacity: stale && sim ? 0.5 : 1 },
        };
      }),
    [state.edges, simById, stale],
  );

  const handleDragOver = useCallback((event: DragEvent) => {
    if (!event.dataTransfer.types.includes(DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      const type = event.dataTransfer.getData(DRAG_MIME);
      if (readOnly || !isComponentType(type)) return;
      event.preventDefault();
      if (canAdd && !canAdd(type)) return;
      const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      state.addNode(type, { x: point.x - 56, y: point.y - 28 });
    },
    [readOnly, canAdd, screenToFlowPosition, state],
  );

  const handleSelection = useCallback(({ nodes: selected }: OnSelectionChangeParams) => onSelect?.(selected[0]?.id ?? null), [onSelect]);

  // Fit once, after the nodes are measured and the resizable panel has its real width. The `fitView`
  // prop alone runs too early (the panel is still 0px wide) and leaves a tiny, off-centre board.
  useEffect(() => {
    if (!nodesInitialized || !hasSize || hasFitted.current || state.nodes.length === 0) return;
    const timer = setTimeout(() => {
      hasFitted.current = true;
      void fitView({ padding: 0.3, maxZoom: 1, duration: 0 });
    }, 150);
    return () => clearTimeout(timer);
  }, [nodesInitialized, hasSize, state.nodes.length, fitView]);

  useEffect(() => {
    if (!focus) return;
    const node = getNode(focus.id);
    if (node) void setCenter(node.position.x + 56, node.position.y + 28, { zoom: 1.1, duration: 400 });
  }, [focus, getNode, setCenter]);

  return (
    <div className="relative h-full w-full" onDragOver={handleDragOver} onDrop={handleDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={readOnly ? undefined : state.onNodesChange}
        onEdgesChange={readOnly ? undefined : state.onEdgesChange}
        onConnect={readOnly ? undefined : state.onConnect}
        isValidConnection={state.isValidConnection}
        onSelectionChange={handleSelection}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable
        deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        minZoom={0.3}
        maxZoom={1.75}
        proOptions={{ hideAttribution: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable className="!hidden md:!block" />
      </ReactFlow>
      {!readOnly && nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-xs rounded-xl border border-dashed border-zinc-300 bg-white/80 px-5 py-4 text-center backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Start with your users</p>
            <p className="mt-1 text-xs text-zinc-500">Drag components from the left onto the board, then connect them in the order a request travels.</p>
          </div>
        </div>
      )}
    </div>
  );
}
