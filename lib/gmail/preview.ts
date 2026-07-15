import type { SenderPreviewItem } from "@/types/gmail";
import { gmailGet } from "./client";
import { mapWithConcurrency } from "./concurrency";

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessagePreviewResponse {
  id: string;
  internalDate?: string;
  payload?: { headers?: GmailMessageHeader[] };
}

function headerValue(headers: GmailMessageHeader[] | undefined, name: string): string | undefined {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;
}

/**
 * Fetches only Subject + Date for a small set of message ids, for the
 * sender-detail preview list. Never requests message bodies.
 */
export async function fetchSenderPreview(accessToken: string, messageIds: string[]): Promise<SenderPreviewItem[]> {
  const params = new URLSearchParams({ format: "metadata" });
  params.append("metadataHeaders", "Subject");

  const results = await mapWithConcurrency(messageIds, 5, async (id) => {
    try {
      const message = await gmailGet<GmailMessagePreviewResponse>(accessToken, `/users/me/messages/${id}?${params.toString()}`);
      const subject = headerValue(message.payload?.headers, "Subject") ?? "(no subject)";
      const date = message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null;
      return { id: message.id, subject, date } satisfies SenderPreviewItem;
    } catch {
      return null;
    }
  });

  return results.filter((item): item is SenderPreviewItem => item !== null);
}
