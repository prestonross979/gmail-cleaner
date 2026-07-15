"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ConnectGmailButtonProps {
  className?: string;
  mockMode?: boolean;
}

export function ConnectGmailButton({ className, mockMode = false }: ConnectGmailButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    if (mockMode) {
      window.location.href = "/dashboard";
      return;
    }
    setIsPending(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-semibold text-accent-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <GoogleIcon />
      {isPending ? "Connecting…" : "Connect Gmail"}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12s3.36-7.27 7.19-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.19 2C6.42 2 2.03 6.8 2.03 12s4.39 10 10.16 10c5.52 0 9.71-3.87 9.71-9.6 0-1.05-.16-1.97-.16-1.97Z"
      />
    </svg>
  );
}
