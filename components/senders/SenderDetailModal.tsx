"use client";

import { useEffect, useId, useState } from "react";
import type { SenderPreviewItem, SenderSummary } from "@/types/gmail";
import { Modal } from "@/components/ui/Modal";
import { UnsubscribeButton } from "./UnsubscribeButton";
import { fetchSenderPreview, ApiError } from "@/lib/api/client";
import { formatDate, pluralize } from "@/lib/utils";

interface SenderDetailModalProps {
  sender: SenderSummary | null;
  onClose: () => void;
  onArchiveAll: (sender: SenderSummary) => void;
  onTrashAll: (sender: SenderSummary) => void;
  actionsDisabled: boolean;
}

export function SenderDetailModal({ sender, onClose, onArchiveAll, onTrashAll, actionsDisabled }: SenderDetailModalProps) {
  if (!sender) return null;

  return (
    <SenderDetailModalContent
      // Remounting per sender resets preview state naturally, with no
      // synchronous setState needed inside an effect.
      key={sender.senderEmail}
      sender={sender}
      onClose={onClose}
      onArchiveAll={onArchiveAll}
      onTrashAll={onTrashAll}
      actionsDisabled={actionsDisabled}
    />
  );
}

interface SenderDetailModalContentProps {
  sender: SenderSummary;
  onClose: () => void;
  onArchiveAll: (sender: SenderSummary) => void;
  onTrashAll: (sender: SenderSummary) => void;
  actionsDisabled: boolean;
}

function SenderDetailModalContent({ sender, onClose, onArchiveAll, onTrashAll, actionsDisabled }: SenderDetailModalContentProps) {
  const titleId = useId();
  const [preview, setPreview] = useState<SenderPreviewItem[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchSenderPreview(sender.senderEmail, sender.messageIds)
      .then((items) => {
        if (cancelled) return;
        setPreview(items);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Couldn't load a preview for this sender.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [sender.senderEmail, sender.messageIds]);

  const displayName = sender.senderName || sender.senderEmail;

  return (
    <Modal open onClose={onClose} titleId={titleId}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={titleId} className="truncate text-lg font-semibold text-foreground">
            {displayName}
          </h2>
          <p className="truncate text-sm text-foreground/60">{sender.senderEmail}</p>
          <p className="text-xs text-foreground/45">{sender.domain}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sender details"
          className="shrink-0 rounded-lg p-2 text-foreground/50 hover:bg-surface-muted hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-surface-muted p-3">
          <p className="text-xs text-foreground/50">Emails in this scan</p>
          <p className="mt-0.5 text-base font-semibold">{sender.messageCount}</p>
        </div>
        <div className="rounded-xl bg-surface-muted p-3">
          <p className="text-xs text-foreground/50">Most recent</p>
          <p className="mt-0.5 text-base font-semibold">{formatDate(sender.mostRecentDate)}</p>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-foreground">Recent subjects</h3>
        {status === "loading" && (
          <ul className="mt-2 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="h-4 w-full animate-pulse rounded bg-surface-muted" />
            ))}
          </ul>
        )}
        {status === "error" && <p className="mt-2 text-sm text-danger">{errorMessage}</p>}
        {status === "ready" && preview.length === 0 && <p className="mt-2 text-sm text-foreground/50">No preview available.</p>}
        {status === "ready" && preview.length > 0 && (
          <ul className="mt-2 space-y-2">
            {preview.map((item) => (
              <li key={item.id} className="rounded-lg bg-surface-muted p-2.5 text-sm">
                <p className="truncate text-foreground">{item.subject}</p>
                <p className="text-xs text-foreground/45">{formatDate(item.date)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {sender.unsubscribe && (
        <div className="mt-5">
          <UnsubscribeButton unsubscribe={sender.unsubscribe} />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={() => onArchiveAll(sender)}
          className="flex-1 rounded-lg bg-surface-muted px-4 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border hover:bg-border disabled:cursor-not-allowed disabled:opacity-60"
        >
          Archive all {sender.messageCount} {pluralize(sender.messageCount, "email")}
        </button>
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={() => onTrashAll(sender)}
          className="flex-1 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-danger-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Move all to Trash
        </button>
      </div>
    </Modal>
  );
}
