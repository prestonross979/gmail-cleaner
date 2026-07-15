import { gmailGet } from "./client";

interface GmailListMessagesResponse {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface MessageRef {
  id: string;
  threadId: string;
}

/**
 * Lists up to `limit` message ids in the mailbox (most recent first, Gmail's
 * default ordering), paginating internally as needed. Only ids/threadIds are
 * retrieved here — no metadata, no bodies.
 */
export async function listMessageIds(
  accessToken: string,
  options: { limit: number; query?: string; labelIds?: string[] } = { limit: 200 },
): Promise<{ refs: MessageRef[]; truncated: boolean }> {
  const refs: MessageRef[] = [];
  let pageToken: string | undefined;
  let truncated = false;

  do {
    const remaining = options.limit - refs.length;
    if (remaining <= 0) break;

    const params = new URLSearchParams({
      maxResults: String(Math.min(remaining, 100)),
    });
    if (options.query) params.set("q", options.query);
    for (const labelId of options.labelIds ?? []) params.append("labelIds", labelId);
    if (pageToken) params.set("pageToken", pageToken);

    const page = await gmailGet<GmailListMessagesResponse>(accessToken, `/users/me/messages?${params.toString()}`);

    for (const message of page.messages ?? []) {
      refs.push(message);
    }

    pageToken = page.nextPageToken;
    if (refs.length >= options.limit && pageToken) {
      truncated = true;
      break;
    }
  } while (pageToken);

  return { refs: refs.slice(0, options.limit), truncated };
}
