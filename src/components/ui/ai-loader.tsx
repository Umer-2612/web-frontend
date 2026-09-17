import { CheckCircle2, MessageSquareText, Mic, Sparkles, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

interface AiLoaderProps {
  fullScreen?: boolean;
  label?: string;
  className?: string;
}

export function AiLoader({ fullScreen = false, label, className }: AiLoaderProps) {
  const displayLabel = label ?? "Loading";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 px-6",
        fullScreen ? "min-h-dvh" : "min-h-[52vh]",
        className,
      )}
    >
      <div className="relative flex h-36 w-36 items-center justify-center">
        <span className="absolute inset-5 rounded-[2rem] border border-indigo-500/10 bg-indigo-500/[0.03] shadow-[0_24px_80px_rgba(79,70,229,0.18)] dark:border-indigo-400/10 dark:bg-indigo-400/[0.04]" />
        <span className="absolute h-28 w-28 animate-ping rounded-full border border-indigo-500/15 motion-reduce:animate-none" />
        <span
          className="absolute h-24 w-24 animate-spin rounded-full border border-transparent border-t-indigo-500/70 border-r-cyan-400/70 motion-reduce:animate-none"
          style={{ animationDuration: "2.8s" }}
        />

        <SignalBadge className="top-3 left-8" delay="0s" icon={<Mic size={14} />} />
        <SignalBadge className="top-11 right-2" delay="0.2s" icon={<MessageSquareText size={14} />} />
        <SignalBadge className="right-3 bottom-8" delay="0.4s" icon={<CheckCircle2 size={14} />} />

        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/60 bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 shadow-2xl shadow-indigo-500/30 dark:border-white/10">
          <UserRound size={25} className="text-white" />
          <span className="absolute -bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white dark:border-zinc-950">
            <Sparkles size={12} />
          </span>
        </div>
      </div>

      <div className="flex w-48 flex-col items-center gap-3">
        <div className="flex h-11 w-full items-end justify-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {[18, 11, 23, 15, 26, 14, 21].map((height, index) => (
            <span
              key={index}
              className="w-1.5 animate-pulse rounded-full bg-gradient-to-t from-indigo-600 to-cyan-400 motion-reduce:animate-none"
              style={{
                height,
                animationDelay: `${index * 0.12}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>

        <p className="text-center text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
          {displayLabel}
        </p>
      </div>
    </div>
  );
}

/** Compact spinner for inline use inside tables / conditional blocks */
export function AiSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-10", className)}>
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute h-11 w-11 animate-spin rounded-2xl border border-transparent border-t-indigo-500 border-r-cyan-400 motion-reduce:animate-none" />
        <span className="absolute h-9 w-9 animate-ping rounded-full bg-indigo-500/10 motion-reduce:animate-none" />
        <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/25">
          <Mic size={13} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function SignalBadge({ icon, className, delay }: { icon: React.ReactNode; className: string; delay: string }) {
  return (
    <span
      className={cn(
        "absolute z-20 flex h-9 w-9 animate-pulse items-center justify-center rounded-xl border border-white/70 bg-white text-indigo-600 shadow-lg shadow-indigo-500/15 motion-reduce:animate-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-cyan-300",
        className,
      )}
      style={{ animationDelay: delay }}
    >
      {icon}
    </span>
  );
}
