"use client";

import { useId } from "react";
import { Modal } from "./Modal";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  details?: string[];
  confirmLabel: string;
  tone?: "danger" | "default";
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel,
  tone = "default",
  isSubmitting = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onCancel} titleId={titleId}>
      <h2 id={titleId} className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm text-foreground/70">{description}</p>

      {details && details.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-surface-muted p-3 text-sm text-foreground/80">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-foreground/60">
        Emails moved to Trash are not deleted immediately — you can still recover them from Gmail&apos;s Trash folder.
      </p>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/80 ring-1 ring-border hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60",
            tone === "danger" ? "bg-danger hover:bg-danger/90" : "bg-accent hover:bg-accent/90",
          )}
        >
          {isSubmitting ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
