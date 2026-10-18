import { Maximize2, MousePointerClick, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SystemDesignRoundView } from "@/lib/portal-api";

export function InstructionsScreen({ view, onStart, starting }: { view: SystemDesignRoundView; onStart: () => void; starting: boolean }) {
  const rules = [
    { icon: MousePointerClick, text: "Build your design on a board. Drag AWS components in from the left, connect them in the order a request travels, and set each one's size and settings." },
    {
      icon: Sparkles,
      text: view.ai_enabled
        ? `Run load tests whenever you like to see where your design gives out. Up to ${view.runs_max} runs also get a hint from an AI reviewer. Hints point at the problem without giving the answer.`
        : "Run load tests whenever you like to see where your design gives out under steady load, a spike, and a zone outage.",
    },
    { icon: Send, text: `You have ${view.duration_minutes} minutes, starting when you click Start. Your board saves automatically. Submitting is final and can't be undone.` },
    { icon: Maximize2, text: "This opens in fullscreen. Switching tabs, minimizing, or leaving fullscreen is logged with a timestamp and visible to the hiring manager, so please stay on this screen until you're done." },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">System Design Round</h1>
        <p className="mt-1 text-sm text-zinc-500">You'll design: {view.problem.title}</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {rules.map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
              <Icon className="size-4" />
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{text}</p>
          </div>
        ))}
      </div>

      <Button onClick={onStart} disabled={starting} className="mt-6 w-full">
        {starting ? "Starting…" : "Start System Design Round"}
      </Button>
    </div>
  );
}
