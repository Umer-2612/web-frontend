"use client";

import { addEdge, useEdgesState, useNodesState, type Connection, type Edge, type Node } from "@xyflow/react";
import { useCallback, useMemo, useRef, useState } from "react";

import { getComponent, type ComponentType } from "@/lib/system-design/catalog";
import type { Board, NodeConfig, NodeResult } from "@/lib/system-design/types";

export interface AwsNodeData extends Record<string, unknown> {
  type: ComponentType;
  label?: string;
  config: NodeConfig;
  /** Painted from the latest simulation; never saved. */
  sim?: NodeResult;
  /** The board changed since `sim` was computed. */
  stale?: boolean;
}
export type AwsFlowNode = Node<AwsNodeData, "aws">;

/** Datastores are where requests end, so they never start an arrow. */
const TERMINAL_TYPES: ComponentType[] = ["rds", "aurora", "dynamodb", "s3", "opensearch"];

export function hasSourceHandle(type: ComponentType): boolean {
  return !TERMINAL_TYPES.includes(type);
}
export function hasTargetHandle(type: ComponentType): boolean {
  return type !== "users";
}

function withDefaults(type: ComponentType, config?: NodeConfig): NodeConfig {
  const defaults = getComponent(type).defaults;
  return { ...defaults, ...(config ?? {}), ...(defaults.autoscaling ? { autoscaling: { ...defaults.autoscaling, ...(config?.autoscaling ?? {}) } } : {}) };
}

function gridPosition(index: number) {
  return { x: 60 + (index % 4) * 190, y: 60 + Math.floor(index / 4) * 150 };
}

function toFlowNodes(board: Board): AwsFlowNode[] {
  return board.nodes.map((n, i) => ({
    id: n.id,
    type: "aws",
    position: n.position ?? gridPosition(i),
    data: { type: n.type, label: n.label, config: withDefaults(n.type, n.config) },
  }));
}

function edgeFor(source: string, target: string, id?: string): Edge {
  return { id: id ?? `${source}->${target}`, source, target, type: "smoothstep" };
}

export function toBoard(nodes: AwsFlowNode[], edges: Edge[]): Board {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.type,
      ...(n.data.label ? { label: n.data.label } : {}),
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      config: n.data.config,
    })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  };
}

function newId(type: ComponentType): string {
  return `${type}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Owns the canvas state (React Flow nodes/edges) and the edits the sidebar, canvas and config
 * panel make to it. `structureKey` ignores positions, so it only changes when the design does. */
export function useBoardState(initial: Board) {
  const [seed] = useState(() => ({ nodes: toFlowNodes(initial), edges: initial.edges.map((e) => edgeFor(e.source, e.target, e.id)) }));
  const [nodes, setNodes, onNodesChange] = useNodesState<AwsFlowNode>(seed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(seed.edges);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  const board = useMemo(() => toBoard(nodes, edges), [nodes, edges]);

  const structureKey = useMemo(
    () =>
      JSON.stringify([
        nodes.map((n) => [n.id, n.data.type, n.data.label ?? "", n.data.config]),
        edges.map((e) => [e.source, e.target]),
      ]),
    [nodes, edges],
  );

  const addNode = useCallback(
    (type: ComponentType, position?: { x: number; y: number }): string => {
      const id = newId(type);
      setNodes((current) => [
        ...current.map((n) => (n.selected ? { ...n, selected: false } : n)),
        { id, type: "aws", position: position ?? gridPosition(current.length), data: { type, config: withDefaults(type) }, selected: true },
      ]);
      return id;
    },
    [setNodes],
  );

  const updateConfig = useCallback(
    (id: string, patch: Partial<NodeConfig>) => {
      setNodes((current) => current.map((n) => (n.id === id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...patch } } } : n)));
    },
    [setNodes],
  );

  const updateLabel = useCallback(
    (id: string, label: string) => {
      setNodes((current) => current.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: label.trim() ? label : undefined } } : n)));
    },
    [setNodes],
  );

  /** Selects one node (or none) and deselects the rest. */
  const selectNode = useCallback(
    (id: string | null) => setNodes((current) => current.map((n) => (n.selected === (n.id === id) ? n : { ...n, selected: n.id === id }))),
    [setNodes],
  );

  const removeNode = useCallback(
    (id: string) => {
      setNodes((current) => current.filter((n) => n.id !== id));
      setEdges((current) => current.filter((e) => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges],
  );

  const isValidConnection = useCallback((c: Connection | Edge): boolean => {
    if (!c.source || !c.target || c.source === c.target) return false;
    const source = nodesRef.current.find((n) => n.id === c.source);
    const target = nodesRef.current.find((n) => n.id === c.target);
    if (!source || !target) return false;
    if (!hasSourceHandle(source.data.type) || !hasTargetHandle(target.data.type)) return false;
    return !edgesRef.current.some((e) => e.source === c.source && e.target === c.target);
  }, []);

  const onConnect = useCallback(
    (c: Connection) => {
      if (!isValidConnection(c)) return;
      setEdges((current) => addEdge(edgeFor(c.source!, c.target!), current));
    },
    [isValidConnection, setEdges],
  );

  return { nodes, edges, board, structureKey, onNodesChange, onEdgesChange, onConnect, isValidConnection, addNode, updateConfig, updateLabel, removeNode, selectNode };
}

export type BoardState = ReturnType<typeof useBoardState>;
