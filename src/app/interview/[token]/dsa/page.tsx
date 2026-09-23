"use client";

import { CheckCircle2 } from "lucide-react";
import { use, useCallback, useEffect, useState } from "react";

import { AiLoader } from "@/components/ui/ai-loader";
import { PortalApiError, portalApi, type DsaRoundView } from "@/lib/portal-api";
import { DsaWorkspace } from "./dsa-workspace";
import { InstructionsScreen } from "./instructions-screen";

export default function DsaRoundPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [view, setView] = useState<DsaRoundView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await portalApi.getDsaRound(token);
      setView(data);
    } catch (err) {
      setLoadError(err instanceof PortalApiError ? err.message : "Something went wrong");
    }
  }, [token]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const { started_at } = await portalApi.startDsaRound(token);
      setView((prev) => (prev ? { ...prev, started_at } : prev));
      await document.documentElement.requestFullscreen?.().catch(() => {});
    } finally {
      setStarting(false);
    }
  };

  const handleRoundComplete = useCallback(() => {
    setRoundComplete(true);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  if (loading) return <AiLoader fullScreen label="Loading the DSA round" />;

  if (loadError || !view) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">This round isn&apos;t available</p>
        <p className="max-w-sm text-sm text-zinc-500">{loadError ?? "Something went wrong."}</p>
      </div>
    );
  }

  if (roundComplete || view.status === "completed") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <CheckCircle2 className="size-12 text-emerald-500" />
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">DSA round complete</p>
        <p className="max-w-sm text-sm text-zinc-500">Both questions have been submitted. You can close this tab now.</p>
      </div>
    );
  }

  if (!view.started_at) {
    return <InstructionsScreen view={view} onStart={handleStart} starting={starting} />;
  }

  return <DsaWorkspace token={token} initialView={view} onRoundComplete={handleRoundComplete} />;
}
