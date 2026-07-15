import { gmailPost } from "./client";

// Gmail's batchModify accepts up to 1000 ids per call; we stay well under
// that to keep individual requests fast and retries cheap.
const BATCH_CHUNK_SIZE = 500;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export interface BulkModifyResult {
  requested: number;
  succeeded: number;
  failed: number;
  errorMessage?: string;
}

async function batchModify(
  accessToken: string,
  ids: string[],
  addLabelIds: string[],
  removeLabelIds: string[],
): Promise<BulkModifyResult> {
  if (ids.length === 0) return { requested: 0, succeeded: 0, failed: 0 };

  const chunks = chunk(ids, BATCH_CHUNK_SIZE);
  let succeeded = 0;
  let failed = 0;
  let lastError: string | undefined;

  for (const idsChunk of chunks) {
    try {
      await gmailPost(accessToken, "/users/me/messages/batchModify", {
        ids: idsChunk,
        addLabelIds,
        removeLabelIds,
      });
      succeeded += idsChunk.length;
    } catch (error) {
      failed += idsChunk.length;
      lastError = error instanceof Error ? error.message : "Unknown Gmail API error";
    }
  }

  return { requested: ids.length, succeeded, failed, errorMessage: lastError };
}

/** Archives messages by removing them from the inbox (recoverable, non-destructive). */
export function archiveMessages(accessToken: string, ids: string[]): Promise<BulkModifyResult> {
  return batchModify(accessToken, ids, [], ["INBOX"]);
}

/**
 * Moves messages to Gmail Trash. This mirrors Gmail's own trash behavior
 * (add TRASH, drop INBOX/UNREAD) and never permanently deletes anything —
 * the user can still recover these from Trash within Gmail's retention window.
 */
export function trashMessages(accessToken: string, ids: string[]): Promise<BulkModifyResult> {
  return batchModify(accessToken, ids, ["TRASH"], ["INBOX", "UNREAD"]);
}
