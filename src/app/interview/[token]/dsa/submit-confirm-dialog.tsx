"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** In-app replacement for window.confirm: the native dialog can pull the browser out of
 * fullscreen and blur the tab, which the focus-loss proctoring would log against the candidate. */
export function SubmitConfirmDialog({
  open,
  questionTitle,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  questionTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Submit your solution?</DialogTitle>
          <DialogDescription>
            &ldquo;{questionTitle}&rdquo; will be graded against all test cases. Once you submit, you can&apos;t change it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>
            Keep working
          </Button>
          <Button onClick={onConfirm}>Submit solution</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
