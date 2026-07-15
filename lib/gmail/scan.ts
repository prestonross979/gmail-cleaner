import type { ScanResult } from "@/types/gmail";
import { groupMessagesBySender } from "./group";
import { listMessageIds } from "./list";
import { fetchMessagesMetadata } from "./metadata";

/**
 * Full scan pipeline: list message ids (capped at `limit`), fetch header
 * metadata only, then group by sender. Never touches message bodies.
 */
export async function scanMailbox(accessToken: string, limit: number): Promise<ScanResult> {
  // Scoped to the inbox: this is an inbox-cleanup tool, and it keeps archive
  // actions consistent (archived messages drop out of the next scan).
  const { refs, truncated } = await listMessageIds(accessToken, { limit, labelIds: ["INBOX"] });
  const messages = await fetchMessagesMetadata(accessToken, refs);
  const senders = groupMessagesBySender(messages);

  return {
    senders,
    scannedCount: refs.length,
    limit,
    truncated,
    scannedAt: new Date().toISOString(),
  };
}
