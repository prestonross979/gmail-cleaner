/**
 * Shared Gmail domain types. No message bodies are ever represented here —
 * only metadata (headers, ids, dates) flows through this app.
 */

export interface UnsubscribeInfo {
  /** Safe https/http unsubscribe link extracted from List-Unsubscribe, if present. */
  httpUrl?: string;
  /** mailto: unsubscribe address extracted from List-Unsubscribe, if present. */
  mailto?: string;
  /** True when List-Unsubscribe-Post advertises RFC 8058 one-click support. */
  oneClick: boolean;
}

export interface ParsedSender {
  name: string;
  /** Normalized (lowercased, trimmed) email address. */
  email: string;
}

export interface ParsedMessage {
  id: string;
  threadId: string;
  from: ParsedSender;
  date: string | null;
  subject: string;
  unsubscribe?: UnsubscribeInfo;
}

export interface SenderSummary {
  senderEmail: string;
  senderName: string;
  domain: string;
  messageCount: number;
  /** ISO date string of the most recent message from this sender in the scan. */
  mostRecentDate: string | null;
  hasUnsubscribe: boolean;
  unsubscribe?: UnsubscribeInfo;
  /** Message ids from this scan, most-recent-first. Metadata only, never bodies. */
  messageIds: string[];
}

export interface ScanResult {
  senders: SenderSummary[];
  scannedCount: number;
  limit: number;
  truncated: boolean;
  scannedAt: string;
}

export interface SenderPreviewItem {
  id: string;
  subject: string;
  date: string | null;
}

export type BulkActionType = "archive" | "trash";

export interface SenderActionRequestItem {
  email: string;
  messageIds: string[];
}

export interface SenderActionResultItem {
  email: string;
  requested: number;
  succeeded: number;
  failed: number;
  errorMessage?: string;
}

export interface SenderActionResponse {
  action: BulkActionType;
  results: SenderActionResultItem[];
}
