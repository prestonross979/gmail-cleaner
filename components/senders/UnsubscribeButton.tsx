"use client";

import { useState } from "react";
import type { UnsubscribeInfo } from "@/types/gmail";
import { isSafeHttpUrl, isSafeMailto } from "@/lib/gmail/parse";

interface UnsubscribeButtonProps {
  unsubscribe: UnsubscribeInfo;
}

/**
 * Surfaces unsubscribe options detected from List-Unsubscribe headers.
 * HTTPS links open in a new tab for the user to complete themselves — this
 * app never submits unsubscribe forms or sends unsubscribe emails on its own.
 */
export function UnsubscribeButton({ unsubscribe }: UnsubscribeButtonProps) {
  const [showMailtoHelp, setShowMailtoHelp] = useState(false);

  const httpUrl = unsubscribe.httpUrl && isSafeHttpUrl(unsubscribe.httpUrl) ? unsubscribe.httpUrl : undefined;
  const mailto = unsubscribe.mailto && isSafeMailto(unsubscribe.mailto) ? unsubscribe.mailto : undefined;

  if (!httpUrl && !mailto) return null;

  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <p className="text-sm font-medium text-foreground">Unsubscribe</p>
      <p className="mt-1 text-xs text-foreground/60">
        This is separate from Archive/Trash — it opens the sender&apos;s own unsubscribe page. We never submit anything on
        your behalf.
      </p>

      {httpUrl && (
        <a
          href={httpUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Open unsubscribe page
        </a>
      )}

      {!httpUrl && mailto && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowMailtoHelp((v) => !v)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground ring-1 ring-border hover:bg-surface"
          >
            Unsubscribe via email
          </button>
          {showMailtoHelp && (
            <p className="mt-2 text-xs text-foreground/60">
              This sender only supports unsubscribing by email. Send an email to{" "}
              <a href={mailto} className="font-medium text-accent underline">
                {mailto.replace(/^mailto:/i, "")}
              </a>{" "}
              from your mail app to opt out — Inbox Cleaner will not send this for you automatically.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
