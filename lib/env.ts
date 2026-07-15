/**
 * Centralized, typed access to environment configuration.
 */

const DEFAULT_SCAN_LIMIT = 2000;
// Hard ceiling regardless of what GMAIL_SCAN_LIMIT is set to, so a typo
// (e.g. an extra zero) can't accidentally trigger a scan of the entire
// mailbox in one request. Raise this if you deliberately want more headroom.
const MAX_SCAN_LIMIT = 10000;

/**
 * Maximum number of messages a single scan will retrieve from Gmail.
 * Override with GMAIL_SCAN_LIMIT in .env.local — larger values scan more of
 * your inbox per pass (so bulk archive/trash can cover more senders at
 * once), at the cost of a slower scan and more Gmail API quota used per
 * request, since each message's headers are fetched individually.
 */
export const GMAIL_SCAN_LIMIT = (() => {
  const raw = process.env.GMAIL_SCAN_LIMIT;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_SCAN_LIMIT;
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SCAN_LIMIT;
  return Math.min(parsed, MAX_SCAN_LIMIT);
})();

/** Preview subjects fetched per sender in the sender-detail view. */
export const SENDER_PREVIEW_COUNT = 5;

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
}
