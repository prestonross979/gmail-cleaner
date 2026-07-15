"use client";

import type { SenderSummary } from "@/types/gmail";
import { formatRelativeOrDate, pluralize } from "@/lib/utils";

interface SenderRowProps {
  sender: SenderSummary;
  selected: boolean;
  onToggleSelect: (email: string) => void;
  onOpenDetails: (email: string) => void;
}

export function SenderRow({ sender, selected, onToggleSelect, onOpenDetails }: SenderRowProps) {
  const displayName = sender.senderName || sender.senderEmail;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 ring-1 ring-border transition hover:ring-accent/40 sm:gap-4">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(sender.senderEmail)}
        aria-label={`Select emails from ${displayName}`}
        className="h-5 w-5 shrink-0 rounded border-border text-accent focus:ring-2 focus:ring-accent"
      />

      <button
        type="button"
        onClick={() => onOpenDetails(sender.senderEmail)}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            {sender.hasUnsubscribe && (
              <span className="hidden shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent sm:inline-block">
                Unsubscribe available
              </span>
            )}
          </div>
          <p className="truncate text-xs text-foreground/50">
            {sender.senderEmail} · {sender.domain}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            {sender.messageCount} {pluralize(sender.messageCount, "email")}
          </span>
          <span className="text-xs text-foreground/45">{formatRelativeOrDate(sender.mostRecentDate)}</span>
        </div>
      </button>
    </div>
  );
}
