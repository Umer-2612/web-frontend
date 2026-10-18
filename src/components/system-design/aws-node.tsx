"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Users } from "lucide-react";
import { memo } from "react";

import { cn } from "@/lib/utils";
import { getComponent } from "@/lib/system-design/catalog";
import { formatRps } from "@/lib/system-design/format";
import type { NodeStatus } from "@/lib/system-design/types";
import { hasSourceHandle, hasTargetHandle, type AwsFlowNode } from "./use-board-state";

export const STATUS_STYLE: Record<NodeStatus, { ring: string; badge: string; label: string }> = {
  ok: { ring: "ring-2 ring-emerald-500", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300", label: "Healthy" },
  hot: { ring: "ring-2 ring-amber-500", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300", label: "Running hot" },
  failed: { ring: "ring-[3px] ring-red-500", badge: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300", label: "Overloaded" },
  degraded: { ring: "ring-2 ring-orange-400 ring-dashed", badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300", label: "Degraded" },
  idle: { ring: "ring-1 ring-zinc-300 dark:ring-zinc-700", badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", label: "Not connected" },
};

const handleStyle = { width: 12, height: 12 };

function AwsNodeView({ data, selected }: NodeProps<AwsFlowNode>) {
  const info = getComponent(data.type);
  const sim = data.sim;
  const status = sim?.status;
  const showLoad = sim && sim.status !== "idle" && sim.capacity_rps !== null;

  return (
    <div className={cn("flex w-28 flex-col items-center gap-1.5", data.stale && sim && "opacity-60")}>
      {hasTargetHandle(data.type) && <Handle type="target" position={Position.Left} style={handleStyle} />}
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-xl bg-white shadow-sm ring-offset-2 ring-offset-white transition-shadow dark:bg-zinc-900 dark:ring-offset-zinc-950",
          status ? STATUS_STYLE[status].ring : selected ? "ring-2 ring-indigo-500" : "ring-1 ring-zinc-200 dark:ring-zinc-700",
          selected && status && "shadow-md shadow-indigo-500/30",
        )}
        title={sim?.reason}
      >
        {info.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={info.icon} alt="" draggable={false} className="size-11 rounded-md" />
        ) : (
          <Users className="size-7 text-zinc-500" aria-hidden />
        )}
      </div>
      <p className="max-w-full truncate text-center text-xs font-medium text-zinc-800 dark:text-zinc-200">{data.label || info.label}</p>
      {showLoad && status && (
        <p className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap tabular-nums", STATUS_STYLE[status].badge)}>
          {formatRps(sim.load_rps)} rps · {sim.utilization >= 9.99 ? ">999" : Math.round(sim.utilization * 100)}%
        </p>
      )}
      {sim && sim.status === "degraded" && <p className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:text-orange-300">Degraded</p>}
      {hasSourceHandle(data.type) && <Handle type="source" position={Position.Right} style={handleStyle} />}
    </div>
  );
}

export const AwsNode = memo(AwsNodeView);
