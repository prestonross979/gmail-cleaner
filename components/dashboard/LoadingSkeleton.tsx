export function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Scanning your mailbox">
      <p className="text-sm text-foreground/60">
        Scanning your inbox — this can take a few minutes for large mailboxes, since each message&apos;s headers are
        checked individually. No need to reload.
      </p>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl bg-surface p-4 ring-1 ring-border">
            <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-surface-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 animate-pulse rounded bg-surface-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
            </div>
            <div className="h-6 w-10 animate-pulse rounded bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
