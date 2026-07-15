import type { ParsedMessage, SenderSummary } from "@/types/gmail";
import { extractDomain, normalizeSenderEmail } from "./parse";

/**
 * Groups parsed messages by normalized sender email address, computing
 * per-sender counts, most-recent date, and unsubscribe availability.
 * Messages within each sender are ordered most-recent-first.
 */
export function groupMessagesBySender(messages: ParsedMessage[]): SenderSummary[] {
  interface Accumulator {
    senderEmail: string;
    names: Map<string, number>;
    domain: string;
    mostRecentDate: string | null;
    hasUnsubscribe: boolean;
    unsubscribe?: SenderSummary["unsubscribe"];
    unsubscribeDate: string | null;
    entries: { id: string; date: string | null }[];
  }

  const bySender = new Map<string, Accumulator>();

  for (const message of messages) {
    const email = normalizeSenderEmail(message.from.email);
    if (!email) continue;

    let acc = bySender.get(email);
    if (!acc) {
      acc = {
        senderEmail: email,
        names: new Map(),
        domain: extractDomain(email),
        mostRecentDate: null,
        hasUnsubscribe: false,
        unsubscribeDate: null,
        entries: [],
      };
      bySender.set(email, acc);
    }

    if (message.from.name) {
      acc.names.set(message.from.name, (acc.names.get(message.from.name) ?? 0) + 1);
    }

    if (message.date && (!acc.mostRecentDate || message.date > acc.mostRecentDate)) {
      acc.mostRecentDate = message.date;
    }

    if (message.unsubscribe) {
      // Prefer the unsubscribe info attached to the most recent message seen.
      if (!acc.unsubscribeDate || (message.date && message.date > acc.unsubscribeDate)) {
        acc.unsubscribe = message.unsubscribe;
        acc.unsubscribeDate = message.date;
      }
      acc.hasUnsubscribe = true;
    }

    acc.entries.push({ id: message.id, date: message.date });
  }

  const summaries: SenderSummary[] = [];
  for (const acc of bySender.values()) {
    const bestName = [...acc.names.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const sortedEntries = [...acc.entries].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });

    summaries.push({
      senderEmail: acc.senderEmail,
      senderName: bestName,
      domain: acc.domain,
      messageCount: acc.entries.length,
      mostRecentDate: acc.mostRecentDate,
      hasUnsubscribe: acc.hasUnsubscribe,
      unsubscribe: acc.unsubscribe,
      messageIds: sortedEntries.map((e) => e.id),
    });
  }

  return summaries.sort((a, b) => b.messageCount - a.messageCount);
}
