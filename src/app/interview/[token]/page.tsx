"use client";

import { CheckCircle2, ChevronRight, Circle, Code2, Lock, MessageSquareCode, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { AiLoader } from "@/components/ui/ai-loader";
import { PortalApiError, portalApi, type InterviewRoundType, type PortalOverview } from "@/lib/portal-api";

const ROUND_META: Record<InterviewRoundType, { label: string; icon: typeof Code2; href: (token: string) => string }> = {
  dsa: { label: "DSA Round", icon: Code2, href: (token) => `/interview/${token}/dsa` },
  vscode: { label: "VSCode Bug Fix", icon: MonitorSmartphone, href: () => "#" },
  technical_ai: { label: "AI Technical Round", icon: MessageSquareCode, href: () => "#" },
};

export default function InterviewPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [portal, setPortal] = useState<PortalOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    portalApi
      .getPortal(token)
      .then(setPortal)
      .catch((err) => setError(err instanceof PortalApiError ? err.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <AiLoader fullScreen label="Loading your interview" />;

  if (error || !portal) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">This interview link isn&apos;t valid</p>
        <p className="max-w-sm text-sm text-zinc-500">{error ?? "Double-check the link, or ask the hiring manager to resend it."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <p className="text-sm text-zinc-500">Welcome,</p>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{portal.candidate_name}</h1>
        <p className="mt-1 text-sm text-zinc-500">Interviewing for {portal.job_title}</p>
      </div>

      <div className="space-y-3">
        {portal.rounds.map((round) => {
          const meta = ROUND_META[round.round_type];
          const Icon = meta.icon;
          const isDsa = round.round_type === "dsa";
          const isDone = round.status === "completed";
          const isClickable = isDsa && !isDone;

          const cardStyle = isDone
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/10"
            : isClickable
              ? "border-zinc-200 bg-white hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700"
              : "border-zinc-100 bg-zinc-50 opacity-60 dark:border-zinc-900 dark:bg-zinc-950";

          const content = (
            <div className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors ${cardStyle}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{meta.label}</p>
                <p className="text-xs text-zinc-500">
                  {isDone ? "Complete" : isClickable ? "Ready to start" : "Coming soon"}
                </p>
              </div>
              {isDone ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
              ) : isClickable ? (
                <ChevronRight className="size-5 shrink-0 text-zinc-400" />
              ) : (
                <Lock className="size-4 shrink-0 text-zinc-400" />
              )}
            </div>
          );

          if (!isClickable) {
            return <div key={round.id}>{content}</div>;
          }

          return (
            <Link key={round.id} href={meta.href(token)}>
              {content}
            </Link>
          );
        })}
      </div>

      <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-400">
        <Circle className="size-1.5 fill-current" /> Complete every round before your interview is marked done.
      </p>
    </div>
  );
}
