"use client";

import { pluralize } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  onArchive: () => void;
  onTrash: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export function BulkActionBar({ selectedCount, onArchive, onTrash, onClear, disabled }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-0 z-30 -mx-5 mt-4 border-t border-border bg-surface/95 px-5 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">
          {selectedCount} {pluralize(selectedCount, "sender")} selected
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/60 hover:bg-surface-muted"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onArchive}
            className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-border hover:bg-border disabled:cursor-not-allowed disabled:opacity-60"
          >
            Archive
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onTrash}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  );
}
