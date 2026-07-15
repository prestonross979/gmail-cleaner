import type { ParsedMessage } from "@/types/gmail";
import { gmailGet, GmailApiError } from "./client";
import { mapWithConcurrency } from "./concurrency";
import type { MessageRef } from "./list";
import { parseFromHeader, parseListUnsubscribe } from "./parse";

const METADATA_HEADERS = ["From", "Subject", "Date", "List-Unsubscribe", "List-Unsubscribe-Post"];
const METADATA_CONCURRENCY = 8;

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessageMetadataResponse {
  id: string;
  threadId: string;
  internalDate?: string;
  payload?: { headers?: GmailMessageHeader[] };
}

function headerValue(headers: GmailMessageHeader[] | undefined, name: string): string | undefined {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;
}

function buildMetadataPath(id: string): string {
  const params = new URLSearchParams({ format: "metadata" });
  for (const header of METADATA_HEADERS) params.append("metadataHeaders", header);
  return `/users/me/messages/${id}?${params.toString()}`;
}

/**
 * Fetches header-only metadata (From, Subject, Date, unsubscribe headers)
 * for each message id, bounded by METADATA_CONCURRENCY in-flight requests.
 * Full message bodies are never requested. Individual failures are skipped
 * rather than failing the whole scan.
 */
export async function fetchMessagesMetadata(
  accessToken: string,
  refs: MessageRef[],
  onProgress?: (completed: number, total: number) => void,
): Promise<ParsedMessage[]> {
  let completed = 0;

  const results = await mapWithConcurrency(refs, METADATA_CONCURRENCY, async (ref) => {
    try {
      const message = await gmailGet<GmailMessageMetadataResponse>(accessToken, buildMetadataPath(ref.id));
      const headers = message.payload?.headers;
      const from = parseFromHeader(headerValue(headers, "From"));
      const subject = headerValue(headers, "Subject") ?? "(no subject)";
      const unsubscribe = parseListUnsubscribe(
        headerValue(headers, "List-Unsubscribe"),
        headerValue(headers, "List-Unsubscribe-Post"),
      );
      const date = message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null;

      const parsed: ParsedMessage = {
        id: message.id,
        threadId: message.threadId,
        from,
        date,
        subject,
        unsubscribe,
      };
      return parsed;
    } catch (error) {
      if (error instanceof GmailApiError && error.code === "UNAUTHORIZED") throw error;
      return null;
    } finally {
      completed++;
      onProgress?.(completed, refs.length);
    }
  });

  return results.filter((m): m is ParsedMessage => m !== null && Boolean(m.from.email));
}
