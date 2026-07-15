interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

export function ErrorState({ message, onRetry, retryLabel = "Try again" }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-10 text-center ring-1 ring-danger/30">
      <h3 className="text-base font-semibold text-danger">Something went wrong</h3>
      <p className="max-w-sm text-sm text-foreground/60">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        {retryLabel}
      </button>
    </div>
  );
}
