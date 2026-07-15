/**
 * Centralized, typed access to environment configuration.
 */

const DEFAULT_SCAN_LIMIT = 200;

/**
 * Maximum number of messages a single scan will retrieve from Gmail.
 * Keeps local development fast and avoids hammering a large real mailbox.
 * Override with GMAIL_SCAN_LIMIT in .env.local.
 */
export const GMAIL_SCAN_LIMIT = (() => {
  const raw = process.env.GMAIL_SCAN_LIMIT;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_SCAN_LIMIT;
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SCAN_LIMIT;
  return Math.min(parsed, 5000);
})();

/** Preview subjects fetched per sender in the sender-detail view. */
export const SENDER_PREVIEW_COUNT = 5;

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
}
