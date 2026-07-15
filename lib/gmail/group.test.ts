import { describe, expect, it } from "vitest";
import type { ParsedMessage } from "@/types/gmail";
import { groupMessagesBySender } from "./group";

function makeMessage(overrides: Partial<ParsedMessage>): ParsedMessage {
  return {
    id: "msg-1",
    threadId: "thread-1",
    from: { name: "Sender", email: "sender@example.com" },
    date: "2026-01-01T00:00:00.000Z",
    subject: "Subject",
    ...overrides,
  };
}

describe("groupMessagesBySender", () => {
  it("groups messages by normalized sender email and counts them", () => {
    const messages: ParsedMessage[] = [
      makeMessage({ id: "1", from: { name: "LinkedIn", email: "notifications@linkedin.com" } }),
      makeMessage({ id: "2", from: { name: "LinkedIn", email: "Notifications@LinkedIn.com" } }),
      makeMessage({ id: "3", from: { name: "GitHub", email: "notify@github.com" } }),
    ];

    const result = groupMessagesBySender(messages);
    expect(result).toHaveLength(2);

    const linkedin = result.find((s) => s.senderEmail === "notifications@linkedin.com");
    expect(linkedin?.messageCount).toBe(2);
    expect(linkedin?.messageIds).toEqual(["1", "2"]);
  });

  it("tracks the most recent date per sender", () => {
    const messages: ParsedMessage[] = [
      makeMessage({ id: "1", date: "2026-01-01T00:00:00.000Z" }),
      makeMessage({ id: "2", date: "2026-03-01T00:00:00.000Z" }),
      makeMessage({ id: "3", date: "2026-02-01T00:00:00.000Z" }),
    ];

    const [sender] = groupMessagesBySender(messages);
    expect(sender.mostRecentDate).toBe("2026-03-01T00:00:00.000Z");
    expect(sender.messageIds).toEqual(["2", "3", "1"]);
  });

  it("derives the domain from the sender email", () => {
    const [sender] = groupMessagesBySender([makeMessage({ from: { name: "X", email: "a@sub.example.com" } })]);
    expect(sender.domain).toBe("sub.example.com");
  });

  it("marks hasUnsubscribe true when any message has unsubscribe info", () => {
    const messages: ParsedMessage[] = [
      makeMessage({ id: "1", unsubscribe: undefined }),
      makeMessage({ id: "2", unsubscribe: { httpUrl: "https://example.com/unsub", oneClick: false } }),
    ];
    const [sender] = groupMessagesBySender(messages);
    expect(sender.hasUnsubscribe).toBe(true);
    expect(sender.unsubscribe?.httpUrl).toBe("https://example.com/unsub");
  });

  it("skips messages with no resolvable sender email", () => {
    const messages: ParsedMessage[] = [makeMessage({ from: { name: "Nobody", email: "" } })];
    expect(groupMessagesBySender(messages)).toHaveLength(0);
  });

  it("picks the most common display name across messages", () => {
    const messages: ParsedMessage[] = [
      makeMessage({ id: "1", from: { name: "GitHub", email: "notify@github.com" } }),
      makeMessage({ id: "2", from: { name: "GitHub", email: "notify@github.com" } }),
      makeMessage({ id: "3", from: { name: "GitHub Notifications", email: "notify@github.com" } }),
    ];
    const [sender] = groupMessagesBySender(messages);
    expect(sender.senderName).toBe("GitHub");
  });

  it("sorts senders by message count descending", () => {
    const messages: ParsedMessage[] = [
      makeMessage({ id: "1", from: { name: "A", email: "a@example.com" } }),
      makeMessage({ id: "2", from: { name: "B", email: "b@example.com" } }),
      makeMessage({ id: "3", from: { name: "B", email: "b@example.com" } }),
    ];
    const result = groupMessagesBySender(messages);
    expect(result[0].senderEmail).toBe("b@example.com");
    expect(result[1].senderEmail).toBe("a@example.com");
  });
});
