import { Check, Copy, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { OutputLine } from "./types";

const LINE_COLOR: Record<OutputLine["type"], string> = {
  error: "text-red-400",
  warn: "text-amber-400",
  result: "text-emerald-400",
  log: "text-zinc-300",
};

/** Styled like VSCode's own integrated terminal: dark regardless of the page's
 * light/dark mode (matching the editor's vs-dark theme and TestResultsPanel),
 * gutter line numbers, and auto-scroll to the latest line as output streams in. */
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
  const outputEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ block: "end" });
  }, [output]);

  const copyOutput = () => {
    navigator.clipboard.writeText(output.map((line) => line.content).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid h-full grid-cols-2 bg-zinc-950">
      <div className="flex flex-col border-r border-zinc-800">
        <div className="border-b border-zinc-800 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
          Stdin
        </div>
        <textarea
          value={stdin}
          onChange={(e) => onStdinChange(e.target.value)}
          placeholder="stdin passed to your program…"
          disabled={disabled}
          spellCheck={false}
          className="min-h-0 flex-1 resize-none bg-transparent px-3 py-2 font-mono text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none"
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
            <Terminal className="size-3.5" /> Output
          </span>
          {output.length > 0 && (
            <button
              onClick={copyOutput}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" /> Copy
                </>
              )}
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-xs">
          {output.length === 0 ? (
            <p className="text-zinc-600">Run your code to see output here.</p>
          ) : (
            <>
              {output.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-4 shrink-0 text-right text-zinc-700 select-none">{i + 1}</span>
                  <span className={`whitespace-pre-wrap ${LINE_COLOR[line.type]}`}>{line.content}</span>
                </div>
              ))}
              <div ref={outputEndRef} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
