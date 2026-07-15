"use client";

import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, mockMode = false }: { className?: string; mockMode?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => (mockMode ? (window.location.href = "/") : signOut({ callbackUrl: "/" }))}
      className={cn("rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-muted hover:text-foreground", className)}
    >
      Sign out
    </button>
  );
}
