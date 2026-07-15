import type { ScanResult, SenderPreviewItem, SenderSummary } from "@/types/gmail";

interface MockSenderSeed {
  name: string;
  email: string;
  count: number;
  daysAgo: number;
  unsubscribe?: SenderSummary["unsubscribe"];
  subjects: string[];
}

const SEEDS: MockSenderSeed[] = [
  {
    name: "LinkedIn",
    email: "notifications@linkedin.com",
    count: 128,
    daysAgo: 0,
    unsubscribe: { httpUrl: "https://www.linkedin.com/psettings/unsubscribe", oneClick: true },
    subjects: ["You appeared in 9 searches this week", "New jobs matching your profile", "Someone viewed your profile"],
  },
  {
    name: "Amazon.com",
    email: "order-update@amazon.com",
    count: 64,
    daysAgo: 1,
    unsubscribe: undefined,
    subjects: ["Your package has shipped", "Delivered: your Amazon package", "Order confirmation #112-9384756"],
  },
  {
    name: "Medium Daily Digest",
    email: "noreply@medium.com",
    count: 95,
    daysAgo: 2,
    unsubscribe: { httpUrl: "https://medium.com/m/unsubscribe?newsletterV3=abc123", oneClick: true },
    subjects: ["Stories for you: React, TypeScript, and more", "Your weekly reading digest", "Trending on Medium today"],
  },
  {
    name: "Twitter",
    email: "info@twitter.com",
    count: 41,
    daysAgo: 5,
    unsubscribe: { httpUrl: "https://twitter.com/settings/notifications/unsubscribe", oneClick: false },
    subjects: ["You have new notifications", "See what you missed", "Trends for you"],
  },
  {
    name: "GitHub",
    email: "notifications@github.com",
    count: 210,
    daysAgo: 0,
    unsubscribe: { mailto: "mailto:unsubscribe+abc123@github.com", oneClick: false },
    subjects: ["[repo] New issue opened", "[repo] Pull request merged", "Weekly digest for your repositories"],
  },
  {
    name: "The New York Times",
    email: "nytdirect@nytimes.com",
    count: 58,
    daysAgo: 3,
    unsubscribe: { httpUrl: "https://www.nytimes.com/newsletters/unsubscribe", oneClick: true },
    subjects: ["Breaking News: today's top stories", "The Morning: what to know today", "Opinion: today's must-reads"],
  },
  {
    name: "Figma",
    email: "notify@figma.com",
    count: 23,
    daysAgo: 7,
    unsubscribe: { httpUrl: "https://www.figma.com/settings/unsubscribe", oneClick: true },
    subjects: ["New comments on your file", "Someone shared a file with you"],
  },
  {
    name: "Delta Air Lines",
    email: "deltaairlines@t.delta.com",
    count: 17,
    daysAgo: 14,
    unsubscribe: { httpUrl: "https://t.delta.com/unsubscribe", oneClick: false },
    subjects: ["Check in now for your upcoming flight", "Fare sale: save on your next trip"],
  },
  {
    name: "Slack",
    email: "feedback@slack.com",
    count: 12,
    daysAgo: 20,
    unsubscribe: undefined,
    subjects: ["Your weekly workspace summary", "New features in Slack"],
  },
  {
    name: "Zillow",
    email: "no-reply@zillow.com",
    count: 33,
    daysAgo: 4,
    unsubscribe: { httpUrl: "https://www.zillow.com/user/unsubscribe", oneClick: true },
    subjects: ["New listings matching your search", "Price drop on a saved home"],
  },
];

interface MockMessageState {
  id: string;
  date: string;
  subject: string;
  status: "inbox" | "archived" | "trashed";
}

interface MockSenderState {
  senderEmail: string;
  senderName: string;
  domain: string;
  unsubscribe?: SenderSummary["unsubscribe"];
  messages: MockMessageState[];
}

function buildInitialStore(): Map<string, MockSenderState> {
  const store = new Map<string, MockSenderState>();
  for (const seed of SEEDS) {
    const messages: MockMessageState[] = Array.from({ length: seed.count }, (_, i) => {
      const daysOffset = seed.daysAgo + i * 0.3;
      const date = new Date(Date.now() - daysOffset * 24 * 60 * 60 * 1000).toISOString();
      return {
        id: `${seed.email}-${i}`,
        date,
        subject: seed.subjects[i % seed.subjects.length],
        status: "inbox",
      };
    });
    store.set(seed.email, {
      senderEmail: seed.email,
      senderName: seed.name,
      domain: seed.email.split("@")[1] ?? "",
      unsubscribe: seed.unsubscribe,
      messages,
    });
  }
  return store;
}

// Module-level state so repeated calls within the same dev server process
// reflect prior mock archive/trash actions. Resets on server restart.
const globalForMock = globalThis as unknown as { __mockGmailStore?: Map<string, MockSenderState> };
const store = globalForMock.__mockGmailStore ?? buildInitialStore();
globalForMock.__mockGmailStore = store;

export function getMockScanResult(): ScanResult {
  const senders: SenderSummary[] = [];
  for (const sender of store.values()) {
    const active = sender.messages.filter((m) => m.status === "inbox");
    if (active.length === 0) continue;
    const sorted = [...active].sort((a, b) => b.date.localeCompare(a.date));
    senders.push({
      senderEmail: sender.senderEmail,
      senderName: sender.senderName,
      domain: sender.domain,
      messageCount: sorted.length,
      mostRecentDate: sorted[0]?.date ?? null,
      hasUnsubscribe: Boolean(sender.unsubscribe),
      unsubscribe: sender.unsubscribe,
      messageIds: sorted.map((m) => m.id),
    });
  }
  senders.sort((a, b) => b.messageCount - a.messageCount);

  const scannedCount = senders.reduce((sum, s) => sum + s.messageCount, 0);

  return {
    senders,
    scannedCount,
    limit: scannedCount,
    truncated: false,
    scannedAt: new Date().toISOString(),
  };
}

export function getMockPreview(senderEmail: string, messageIds: string[]): SenderPreviewItem[] {
  const sender = store.get(senderEmail);
  if (!sender) return [];
  const idSet = new Set(messageIds);
  return sender.messages
    .filter((m) => idSet.has(m.id))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((m) => ({ id: m.id, subject: m.subject, date: m.date }));
}

function updateMockMessages(senderEmail: string, messageIds: string[], status: "archived" | "trashed") {
  const sender = store.get(senderEmail);
  if (!sender) return { requested: messageIds.length, succeeded: 0, failed: messageIds.length };
  const idSet = new Set(messageIds);
  let succeeded = 0;
  for (const message of sender.messages) {
    if (idSet.has(message.id) && message.status === "inbox") {
      message.status = status;
      succeeded++;
    }
  }
  return { requested: messageIds.length, succeeded, failed: messageIds.length - succeeded };
}

export function mockArchive(senderEmail: string, messageIds: string[]) {
  return updateMockMessages(senderEmail, messageIds, "archived");
}

export function mockTrash(senderEmail: string, messageIds: string[]) {
  return updateMockMessages(senderEmail, messageIds, "trashed");
}
