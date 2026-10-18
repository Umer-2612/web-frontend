"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, type SystemDesignProblem, type SystemDesignProblemInput } from "@/lib/api";

interface FormState {
  title: string;
  prompt: string;
  difficulty: SystemDesignProblem["difficulty"];
  target_rps: string;
  read_pct: string;
  peak_multiplier: string;
  data_size_gb: string;
  latency_slo_ms: string;
  availability_slo: string;
}

const EMPTY: FormState = {
  title: "",
  prompt: "",
  difficulty: "medium",
  target_rps: "100000",
  read_pct: "80",
  peak_multiplier: "3",
  data_size_gb: "500",
  latency_slo_ms: "200",
  availability_slo: "99.9",
};

function fromProblem(p: SystemDesignProblem): FormState {
  const r = p.requirements;
  return {
    title: p.title,
    prompt: p.prompt,
    difficulty: p.difficulty,
    target_rps: String(r.target_rps),
    read_pct: String(Math.round(r.read_ratio * 100)),
    peak_multiplier: String(r.peak_multiplier),
    data_size_gb: String(r.data_size_gb),
    latency_slo_ms: String(r.latency_slo_ms),
    availability_slo: String(r.availability_slo),
  };
}

/** Returns the API payload, or the first thing wrong with the form. */
function toInput(f: FormState): { input: SystemDesignProblemInput } | { error: string } {
  const num = (v: string) => Number(v.replace(/,/g, ""));
  const target = num(f.target_rps);
  const read = num(f.read_pct);
  const peak = num(f.peak_multiplier);
  const data = num(f.data_size_gb);
  const latency = num(f.latency_slo_ms);
  const availability = num(f.availability_slo);

  if (!f.title.trim()) return { error: "Add a title." };
  if (!f.prompt.trim()) return { error: "Describe what the candidate should design." };
  if (!(target > 0)) return { error: "Target load must be more than 0 requests per second." };
  if (!(read >= 0 && read <= 100)) return { error: "Read share must be between 0 and 100%." };
  if (!(peak >= 1 && peak <= 100)) return { error: "Spike multiplier must be between 1 and 100." };
  if (!(data >= 0)) return { error: "Data size can't be negative." };
  if (!(latency > 0)) return { error: "Latency goal must be more than 0 ms." };
  if (!(availability >= 50 && availability <= 100)) return { error: "Availability goal must be between 50 and 100%." };

  return {
    input: {
      title: f.title.trim(),
      prompt: f.prompt.trim(),
      difficulty: f.difficulty,
      requirements: { target_rps: target, read_ratio: read / 100, peak_multiplier: peak, data_size_gb: data, latency_slo_ms: latency, availability_slo: availability },
    },
  };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

/** Create, edit, or (for presets and used problems) just read a system design problem. */
export function ProblemFormDialog({
  open,
  problem,
  readOnly,
  readOnlyReason,
  onClose,
  onSaved,
}: {
  open: boolean;
  problem: SystemDesignProblem | null;
  readOnly: boolean;
  readOnlyReason?: string;
  onClose: () => void;
  onSaved: (problem: SystemDesignProblem) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(problem ? fromProblem(problem) : EMPTY);
      setError(null);
    }
  }, [open, problem]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = toInput(form);
    if ("error" in parsed) return setError(parsed.error);
    setError(null);
    setSaving(true);
    try {
      const saved = problem ? await api.updateSystemDesignProblem(problem.id, parsed.input) : await api.createSystemDesignProblem(parsed.input);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save the problem.");
    } finally {
      setSaving(false);
    }
  };

  const title = readOnly ? problem?.title ?? "Problem" : problem ? "Edit problem" : "New problem";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {readOnly ? readOnlyReason ?? "This problem can't be edited." : "Candidates design a system for this problem, and the load test uses the numbers below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={readOnly || saving} className="space-y-4">
            <Field label="Title">{(id) => <Input id={id} value={form.title} onChange={set("title")} maxLength={200} placeholder="Design a URL shortener" />}</Field>
            <Field label="What should the candidate design?" hint="Say what the system does and what to cover: storage, scaling, failures, security, monitoring.">
              {(id) => <Textarea id={id} value={form.prompt} onChange={set("prompt")} rows={6} maxLength={8000} />}
            </Field>
            <Field label="Difficulty">
              {(id) => (
                <select id={id} value={form.difficulty} onChange={set("difficulty")} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Target load (requests per second)">{(id) => <Input id={id} inputMode="numeric" value={form.target_rps} onChange={set("target_rps")} />}</Field>
              <Field label="Reads (% of traffic)" hint="The rest is writes.">{(id) => <Input id={id} inputMode="numeric" value={form.read_pct} onChange={set("read_pct")} />}</Field>
              <Field label="Traffic spike (× the target)" hint="Used by the spike load test.">{(id) => <Input id={id} inputMode="decimal" value={form.peak_multiplier} onChange={set("peak_multiplier")} />}</Field>
              <Field label="Data to store (GB)">{(id) => <Input id={id} inputMode="numeric" value={form.data_size_gb} onChange={set("data_size_gb")} />}</Field>
              <Field label="Latency goal, p99 (ms)">{(id) => <Input id={id} inputMode="numeric" value={form.latency_slo_ms} onChange={set("latency_slo_ms")} />}</Field>
              <Field label="Availability goal (%)">{(id) => <Input id={id} inputMode="decimal" value={form.availability_slo} onChange={set("availability_slo")} />}</Field>
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : problem ? "Save changes" : "Create problem"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
