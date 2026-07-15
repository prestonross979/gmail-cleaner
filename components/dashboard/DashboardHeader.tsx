"use client";

import { SignOutButton } from "@/components/auth/SignOutButton";

interface DashboardHeaderProps {
  mockMode: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}

export function DashboardHeader({ mockMode, onRefresh, refreshing }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight">Inbox Cleaner</span>
          {mockMode && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">Mock data</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "Scanning…" : "Refresh scan"}
          </button>
          <SignOutButton mockMode={mockMode} />
        </div>
      </div>
    </header>
  );
}
