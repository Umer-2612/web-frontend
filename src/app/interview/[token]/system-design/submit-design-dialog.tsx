"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SubmitSystemDesignEvent } from "@/lib/portal-api";

const STAGE_LABEL: Record<Extract<SubmitSystemDesignEvent, { type: "progress" }>["stage"], string> = {
  simulating: "Running the final load tests…",
  evaluating: "Reviewing your design…",
  saving: "Saving your submission…",
};

/** In-app confirm (a native dialog can drop fullscreen and get logged as leaving the screen), which
 * turns into a progress view once submitting: the final review can take several seconds. */
export function SubmitDesignDialog({
  open,
  submitting,
  stage,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  stage: keyof typeof STAGE_LABEL | null;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !submitting && onCancel()}>
      <DialogContent showCloseButton={false}>
        {submitting ? (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Submitting your design
            </DialogTitle>
            <DialogDescription>{stage ? STAGE_LABEL[stage] : "Starting…"} Please keep this page open.</DialogDescription>
          </DialogHeader>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Submit your design?</DialogTitle>
              <DialogDescription>Your board is tested under steady load, a spike and a zone outage, then sent to the hiring manager. You can&apos;t change it afterward.</DialogDescription>
            </DialogHeader>
            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onCancel}>
                Keep working
              </Button>
              <Button onClick={onConfirm}>{error ? "Try again" : "Submit design"}</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
