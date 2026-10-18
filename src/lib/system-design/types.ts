/** Mirrors core-api's system design types (src/modules/portal/system-design/types.ts). The server
 * owns the capacity numbers; the client only needs the shapes. */
import type { ComponentType } from "@/lib/system-design/catalog";

export type SizeClass = "small" | "medium" | "large" | "xlarge";

export interface NodeConfig {
  instances?: number;
  autoscaling?: { enabled: boolean; min?: number; max?: number };
  multi_az?: boolean;
  read_replicas?: number;
  cache_hit_ratio?: number;
  provisioned_capacity?: number;
  concurrency_limit?: number;
  size?: SizeClass;
}

export interface BoardNode {
  id: string;
  type: ComponentType;
  label?: string;
  position?: { x: number; y: number };
  config?: NodeConfig;
}

export interface BoardEdge {
  id: string;
  source: string;
  target: string;
}

export interface Board {
  nodes: BoardNode[];
  edges: BoardEdge[];
}

export interface ProblemRequirements {
  target_rps: number;
  read_ratio: number;
  peak_multiplier: number;
  data_size_gb: number;
  latency_slo_ms: number;
  availability_slo: number;
}

export type Scenario = "steady" | "spike" | "az_failure";
export const SCENARIOS: { id: Scenario; label: string; hint: string }[] = [
  { id: "steady", label: "Steady load", hint: "The target traffic, sustained." },
  { id: "spike", label: "Traffic spike", hint: "A sudden surge. Autoscaling needs time to catch up." },
  { id: "az_failure", label: "Zone outage", hint: "An Availability Zone goes down. Single-zone components are lost." },
];

export type NodeStatus = "ok" | "hot" | "failed" | "degraded" | "idle";

export interface NodeResult {
  node_id: string;
  load_rps: number;
  capacity_rps: number | null;
  utilization: number;
  status: NodeStatus;
  reason: string;
}

export type FindingSeverity = "critical" | "warning" | "info";

export interface Finding {
  code: string;
  severity: FindingSeverity;
  category: "capacity" | "reliability" | "security" | "observability" | "design";
  node_id?: string;
  title: string;
  detail: string;
}

export interface SimulationResult {
  scenario: Scenario;
  offered_rps: number;
  nodes: NodeResult[];
  success_rate: number;
  est_p99_ms: number;
  bottleneck_node_id: string | null;
  slo: { latency_ok: boolean; availability_ok: boolean };
  findings: Finding[];
}

export interface AiHint {
  node_id?: string;
  text: string;
}

export interface EvaluationResult {
  summary: string;
  failure_points: { node_id?: string; issue: string; severity: FindingSeverity; suggested_fix: string }[];
  scores: { scalability: number; reliability: number; security: number; observability: number; cost_efficiency: number };
  strengths: string[];
  overall: number;
}

/** What the hiring manager reads back from a submitted round's `submissions`. */
export interface SystemDesignSubmission {
  board: Board;
  engine_results: Record<Scenario, SimulationResult>;
  evaluation: EvaluationResult | null;
  evaluation_status: "ok" | "unavailable" | "skipped";
  submitted_at: string;
}
