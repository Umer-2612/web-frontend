"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

import { AiLoader } from "@/components/ui/ai-loader";
import { PortalApiError, portalApi, type SystemDesignRoundView } from "@/lib/portal-api";
import { InstructionsScreen } from "./instructions-screen";
import { SystemDesignWorkspace } from "./system-design-workspace";

export default function SystemDesignRoundPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [view, setView] = useState<SystemDesignRoundView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    portalApi
      .getSystemDesignRound(token)
      .then(setView)
      .catch((err) => setLoadError(err instanceof PortalApiError ? err.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const { started_at } = await portalApi.startSystemDesignRound(token);
      setView((prev) => (prev ? { ...prev, started_at } : prev));
      await document.documentElement.requestFullscreen?.().catch(() => {});
    } finally {
      setStarting(false);
    }
  };

  // Submitted (or already complete on reload): back to the portal, which shows this round as done.
  const handleRoundComplete = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    router.replace(`/interview/${token}`);
  }, [router, token]);

  useEffect(() => {
    if (view?.status === "completed") handleRoundComplete();
  }, [view?.status, handleRoundComplete]);

  if (loading) return <AiLoader fullScreen label="Loading the system design round" />;

  if (loadError || !view) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">This round isn&apos;t available</p>
        <p className="max-w-sm text-sm text-zinc-500">{loadError ?? "Something went wrong."}</p>
      </div>
    );
  }

  if (view.status === "completed") return <AiLoader fullScreen label="Taking you back" />;
  if (!view.started_at) return <InstructionsScreen view={view} onStart={handleStart} starting={starting} />;

  return <SystemDesignWorkspace token={token} initialView={view} onRoundComplete={handleRoundComplete} />;
}
