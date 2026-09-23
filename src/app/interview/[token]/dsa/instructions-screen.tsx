import { CheckCircle2, Clock, Maximize2, Lock as LockIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DsaRoundView } from "@/lib/portal-api";

const RULES = [
  { icon: Clock, text: "You'll get 2 coding questions and 60 minutes total to work on both, starting the moment you click Start." },
  { icon: CheckCircle2, text: "Each question shows a few worked-example test cases. The rest are hidden and used to grade your solution, you'll see how many pass." },
  { icon: LockIcon, text: "Submitting a question locks in that code, it can't be edited afterward. You can submit each question separately." },
  { icon: Maximize2, text: "This opens in fullscreen once you start. Please don't exit it or navigate away until you're done." },
];

export function InstructionsScreen({
  view,
  onStart,
  starting,
}: {
  view: DsaRoundView;
  onStart: () => void;
  starting: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">DSA Round</h1>
        <p className="mt-1 text-sm text-zinc-500">{view.questions.length} questions before you begin</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {RULES.map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
              <Icon className="size-4" />
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{text}</p>
          </div>
        ))}
      </div>

      <Button onClick={onStart} disabled={starting} className="mt-6 w-full">
        {starting ? "Starting…" : "Start DSA Round"}
      </Button>
    </div>
  );
}
