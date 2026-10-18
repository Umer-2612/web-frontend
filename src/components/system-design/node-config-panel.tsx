"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getComponent, type ConfigKey } from "@/lib/system-design/catalog";
import type { NodeConfig, SizeClass } from "@/lib/system-design/types";
import type { AwsFlowNode } from "./use-board-state";

const SIZE_OPTIONS: { id: SizeClass; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
  { id: "xlarge", label: "Extra large" },
];

/** What "instances" means differs per service. */
const INSTANCE_LABEL: Record<string, string> = { alb: "Load balancers", kinesis: "Shards", elasticache: "Cache nodes", opensearch: "Search nodes" };

function NumberField({ label, value, min, max, hint, disabled, onCommit }: { label: string; value: number; min: number; max: number; hint?: string; disabled?: boolean; onCommit: (n: number) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const parsed = Number(draft.replace(/,/g, ""));
    if (!Number.isFinite(parsed)) return setDraft(String(value));
    const next = Math.min(max, Math.max(min, Math.round(parsed)));
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="h-8 tabular-nums"
      />
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, hint, onChange }: { label: string; checked: boolean; hint?: string; onChange: (next: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{label}</p>
        {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${checked ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"}`}
      >
        <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}

export function NodeConfigPanel({
  node,
  readOnly,
  onConfig,
  onLabel,
  onRemove,
}: {
  node: AwsFlowNode | null;
  readOnly?: boolean;
  onConfig: (id: string, patch: Partial<NodeConfig>) => void;
  onLabel: (id: string, label: string) => void;
  onRemove: (id: string) => void;
}) {
  if (!node) {
    return (
      <div className="p-5 text-sm text-zinc-500">
        <p className="font-medium text-zinc-700 dark:text-zinc-200">Nothing selected</p>
        <p className="mt-1">Click a component on the board to set how it is sized and deployed. The load test uses these settings.</p>
      </div>
    );
  }

  const info = getComponent(node.data.type);
  const cfg = node.data.config;
  const has = (key: ConfigKey) => info.config_keys.includes(key);
  const autoscalingOn = Boolean(cfg.autoscaling?.enabled);
  const sizeId = `${node.id}-size`;
  const patch = (p: Partial<NodeConfig>) => onConfig(node.id, p);

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-start gap-3">
        {info.icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={info.icon} alt="" className="size-10 shrink-0 rounded-lg" />
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{info.label}</h2>
          <p className="text-xs text-zinc-500">{info.description}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${node.id}-name`}>Name</Label>
        <Input id={`${node.id}-name`} value={node.data.label ?? ""} placeholder={info.label} maxLength={60} disabled={readOnly} onChange={(e) => onLabel(node.id, e.target.value)} className="h-8" />
      </div>

      {info.config_keys.length === 0 && <p className="text-xs text-zinc-500">No settings. This component just needs to be in the right place.</p>}

      <fieldset disabled={readOnly} className="space-y-4 disabled:opacity-70">
        {has("instances") && (
          <NumberField
            label={INSTANCE_LABEL[node.data.type] ?? "Instances"}
            value={cfg.instances ?? 1}
            min={1}
            max={10_000}
            disabled={autoscalingOn}
            hint={autoscalingOn ? "Autoscaling decides this." : undefined}
            onCommit={(n) => patch({ instances: n })}
          />
        )}

        {has("autoscaling") && (
          <div className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <Toggle
              label="Autoscaling"
              hint="Adds instances as load grows, within the limits below."
              checked={autoscalingOn}
              onChange={(enabled) => patch({ autoscaling: { min: cfg.autoscaling?.min ?? 1, max: cfg.autoscaling?.max ?? 10, enabled } })}
            />
            {autoscalingOn && (
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Minimum" value={cfg.autoscaling?.min ?? 1} min={1} max={10_000} onCommit={(n) => patch({ autoscaling: { enabled: true, min: n, max: Math.max(n, cfg.autoscaling?.max ?? n) } })} />
                <NumberField label="Maximum" value={cfg.autoscaling?.max ?? 10} min={1} max={10_000} onCommit={(n) => patch({ autoscaling: { enabled: true, min: Math.min(n, cfg.autoscaling?.min ?? 1), max: n } })} />
              </div>
            )}
          </div>
        )}

        {has("size") && (
          <div className="space-y-1.5">
            <Label htmlFor={sizeId}>Instance size</Label>
            <select
              id={sizeId}
              value={cfg.size ?? "medium"}
              onChange={(e) => patch({ size: e.target.value as SizeClass })}
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {SIZE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id} className="text-zinc-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {has("read_replicas") && (
          <NumberField
            label="Read replicas"
            value={cfg.read_replicas ?? 0}
            min={0}
            max={node.data.type === "aurora" ? 15 : 5}
            hint="Copies that serve reads, so the writer only handles writes."
            onCommit={(n) => patch({ read_replicas: n })}
          />
        )}

        {has("multi_az") && (
          <Toggle label="Multi-AZ" hint="Spread across Availability Zones so one zone failing doesn't take it down." checked={Boolean(cfg.multi_az)} onChange={(multi_az) => patch({ multi_az })} />
        )}

        {has("cache_hit_ratio") && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${node.id}-hit`}>Expected cache hit rate</Label>
              <span className="text-sm font-medium tabular-nums">{Math.round((cfg.cache_hit_ratio ?? 0.8) * 100)}%</span>
            </div>
            <input
              id={`${node.id}-hit`}
              type="range"
              min={0}
              max={95}
              step={5}
              value={Math.round((cfg.cache_hit_ratio ?? 0.8) * 100)}
              onChange={(e) => patch({ cache_hit_ratio: Number(e.target.value) / 100 })}
              className="w-full accent-indigo-600"
            />
            <p className="text-xs text-zinc-500">Your assumption: the share of reads answered here instead of reaching the next tier.</p>
          </div>
        )}

        {has("provisioned_capacity") && (
          <NumberField label="Capacity (requests per second)" value={cfg.provisioned_capacity ?? 0} min={0} max={1_000_000_000} onCommit={(n) => patch({ provisioned_capacity: n })} />
        )}

        {has("concurrency_limit") && (
          <NumberField label="Concurrency limit" value={cfg.concurrency_limit ?? 1000} min={1} max={1_000_000} hint="How many invocations can run at once." onCommit={(n) => patch({ concurrency_limit: n })} />
        )}
      </fieldset>

      {!readOnly && (
        <Button variant="outline" size="sm" onClick={() => onRemove(node.id)} className="w-full text-red-600 hover:text-red-700 dark:text-red-400">
          <Trash2 /> Remove from board
        </Button>
      )}
    </div>
  );
}
