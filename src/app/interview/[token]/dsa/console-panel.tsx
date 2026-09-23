import { Terminal } from "lucide-react";

import type { OutputLine } from "./types";

export function ConsolePanel({
  stdin,
  onStdinChange,
  output,
  disabled,
}: {
  stdin: string;
  onStdinChange: (value: string) => void;
  output: OutputLine[];
  disabled: boolean;
}) {
  return (
    <div className="grid h-full grid-cols-2">
      <div className="flex flex-col border-r border-zinc-200 dark:border-zinc-800">
        <div className="border-b border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:border-zinc-800">Input</div>
        <textarea
          value={stdin}
          onChange={(e) => onStdinChange(e.target.value)}
          placeholder="stdin passed to your program…"
          disabled={disabled}
          className="min-h-0 flex-1 resize-none bg-transparent px-3 py-2 font-mono text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none dark:text-zinc-300"
        />
      </div>
      <div className="flex flex-col">
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
  );
}
