export function LoadingSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Scanning your mailbox">
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
  );
}
